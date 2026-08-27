import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/AuthContext";

export default function EstoquePage() {
  const { company } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (company?.id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company?.id]);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("stock_levels")
      .select("id, quantity, products:product_id (sku, name, unit), warehouses:warehouse_id (name), warehouse_locations:location_id (code)")
      .gt("quantity", 0)
      .order("quantity", { ascending: false });
    setRows(data ?? []);
    setLoading(false);
  }

  const filtered = rows.filter((r) => {
    const term = search.toLowerCase();
    return !term || r.products?.sku?.toLowerCase().includes(term) || r.products?.name?.toLowerCase().includes(term);
  });

  return (
    <div>
      <header style={{ marginBottom: 20 }}>
        <h1 style={styles.title}>Níveis de Estoque</h1>
        <p style={styles.subtitle}>Quantidade de cada item, por almoxarifado e localização.</p>
      </header>

      <input
        style={styles.search}
        placeholder="Buscar por SKU ou nome..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading ? (
        <p style={styles.dim}>Carregando...</p>
      ) : filtered.length === 0 ? (
        <p style={styles.dim}>Nenhum item em estoque encontrado.</p>
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>SKU</th>
                <th style={styles.th}>Produto</th>
                <th style={styles.th}>Almoxarifado</th>
                <th style={styles.th}>Localização</th>
                <th style={styles.th}>Quantidade</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td style={styles.td}>{r.products?.sku}</td>
                  <td style={styles.td}>{r.products?.name}</td>
                  <td style={styles.td}>{r.warehouses?.name}</td>
                  <td style={styles.td}>{r.warehouse_locations?.code ?? "—"}</td>
                  <td style={styles.td}>{Number(r.quantity).toLocaleString("pt-BR")} {r.products?.unit}</td>
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
  subtitle: { color: "var(--text-dim)", fontSize: 13, margin: "6px 0 0" },
  dim: { color: "var(--text-dim)", fontSize: 13 },
  search: {
    background: "var(--panel)", border: "1px solid var(--line)", borderRadius: "var(--radius)",
    padding: "9px 12px", color: "var(--text)", fontSize: 13, width: 320, marginBottom: 18,
  },
  tableWrap: { border: "1px solid var(--line)", borderRadius: "var(--radius)", overflow: "hidden", overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    textAlign: "left", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em",
    color: "var(--text-dim)", padding: "10px 14px", background: "var(--panel)", borderBottom: "1px solid var(--line)",
  },
  td: { padding: "10px 14px", fontSize: 13.5, background: "var(--panel)", borderBottom: "1px solid var(--line)" },
};
