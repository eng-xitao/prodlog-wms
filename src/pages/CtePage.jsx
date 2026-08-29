import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/AuthContext";

const STATUS_LABEL = { pendente: "Pendente", emitido: "Emitido", cancelado: "Cancelado" };
const STATUS_COLOR = { pendente: "var(--amber)", emitido: "var(--green)", cancelado: "var(--red)" };

/**
 * CT-e (Conhecimento de Transporte Eletrônico): o documento fiscal
 * de verdade pra quem presta serviço de transporte — diferente da
 * NF-e, que é pra venda de mercadoria. Vinculado à expedição.
 */
export default function CtePage() {
  const { company } = useAuth();
  const [shipments, setShipments] = useState([]);
  const [ctes, setCtes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [shipmentId, setShipmentId] = useState("");
  const [valorFrete, setValorFrete] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadAll() {
    setLoading(true);
    setError("");
    try {
      const [{ data: ships, error: e1 }, { data: c, error: e2 }] = await Promise.all([
        supabase.from("shipments").select("id, code, wms_orders:wms_order_id (code, customers:customer_id (name))").order("created_at", { ascending: false }).limit(100),
        supabase.from("wms_ctes").select("id, numero, valor_frete, status, created_at, shipments:shipment_id (code, wms_orders:wms_order_id (customers:customer_id (name)))").order("created_at", { ascending: false }).limit(50),
      ]);
      const firstError = e1 || e2;
      if (firstError) throw firstError;
      setShipments(ships ?? []);
      setCtes(c ?? []);
    } catch (err) {
      setError("Não foi possível carregar: " + (err.message ?? "erro desconhecido"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (company?.id) loadAll(); }, [company?.id]);

  async function createCte(e) {
    e.preventDefault();
    setError("");
    if (!valorFrete) { setError("Informe o valor do frete."); return; }
    setSaving(true);

    const { data: numero } = await supabase.rpc("next_wms_cte_code", { p_company_id: company.id });
    const { error: insertError } = await supabase.from("wms_ctes").insert({
      company_id: company.id,
      shipment_id: shipmentId || null,
      numero,
      valor_frete: Number(valorFrete),
      observacoes: observacoes || null,
      status: "emitido",
    });

    if (insertError) { setError(insertError.message); setSaving(false); return; }
    setShipmentId(""); setValorFrete(""); setObservacoes("");
    setSaving(false);
    await loadAll();
  }

  return (
    <div>
      <header style={{ marginBottom: 20 }}>
        <h1 style={styles.title}>CT-e</h1>
        <p style={styles.subtitle}>Documento fiscal de transporte — registre o valor do frete de cada expedição.</p>
      </header>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.notice}>
        Registro do CT-e pra controle interno. A emissão fiscal de verdade (assinatura digital, SEFAZ) ainda depende de contratar esse serviço específico — fale com o suporte se quiser ativar a emissão automática.
      </div>

      <form onSubmit={createCte} style={styles.form}>
        <p style={styles.formTitle}>Novo CT-e</p>
        <select style={styles.input} value={shipmentId} onChange={(e) => setShipmentId(e.target.value)}>
          <option value="">Vincular a uma expedição (opcional)...</option>
          {shipments.map((s) => <option key={s.id} value={s.id}>{s.code} — {s.wms_orders?.customers?.name ?? "sem cliente"}</option>)}
        </select>
        <div style={styles.row}>
          <input style={styles.input} type="number" step="0.01" placeholder="Valor do frete (R$)" value={valorFrete} onChange={(e) => setValorFrete(e.target.value)} required />
          <input style={styles.input} placeholder="Observações (opcional)" value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
        </div>
        <button style={styles.saveBtn} type="submit" disabled={saving}>{saving ? "Salvando..." : "Registrar CT-e"}</button>
      </form>

      <h2 style={styles.title2}>CT-es registrados</h2>
      {loading ? (
        <p style={styles.dim}>Carregando...</p>
      ) : ctes.length === 0 ? (
        <p style={styles.dim}>Nenhum CT-e registrado ainda.</p>
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead><tr><th style={styles.th}>Número</th><th style={styles.th}>Expedição</th><th style={styles.th}>Cliente</th><th style={styles.th}>Valor</th><th style={styles.th}>Status</th></tr></thead>
            <tbody>
              {ctes.map((c) => (
                <tr key={c.id}>
                  <td style={styles.td}>{c.numero}</td>
                  <td style={styles.td}>{c.shipments?.code ?? "—"}</td>
                  <td style={styles.td}>{c.shipments?.wms_orders?.customers?.name ?? "—"}</td>
                  <td style={styles.td}>R$ {Number(c.valor_frete).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                  <td style={{ ...styles.td, color: STATUS_COLOR[c.status] }}>{STATUS_LABEL[c.status]}</td>
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
  notice: { background: "rgba(232,163,61,0.1)", border: "1px solid var(--amber)", borderRadius: "var(--radius)", padding: "10px 14px", fontSize: 12.5, marginBottom: 20, maxWidth: 680, lineHeight: 1.5 },
  form: { display: "flex", flexDirection: "column", gap: 12, background: "var(--panel)", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: 20, marginBottom: 28, maxWidth: 680 },
  formTitle: { fontSize: 13, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.04em", margin: "0 0 4px" },
  row: { display: "flex", gap: 10 },
  input: { flex: 1, background: "var(--panel-2)", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: "9px 10px", color: "var(--text)", fontSize: 13 },
  saveBtn: { background: "var(--amber)", color: "#FFFFFF", border: "none", borderRadius: "var(--radius)", padding: "10px 0", fontWeight: 700, fontSize: 13, cursor: "pointer" },
  tableWrap: { border: "1px solid var(--line)", borderRadius: "var(--radius)", overflow: "hidden", overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--text-dim)", padding: "10px 14px", background: "var(--panel)", borderBottom: "1px solid var(--line)" },
  td: { padding: "10px 14px", fontSize: 13.5, background: "var(--panel)", borderBottom: "1px solid var(--line)" },
  error: { background: "rgba(217,105,95,0.12)", border: "1px solid var(--red)", color: "var(--red)", borderRadius: "var(--radius)", padding: "10px 12px", fontSize: 13, marginBottom: 16, maxWidth: 680 },
};
