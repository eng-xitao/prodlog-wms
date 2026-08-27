import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/AuthContext";

export default function MovimentacoesPage() {
  const { company } = useAuth();
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [locations, setLocations] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);

  const [productId, setProductId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [type, setType] = useState("entrada");
  const [quantity, setQuantity] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!company?.id) return;
    supabase.from("products").select("id, sku, name, unit").order("name").then(({ data }) => setProducts(data ?? []));
    supabase.from("warehouses").select("id, name").order("name").then(({ data }) => setWarehouses(data ?? []));
    loadMovements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company?.id]);

  useEffect(() => {
    if (!warehouseId) { setLocations([]); return; }
    supabase.from("warehouse_locations").select("id, code").eq("warehouse_id", warehouseId).order("code").then(({ data }) => setLocations(data ?? []));
  }, [warehouseId]);

  async function loadMovements() {
    setLoading(true);
    const { data } = await supabase
      .from("stock_movements")
      .select("id, movement_type, quantity, created_at, products:product_id (sku, name), warehouses:warehouse_id (name)")
      .order("created_at", { ascending: false })
      .limit(50);
    setMovements(data ?? []);
    setLoading(false);
  }

  async function handleSave(e) {
    e.preventDefault();
    setError("");
    if (!productId || !warehouseId || !quantity || Number(quantity) <= 0) {
      setError("Preencha produto, almoxarifado e uma quantidade válida.");
      return;
    }
    setSaving(true);

    await supabase.from("stock_movements").insert({
      company_id: company.id,
      product_id: productId,
      warehouse_id: warehouseId,
      movement_type: type,
      quantity: Number(quantity),
      reference_type: "wms",
    });

    const { data: existing } = await supabase
      .from("stock_levels")
      .select("id, quantity")
      .eq("product_id", productId)
      .eq("warehouse_id", warehouseId)
      .eq("location_id", locationId || null)
      .maybeSingle();

    const delta = type === "saida" ? -Number(quantity) : Number(quantity);

    if (existing) {
      await supabase.from("stock_levels").update({ quantity: Math.max(0, Number(existing.quantity) + delta) }).eq("id", existing.id);
    } else if (delta > 0) {
      await supabase.from("stock_levels").insert({
        company_id: company.id, product_id: productId, warehouse_id: warehouseId,
        location_id: locationId || null, quantity: delta,
      });
    }

    setProductId(""); setQuantity(""); setLocationId("");
    setSaving(false);
    await loadMovements();
  }

  return (
    <div>
      <header style={{ marginBottom: 20 }}>
        <h1 style={styles.title}>Movimentações</h1>
        <p style={styles.subtitle}>Registre entradas e saídas — o nível de estoque é atualizado sozinho.</p>
      </header>

      {error && <div style={styles.error}>{error}</div>}

      <form onSubmit={handleSave} style={styles.form}>
        <div style={styles.row}>
          <label style={styles.field}>
            <span style={styles.fieldLabel}>Produto</span>
            <select style={styles.input} value={productId} onChange={(e) => setProductId(e.target.value)} required>
              <option value="">Selecione...</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>)}
            </select>
          </label>
          <label style={styles.field}>
            <span style={styles.fieldLabel}>Tipo</span>
            <select style={styles.input} value={type} onChange={(e) => setType(e.target.value)}>
              <option value="entrada">Entrada</option>
              <option value="saida">Saída</option>
            </select>
          </label>
        </div>

        <div style={styles.row}>
          <label style={styles.field}>
            <span style={styles.fieldLabel}>Almoxarifado</span>
            <select style={styles.input} value={warehouseId} onChange={(e) => { setWarehouseId(e.target.value); setLocationId(""); }} required>
              <option value="">Selecione...</option>
              {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </label>
          <label style={styles.field}>
            <span style={styles.fieldLabel}>Localização (opcional)</span>
            <select style={styles.input} value={locationId} onChange={(e) => setLocationId(e.target.value)}>
              <option value="">Sem localização específica</option>
              {locations.map((l) => <option key={l.id} value={l.id}>{l.code}</option>)}
            </select>
          </label>
          <label style={styles.field}>
            <span style={styles.fieldLabel}>Quantidade</span>
            <input style={styles.input} type="number" min="0" step="any" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          </label>
        </div>

        <button style={styles.saveBtn} type="submit" disabled={saving}>{saving ? "Salvando..." : "Registrar movimentação"}</button>
      </form>

      <h2 style={styles.title2}>Últimas movimentações</h2>
      {loading ? (
        <p style={styles.dim}>Carregando...</p>
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr><th style={styles.th}>Produto</th><th style={styles.th}>Almoxarifado</th><th style={styles.th}>Tipo</th><th style={styles.th}>Quantidade</th><th style={styles.th}>Quando</th></tr>
            </thead>
            <tbody>
              {movements.map((m) => (
                <tr key={m.id}>
                  <td style={styles.td}>{m.products?.sku} — {m.products?.name}</td>
                  <td style={styles.td}>{m.warehouses?.name}</td>
                  <td style={styles.td}>{m.movement_type === "entrada" ? "Entrada" : "Saída"}</td>
                  <td style={styles.td}>{Number(m.quantity).toLocaleString("pt-BR")}</td>
                  <td style={styles.td}>{new Date(m.created_at).toLocaleString("pt-BR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const styles = {
  title: { fontFamily: "var(--font-display)", fontSize: 22, margin: 0 },
  title2: { fontFamily: "var(--font-display)", fontSize: 16, margin: "0 0 12px" },
  subtitle: { color: "var(--text-dim)", fontSize: 13, margin: "6px 0 0" },
  dim: { color: "var(--text-dim)", fontSize: 13 },
  form: {
    display: "flex", flexDirection: "column", gap: 14,
    background: "var(--panel)", border: "1px solid var(--line)", borderRadius: "var(--radius)",
    padding: 20, marginBottom: 28, maxWidth: 720,
  },
  row: { display: "flex", gap: 14, flexWrap: "wrap" },
  field: { display: "flex", flexDirection: "column", gap: 6, flex: 1, minWidth: 160 },
  fieldLabel: { fontSize: 11, color: "var(--text-dim)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" },
  input: {
    background: "var(--panel-2)", border: "1px solid var(--line)", borderRadius: "var(--radius)",
    padding: "9px 10px", color: "var(--text)", fontSize: 13,
  },
  saveBtn: {
    background: "var(--amber)", color: "#FFFFFF", border: "none", borderRadius: "var(--radius)",
    padding: "10px 0", fontWeight: 700, fontSize: 13, cursor: "pointer",
  },
  tableWrap: { border: "1px solid var(--line)", borderRadius: "var(--radius)", overflow: "hidden", overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    textAlign: "left", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em",
    color: "var(--text-dim)", padding: "10px 14px", background: "var(--panel)", borderBottom: "1px solid var(--line)",
  },
  td: { padding: "10px 14px", fontSize: 13.5, background: "var(--panel)", borderBottom: "1px solid var(--line)" },
  error: {
    background: "rgba(217,105,95,0.12)", border: "1px solid var(--red)", color: "var(--red)",
    borderRadius: "var(--radius)", padding: "10px 12px", fontSize: 13, marginBottom: 16, maxWidth: 720,
  },
};
