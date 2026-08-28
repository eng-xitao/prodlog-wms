import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/AuthContext";

const STATUS_LABEL = { pendente: "Pendente", conferido: "Conferido", finalizado: "Finalizado" };
const STATUS_COLOR = { pendente: "var(--amber)", conferido: "var(--blue, #2563EB)", finalizado: "var(--green)" };

export default function RecebimentoPage() {
  const { company } = useAuth();
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [receivings, setReceivings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [supplierId, setSupplierId] = useState("");
  const [document, setDocument] = useState("");
  const [items, setItems] = useState([{ productId: "", quantity: "" }]);
  const [saving, setSaving] = useState(false);

  const [warehouseByReceiving, setWarehouseByReceiving] = useState({});

  async function loadAll() {
    setLoading(true);
    const [{ data: sup }, { data: prod }, { data: wh }, { data: recs }] = await Promise.all([
      supabase.from("suppliers").select("id, code, name").order("name"),
      supabase.from("products").select("id, sku, name, unit").order("name"),
      supabase.from("warehouses").select("id, name").order("name"),
      supabase
        .from("wms_receivings")
        .select("id, code, document, status, created_at, received_at, suppliers:supplier_id (name), wms_receiving_items (id, product_id, quantity_expected, quantity_received, products:product_id (sku, name, unit))")
        .order("created_at", { ascending: false })
        .limit(50),
    ]);
    setSuppliers(sup ?? []);
    setProducts(prod ?? []);
    setWarehouses(wh ?? []);
    setReceivings(recs ?? []);
    setLoading(false);
  }

  useEffect(() => { if (company?.id) loadAll(); }, [company?.id]);

  function updateItem(i, field, value) {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, [field]: value } : it)));
  }
  function addItemRow() { setItems((prev) => [...prev, { productId: "", quantity: "" }]); }
  function removeItemRow(i) { setItems((prev) => prev.filter((_, idx) => idx !== i)); }

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    const validItems = items.filter((it) => it.productId && Number(it.quantity) > 0);
    if (validItems.length === 0) { setError("Adicione pelo menos um item com quantidade."); return; }
    setSaving(true);

    const { data: code } = await supabase.rpc("next_wms_receiving_code", { p_company_id: company.id });
    const { data: receiving, error: recError } = await supabase
      .from("wms_receivings")
      .insert({ company_id: company.id, code, supplier_id: supplierId || null, document: document || null })
      .select("id").single();

    if (recError) { setError(recError.message); setSaving(false); return; }

    await supabase.from("wms_receiving_items").insert(
      validItems.map((it) => ({
        company_id: company.id, receiving_id: receiving.id,
        product_id: it.productId, quantity_expected: Number(it.quantity),
      }))
    );

    setSupplierId(""); setDocument(""); setItems([{ productId: "", quantity: "" }]);
    setSaving(false);
    await loadAll();
  }

  async function confirmReceiving(receiving) {
    const warehouseId = warehouseByReceiving[receiving.id];
    if (!warehouseId) { setError("Escolha o almoxarifado de destino antes de confirmar."); return; }
    setError("");

    for (const item of receiving.wms_receiving_items) {
      const qty = Number(item.quantity_expected);
      await supabase.from("wms_receiving_items").update({ quantity_received: qty }).eq("id", item.id);

      const { data: level } = await supabase
        .from("stock_levels").select("id, quantity")
        .eq("product_id", item.product_id).eq("warehouse_id", warehouseId).is("location_id", null).maybeSingle();

      if (level) {
        await supabase.from("stock_levels").update({ quantity: Number(level.quantity) + qty }).eq("id", level.id);
      } else {
        await supabase.from("stock_levels").insert({ company_id: company.id, product_id: item.product_id, warehouse_id: warehouseId, quantity: qty });
      }

      await supabase.from("stock_movements").insert({
        company_id: company.id, product_id: item.product_id, warehouse_id: warehouseId,
        movement_type: "entrada", quantity: qty, reference_type: "recebimento", reference_code: receiving.code,
      });
    }

    await supabase.from("wms_receivings").update({ status: "finalizado", received_at: new Date().toISOString() }).eq("id", receiving.id);
    await loadAll();
  }

  return (
    <div>
      <header style={{ marginBottom: 20 }}>
        <h1 style={styles.title}>Recebimento</h1>
        <p style={styles.subtitle}>Registre a chegada de material do fornecedor — ao confirmar, o estoque entra sozinho.</p>
      </header>

      {error && <div style={styles.error}>{error}</div>}

      <form onSubmit={handleCreate} style={styles.form}>
        <p style={styles.formTitle}>Novo recebimento</p>
        <div style={styles.row}>
          <select style={styles.input} value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
            <option value="">Fornecedor (opcional)...</option>
            {suppliers.map((s) => <option key={s.id} value={s.id}>{s.code} — {s.name}</option>)}
          </select>
          <input style={styles.input} placeholder="Nº do documento/NF (opcional)" value={document} onChange={(e) => setDocument(e.target.value)} />
        </div>

        {items.map((it, i) => (
          <div key={i} style={styles.itemRow}>
            <select style={styles.input} value={it.productId} onChange={(e) => updateItem(i, "productId", e.target.value)} required>
              <option value="">Produto...</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>)}
            </select>
            <input style={{ ...styles.input, width: 110 }} type="number" step="any" placeholder="Qtd." value={it.quantity} onChange={(e) => updateItem(i, "quantity", e.target.value)} required />
            {items.length > 1 && <button type="button" style={styles.removeBtn} onClick={() => removeItemRow(i)}>✕</button>}
          </div>
        ))}
        <button type="button" style={styles.addItemBtn} onClick={addItemRow}>+ Adicionar item</button>

        <button style={styles.saveBtn} type="submit" disabled={saving}>{saving ? "Salvando..." : "Registrar recebimento"}</button>
      </form>

      <h2 style={styles.title2}>Recebimentos</h2>
      {loading ? (
        <p style={styles.dim}>Carregando...</p>
      ) : receivings.length === 0 ? (
        <p style={styles.dim}>Nenhum recebimento registrado ainda.</p>
      ) : (
        <div style={styles.list}>
          {receivings.map((r) => (
            <div key={r.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={styles.recCode}>{r.code}</span>
                <span style={{ ...styles.statusBadge, color: STATUS_COLOR[r.status] }}>{STATUS_LABEL[r.status]}</span>
              </div>
              <p style={styles.dim}>{r.suppliers?.name ?? "Sem fornecedor"} {r.document && `· Doc: ${r.document}`}</p>
              <ul style={styles.itemsList}>
                {r.wms_receiving_items.map((it) => (
                  <li key={it.id} style={styles.dim}>{it.products?.sku} — {it.products?.name}: {it.quantity_expected} {it.products?.unit}</li>
                ))}
              </ul>
              {r.status === "pendente" && (
                <div style={styles.confirmRow}>
                  <select style={styles.input} value={warehouseByReceiving[r.id] ?? ""} onChange={(e) => setWarehouseByReceiving((p) => ({ ...p, [r.id]: e.target.value }))}>
                    <option value="">Almoxarifado de destino...</option>
                    {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                  <button style={styles.confirmBtn} onClick={() => confirmReceiving(r)} type="button">Confirmar entrada</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  title: { fontFamily: "var(--font-display)", fontSize: 22, margin: 0 },
  title2: { fontFamily: "var(--font-display)", fontSize: 16, margin: "0 0 12px" },
  subtitle: { color: "var(--text-dim)", fontSize: 13, margin: "6px 0 0" },
  dim: { color: "var(--text-dim)", fontSize: 12.5 },
  form: { display: "flex", flexDirection: "column", gap: 12, background: "var(--panel)", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: 20, marginBottom: 28, maxWidth: 680 },
  formTitle: { fontSize: 13, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.04em", margin: "0 0 4px" },
  row: { display: "flex", gap: 10, flexWrap: "wrap" },
  itemRow: { display: "flex", gap: 8 },
  input: { flex: 1, minWidth: 140, background: "var(--panel-2)", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: "9px 10px", color: "var(--text)", fontSize: 13 },
  removeBtn: { background: "transparent", border: "1px solid var(--line)", color: "var(--red)", borderRadius: "var(--radius)", width: 36, cursor: "pointer" },
  addItemBtn: { alignSelf: "flex-start", background: "transparent", border: "none", color: "var(--amber)", fontSize: 12.5, fontWeight: 700, cursor: "pointer", padding: 0 },
  saveBtn: { background: "var(--amber)", color: "#FFFFFF", border: "none", borderRadius: "var(--radius)", padding: "10px 0", fontWeight: 700, fontSize: 13, cursor: "pointer", marginTop: 6 },
  list: { display: "flex", flexDirection: "column", gap: 12, maxWidth: 680 },
  card: { background: "var(--panel)", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: 16 },
  cardHeader: { display: "flex", justifyContent: "space-between", marginBottom: 4 },
  recCode: { fontWeight: 700, fontSize: 14 },
  statusBadge: { fontSize: 12, fontWeight: 700 },
  itemsList: { margin: "8px 0", paddingLeft: 18 },
  confirmRow: { display: "flex", gap: 8, marginTop: 8 },
  confirmBtn: { background: "var(--green)", color: "#FFFFFF", border: "none", borderRadius: "var(--radius)", padding: "9px 16px", fontWeight: 700, fontSize: 12.5, cursor: "pointer", whiteSpace: "nowrap" },
  error: { background: "rgba(217,105,95,0.12)", border: "1px solid var(--red)", color: "var(--red)", borderRadius: "var(--radius)", padding: "10px 12px", fontSize: 13, marginBottom: 16, maxWidth: 680 },
};
