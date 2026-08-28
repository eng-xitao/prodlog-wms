import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/AuthContext";

const STATUS_LABEL = { pendente: "Pendente", separando: "Separando", separado: "Separado", expedido: "Expedido", cancelado: "Cancelado" };
const STATUS_COLOR = { pendente: "var(--amber)", separando: "#2563EB", separado: "var(--green)", expedido: "var(--text-dim)", cancelado: "var(--red)" };

export default function PickingPage() {
  const { company } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [customerId, setCustomerId] = useState("");
  const [items, setItems] = useState([{ productId: "", quantity: "" }]);
  const [saving, setSaving] = useState(false);

  async function loadAll() {
    setLoading(true);
    const [{ data: cust }, { data: prod }, { data: ords }] = await Promise.all([
      supabase.from("customers").select("id, code, name").order("name"),
      supabase.from("products").select("id, sku, name, unit").order("name"),
      supabase
        .from("wms_orders")
        .select("id, code, status, created_at, customers:customer_id (name), wms_order_items (id, product_id, quantity, quantity_picked, products:product_id (sku, name, unit))")
        .in("status", ["pendente", "separando", "separado"])
        .order("created_at", { ascending: false })
        .limit(50),
    ]);
    setCustomers(cust ?? []);
    setProducts(prod ?? []);
    setOrders(ords ?? []);
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

    const { data: code } = await supabase.rpc("next_wms_order_code", { p_company_id: company.id });
    const { data: order, error: orderError } = await supabase
      .from("wms_orders")
      .insert({ company_id: company.id, code, customer_id: customerId || null })
      .select("id").single();

    if (orderError) { setError(orderError.message); setSaving(false); return; }

    await supabase.from("wms_order_items").insert(
      validItems.map((it) => ({ company_id: company.id, order_id: order.id, product_id: it.productId, quantity: Number(it.quantity) }))
    );

    setCustomerId(""); setItems([{ productId: "", quantity: "" }]);
    setSaving(false);
    await loadAll();
  }

  async function setItemPicked(item, orderId, allItems) {
    await supabase.from("wms_order_items").update({ quantity_picked: item.quantity }).eq("id", item.id);
    const allDone = allItems.every((it) => (it.id === item.id ? true : Number(it.quantity_picked) >= Number(it.quantity)));
    await supabase.from("wms_orders").update({ status: allDone ? "separado" : "separando" }).eq("id", orderId);
    await loadAll();
  }

  return (
    <div>
      <header style={{ marginBottom: 20 }}>
        <h1 style={styles.title}>Picking</h1>
        <p style={styles.subtitle}>Crie o pedido de saída e separe os itens — quando tudo estiver separado, ele fica pronto pra expedição.</p>
      </header>

      {error && <div style={styles.error}>{error}</div>}

      <form onSubmit={handleCreate} style={styles.form}>
        <p style={styles.formTitle}>Novo pedido</p>
        <select style={styles.input} value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
          <option value="">Cliente (opcional)...</option>
          {customers.map((c) => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
        </select>

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

        <button style={styles.saveBtn} type="submit" disabled={saving}>{saving ? "Salvando..." : "Criar pedido"}</button>
      </form>

      <h2 style={styles.title2}>Pedidos em aberto</h2>
      {loading ? (
        <p style={styles.dim}>Carregando...</p>
      ) : orders.length === 0 ? (
        <p style={styles.dim}>Nenhum pedido em aberto.</p>
      ) : (
        <div style={styles.list}>
          {orders.map((o) => (
            <div key={o.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={styles.recCode}>{o.code}</span>
                <span style={{ ...styles.statusBadge, color: STATUS_COLOR[o.status] }}>{STATUS_LABEL[o.status]}</span>
              </div>
              <p style={styles.dim}>{o.customers?.name ?? "Sem cliente"}</p>
              <ul style={styles.itemsList}>
                {o.wms_order_items.map((it) => {
                  const done = Number(it.quantity_picked) >= Number(it.quantity);
                  return (
                    <li key={it.id} style={styles.pickRow}>
                      <span style={done ? styles.itemDone : styles.dim}>
                        {it.products?.sku} — {it.products?.name}: {it.quantity_picked}/{it.quantity} {it.products?.unit}
                      </span>
                      {!done && (
                        <button style={styles.pickBtn} onClick={() => setItemPicked(it, o.id, o.wms_order_items)} type="button">
                          Marcar separado
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
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
  itemDone: { color: "var(--green)", fontSize: 12.5, textDecoration: "line-through" },
  form: { display: "flex", flexDirection: "column", gap: 12, background: "var(--panel)", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: 20, marginBottom: 28, maxWidth: 680 },
  formTitle: { fontSize: 13, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.04em", margin: "0 0 4px" },
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
  itemsList: { margin: "8px 0 0", paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 },
  pickRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  pickBtn: { background: "var(--green)", color: "#FFFFFF", border: "none", borderRadius: "var(--radius)", padding: "4px 10px", fontSize: 11.5, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" },
  error: { background: "rgba(217,105,95,0.12)", border: "1px solid var(--red)", color: "var(--red)", borderRadius: "var(--radius)", padding: "10px 12px", fontSize: 13, marginBottom: 16, maxWidth: 680 },
};
