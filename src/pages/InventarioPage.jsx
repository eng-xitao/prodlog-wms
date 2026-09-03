import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/AuthContext";

export default function InventarioPage() {
  const { company } = useAuth();
  const [inventories, setInventories] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [counts, setCounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [type, setType] = useState("rotativo");
  const [warehouseId, setWarehouseId] = useState("");
  const [creating, setCreating] = useState(false);
  const [savingCountId, setSavingCountId] = useState(null);
  const [closing, setClosing] = useState(false);

  async function loadInventories() {
    setLoading(true);
    setError("");
    try {
      const { data, error: e } = await supabase.from("wms_inventories").select("id, code, type, status, created_at").order("created_at", { ascending: false });
      if (e) throw e;
      setInventories(data ?? []);
    } catch (err) {
      setError("Não foi possível carregar a tela: " + (err.message ?? "erro desconhecido"));
    } finally { setLoading(false); }
  }

  async function loadCounts(invId) {
    const { data, error: e } = await supabase
      .from("wms_inventory_counts")
      .select("id, system_quantity, counted_quantity, counted_at, products:product_id (sku, name, unit)")
      .eq("inventory_id", invId)
      .order("id");
    if (e) { setError(e.message); return; }
    setCounts(data ?? []);
  }

  useEffect(() => {
    if (!company?.id) return;
    loadInventories();
    supabase.from("warehouses").select("id, name").order("name").then(({ data, error: e }) => {
      if (e) setError(e.message);
      setWarehouses(data ?? []);
    });
  }, [company?.id]);

  useEffect(() => { if (selectedId) loadCounts(selectedId); else setCounts([]); }, [selectedId]);

  async function createInventory(e) {
    e.preventDefault();
    setError("");
    if (!warehouseId) { setError("Escolha o almoxarifado a contar."); return; }
    setCreating(true);
    try {
      const { data: code, error: codeError } = await supabase.rpc("next_wms_inventory_code", { p_company_id: company.id });
      if (codeError) throw codeError;
      const { data: inv, error: invError } = await supabase.from("wms_inventories").insert({ company_id: company.id, code, type }).select("id").single();
      if (invError) throw invError;

      const { data: levels, error: levelsError } = await supabase.from("stock_levels").select("product_id, location_id, quantity").eq("warehouse_id", warehouseId);
      if (levelsError) throw levelsError;

      const rows = (levels ?? []).map((l) => ({
        company_id: company.id, inventory_id: inv.id, product_id: l.product_id,
        location_id: l.location_id ?? null, system_quantity: l.quantity, counted_quantity: null,
      }));
      if (rows.length) {
        const { error: countError } = await supabase.from("wms_inventory_counts").insert(rows);
        if (countError) throw countError;
      }
      setWarehouseId("");
      await loadInventories();
      setSelectedId(inv.id);
    } catch (err) {
      setError(err.message ?? "Não foi possível iniciar o inventário.");
    } finally { setCreating(false); }
  }

  async function saveCount(countId, value) {
    const number = Number(value);
    if (!Number.isFinite(number) || number < 0) { setError("A quantidade contada deve ser um número maior ou igual a zero."); return; }
    setSavingCountId(countId);
    setError("");
    const { error: e } = await supabase.from("wms_inventory_counts").update({ counted_quantity: number, counted_at: new Date().toISOString() }).eq("id", countId).eq("company_id", company.id);
    setSavingCountId(null);
    if (e) { setError(e.message); return; }
    await loadCounts(selectedId);
  }

  async function closeInventory() {
    if (!selectedInventory) return;
    const pending = counts.filter((c) => c.counted_quantity == null);
    if (pending.length) {
      setError(`Não é possível encerrar: ainda existem ${pending.length} item(ns) sem contagem.`);
      return;
    }
    if (!window.confirm("Encerrar esse inventário? As divergências serão mantidas para conferência antes do ajuste.")) return;
    setClosing(true);
    setError("");
    const { error: e } = await supabase.from("wms_inventories").update({ status: "encerrado", closed_at: new Date().toISOString() }).eq("id", selectedId).eq("company_id", company.id);
    setClosing(false);
    if (e) { setError(e.message); return; }
    await loadInventories();
    await loadCounts(selectedId);
  }

  const selectedInventory = inventories.find((i) => i.id === selectedId);
  const counted = counts.filter((c) => c.counted_quantity != null).length;
  const divergences = counts.filter((c) => c.counted_quantity != null && Number(c.counted_quantity) !== Number(c.system_quantity)).length;

  return (
    <div>
      <header style={{ marginBottom: 20 }}>
        <h1 style={styles.title}>Inventário</h1>
        <p style={styles.subtitle}>Conte o estoque físico, compare com o sistema e só depois encerre a conferência.</p>
      </header>
      {error && <div style={styles.error}>{error}</div>}

      <form onSubmit={createInventory} style={styles.form}>
        <p style={styles.formTitle}>Novo inventário</p>
        <div style={styles.row}>
          <select style={styles.input} value={type} onChange={(e) => setType(e.target.value)}>
            <option value="rotativo">Rotativo (parte do estoque)</option>
            <option value="geral">Geral (tudo)</option>
          </select>
          <select style={styles.input} value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} required>
            <option value="">Almoxarifado a contar...</option>
            {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
          <button style={styles.saveBtn} type="submit" disabled={creating}>{creating ? "Criando..." : "Iniciar contagem"}</button>
        </div>
      </form>

      <div style={styles.row}>
        <select style={{ ...styles.input, maxWidth: 360 }} value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
          <option value="">Selecione um inventário...</option>
          {inventories.map((i) => <option key={i.id} value={i.id}>{i.code} — {i.status === "aberto" ? "Aberto" : "Encerrado"}</option>)}
        </select>
        {selectedInventory && <div style={styles.summary}>Contados: <strong>{counted}/{counts.length}</strong> · Divergências: <strong>{divergences}</strong></div>}
      </div>

      {loading ? <p style={styles.dim}>Carregando...</p> : selectedInventory && (
        <>
          {selectedInventory.status === "aberto" && (
            <button style={styles.closeBtn} onClick={closeInventory} disabled={closing || savingCountId !== null} type="button">{closing ? "Encerrando..." : "Encerrar inventário"}</button>
          )}
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead><tr><th style={styles.th}>Produto</th><th style={styles.th}>Sistema</th><th style={styles.th}>Contado</th><th style={styles.th}>Divergência</th></tr></thead>
              <tbody>
                {counts.length === 0 ? <tr><td style={styles.td} colSpan="4">Nenhum item de estoque encontrado para este almoxarifado.</td></tr> : counts.map((c) => {
                  const divergence = c.counted_quantity != null ? Number(c.counted_quantity) - Number(c.system_quantity) : null;
                  return <tr key={c.id}>
                    <td style={styles.td}>{c.products?.sku} — {c.products?.name}</td>
                    <td style={styles.td}>{Number(c.system_quantity).toLocaleString("pt-BR")} {c.products?.unit}</td>
                    <td style={styles.td}>{selectedInventory.status === "aberto" ? <input style={styles.countInput} type="number" min="0" step="any" defaultValue={c.counted_quantity ?? ""} disabled={savingCountId === c.id} onBlur={(e) => e.target.value !== "" && saveCount(c.id, e.target.value)} /> : (c.counted_quantity ?? "—")}</td>
                    <td style={{ ...styles.td, color: divergence ? (divergence < 0 ? "var(--red)" : "var(--green)") : "var(--text-dim)" }}>{divergence != null ? (divergence > 0 ? `+${divergence}` : divergence) : "—"}</td>
                  </tr>;
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

const styles = {
  title: { fontFamily: "var(--font-display)", fontSize: 22, margin: 0 },
  subtitle: { color: "var(--text-dim)", fontSize: 13, margin: "6px 0 0" },
  form: { background: "var(--panel)", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: 18, marginBottom: 20, maxWidth: 760 },
  formTitle: { fontSize: 13, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.04em", margin: "0 0 12px" },
  row: { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16, alignItems: "center" },
  input: { flex: 1, minWidth: 150, background: "var(--panel-2)", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: "9px 10px", color: "var(--text)", fontSize: 13 },
  saveBtn: { background: "var(--amber)", color: "#FFFFFF", border: "none", borderRadius: "var(--radius)", padding: "9px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" },
  closeBtn: { background: "var(--red)", color: "#FFFFFF", border: "none", borderRadius: "var(--radius)", padding: "8px 16px", fontWeight: 700, fontSize: 12.5, cursor: "pointer", marginBottom: 14 },
  summary: { color: "var(--text-dim)", fontSize: 12.5 },
  tableWrap: { border: "1px solid var(--line)", borderRadius: "var(--radius)", overflow: "hidden", overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--text-dim)", padding: "10px 14px", background: "var(--panel)", borderBottom: "1px solid var(--line)" },
  td: { padding: "10px 14px", fontSize: 13.5, background: "var(--panel)", borderBottom: "1px solid var(--line)" },
  countInput: { background: "var(--panel-2)", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: "5px 8px", color: "var(--text)", fontSize: 13, width: 90 },
  dim: { color: "var(--text-dim)", fontSize: 13 },
  error: { background: "rgba(217,105,95,0.12)", border: "1px solid var(--red)", color: "var(--red)", borderRadius: "var(--radius)", padding: "10px 12px", fontSize: 13, marginBottom: 16, maxWidth: 760 },
};
