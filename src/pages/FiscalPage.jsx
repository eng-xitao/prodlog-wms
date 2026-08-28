import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/AuthContext";

const STATUS_LABEL = { processando: "Processando", autorizado: "Autorizada", erro: "Erro", cancelado: "Cancelada" };
const STATUS_COLOR = { processando: "var(--amber)", autorizado: "var(--green)", erro: "var(--red)", cancelado: "var(--text-dim)" };

/**
 * Fiscal/NF-e do ProdLog: reaproveita a MESMA função de emissão e a
 * mesma tabela de notas que o ProdOS já usa — é a mesma empresa, o
 * mesmo cadastro fiscal (Configurações > Fiscal, no ProdOS).
 */
export default function FiscalPage() {
  const { company } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [emitting, setEmitting] = useState(false);

  const [customerId, setCustomerId] = useState("");
  const [items, setItems] = useState([]);
  const [newProductId, setNewProductId] = useState("");
  const [newQty, setNewQty] = useState(1);

  const fiscalIncomplete = !company?.focus_nfe_token || !company?.logradouro;

  async function loadBaseData() {
    const [{ data: c }, { data: p }] = await Promise.all([
      supabase.from("customers").select("id, name, document, logradouro, municipio, uf, cep").order("name"),
      supabase.from("products").select("id, name, sku, ncm, sale_price, unit").order("name"),
    ]);
    setCustomers(c ?? []);
    setProducts(p ?? []);
  }

  async function loadInvoices() {
    setLoading(true);
    try {
      const { data, error: e } = await supabase
        .from("invoices")
        .select("id, status, numero, valor_total, danfe_url, created_at, customers:customer_id (name)")
        .order("created_at", { ascending: false })
        .limit(30);
      if (e) throw e;
      setInvoices(data ?? []);
    } catch (err) {
      setError("Não foi possível carregar as notas: " + (err.message ?? "erro desconhecido"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (company?.id) { loadBaseData(); loadInvoices(); } }, [company?.id]);

  function addItem() {
    if (!newProductId) return;
    const product = products.find((p) => p.id === newProductId);
    setItems((prev) => [...prev, { productId: newProductId, quantity: Number(newQty), unitPrice: Number(product?.sale_price ?? 0) }]);
    setNewProductId(""); setNewQty(1);
  }
  function removeItem(productId) {
    setItems((prev) => prev.filter((it) => it.productId !== productId));
  }

  const total = useMemo(() => items.reduce((sum, it) => sum + Number(it.quantity) * Number(it.unitPrice), 0), [items]);

  async function emit() {
    if (!company?.id || !customerId || items.length === 0) return;
    setEmitting(true);
    setError("");

    const { data, error } = await supabase.functions.invoke("emit-nfe", {
      body: {
        companyId: company.id,
        customerId,
        salesOrderId: null,
        items: items.map((it) => ({ productId: it.productId, quantity: it.quantity, unitPrice: it.unitPrice })),
      },
    });

    if (error || data?.error) {
      setError(data?.error ?? "Não foi possível emitir a NF-e. Tente novamente em instantes.");
    } else {
      setCustomerId(""); setItems([]);
      await loadInvoices();
    }
    setEmitting(false);
  }

  return (
    <div>
      <header style={{ marginBottom: 20 }}>
        <h1 style={styles.title}>Fiscal / NF-e</h1>
        <p style={styles.subtitle}>Emita nota fiscal de saída pra qualquer cliente — mesma configuração fiscal do ProdOS.</p>
      </header>

      {fiscalIncomplete && (
        <div style={styles.notice}>Antes de emitir, complete a Configuração Fiscal (no ProdOS, em Configurações → Fiscal).</div>
      )}
      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.form}>
        <p style={styles.formTitle}>Nova nota</p>
        <select style={styles.input} value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
          <option value="">Cliente...</option>
          {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <div style={styles.row}>
          <select style={styles.input} value={newProductId} onChange={(e) => setNewProductId(e.target.value)}>
            <option value="">Produto...</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>)}
          </select>
          <input style={{ ...styles.input, width: 90 }} type="number" min="1" value={newQty} onChange={(e) => setNewQty(e.target.value)} />
          <button type="button" style={styles.addBtn} onClick={addItem}>+ Item</button>
        </div>

        {items.length > 0 && (
          <div style={styles.itemsList}>
            {items.map((it) => {
              const p = products.find((pp) => pp.id === it.productId);
              return (
                <div key={it.productId} style={styles.itemRow}>
                  <span>{p?.sku} — {p?.name}: {it.quantity} × R$ {Number(it.unitPrice).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                  <button type="button" style={styles.removeBtn} onClick={() => removeItem(it.productId)}>✕</button>
                </div>
              );
            })}
            <p style={styles.total}>Total: R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
          </div>
        )}

        <button style={styles.emitBtn} onClick={emit} disabled={emitting || !customerId || items.length === 0 || fiscalIncomplete} type="button">
          {emitting ? "Emitindo..." : "Emitir NF-e"}
        </button>
      </div>

      <h2 style={styles.title2}>Notas emitidas</h2>
      {loading ? (
        <p style={styles.dim}>Carregando...</p>
      ) : invoices.length === 0 ? (
        <p style={styles.dim}>Nenhuma nota emitida ainda.</p>
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead><tr><th style={styles.th}>Nº</th><th style={styles.th}>Cliente</th><th style={styles.th}>Valor</th><th style={styles.th}>Status</th><th style={styles.th}></th></tr></thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td style={styles.td}>{inv.numero ?? "—"}</td>
                  <td style={styles.td}>{inv.customers?.name ?? "—"}</td>
                  <td style={styles.td}>R$ {Number(inv.valor_total ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                  <td style={{ ...styles.td, color: STATUS_COLOR[inv.status] }}>{STATUS_LABEL[inv.status] ?? inv.status}</td>
                  <td style={styles.td}>{inv.danfe_url && <a href={inv.danfe_url} target="_blank" rel="noreferrer" style={styles.link}>DANFE</a>}</td>
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
  form: { display: "flex", flexDirection: "column", gap: 12, background: "var(--panel)", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: 20, marginBottom: 28, maxWidth: 680 },
  formTitle: { fontSize: 13, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.04em", margin: "0 0 4px" },
  row: { display: "flex", gap: 8 },
  input: { flex: 1, background: "var(--panel-2)", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: "9px 10px", color: "var(--text)", fontSize: 13 },
  addBtn: { background: "var(--panel-2)", border: "1px solid var(--line)", color: "var(--text)", borderRadius: "var(--radius)", padding: "9px 14px", fontWeight: 700, fontSize: 12.5, cursor: "pointer", whiteSpace: "nowrap" },
  itemsList: { display: "flex", flexDirection: "column", gap: 6, background: "var(--panel-2)", borderRadius: "var(--radius)", padding: 12 },
  itemRow: { display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12.5 },
  removeBtn: { background: "transparent", border: "none", color: "var(--red)", cursor: "pointer", fontSize: 13 },
  total: { fontSize: 13, fontWeight: 700, margin: "6px 0 0", textAlign: "right" },
  emitBtn: { background: "var(--amber)", color: "#FFFFFF", border: "none", borderRadius: "var(--radius)", padding: "11px 0", fontWeight: 700, fontSize: 13.5, cursor: "pointer" },
  tableWrap: { border: "1px solid var(--line)", borderRadius: "var(--radius)", overflow: "hidden", overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--text-dim)", padding: "10px 14px", background: "var(--panel)", borderBottom: "1px solid var(--line)" },
  td: { padding: "10px 14px", fontSize: 13.5, background: "var(--panel)", borderBottom: "1px solid var(--line)" },
  link: { color: "var(--amber)", fontWeight: 700, fontSize: 12.5 },
  notice: { background: "rgba(232,163,61,0.1)", border: "1px solid var(--amber)", borderRadius: "var(--radius)", padding: "10px 14px", fontSize: 13, marginBottom: 16, maxWidth: 680 },
  error: { background: "rgba(217,105,95,0.12)", border: "1px solid var(--red)", color: "var(--red)", borderRadius: "var(--radius)", padding: "10px 12px", fontSize: 13, marginBottom: 16, maxWidth: 680 },
};
