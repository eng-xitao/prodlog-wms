import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/AuthContext";

const STATUS_LABEL = { aberto: "Aberto", em_viagem: "Em viagem", encerrado: "Encerrado" };
const STATUS_COLOR = { aberto: "var(--amber)", em_viagem: "#2563EB", encerrado: "var(--green)" };

/**
 * MDF-e (Manifesto de Documentos Fiscais): agrupa vários CT-es numa
 * mesma viagem/veículo — o documento que o motorista leva na
 * estrada representando toda a carga daquele trajeto.
 */
export default function ManifestosPage() {
  const { company } = useAuth();
  const [manifests, setManifests] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [availableCtes, setAvailableCtes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [vehicleId, setVehicleId] = useState("");
  const [driverId, setDriverId] = useState("");
  const [routeDescription, setRouteDescription] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [saving, setSaving] = useState(false);

  const [selectedManifest, setSelectedManifest] = useState(null);
  const [manifestCtes, setManifestCtes] = useState([]);
  const [addingCteId, setAddingCteId] = useState("");

  async function loadAll() {
    setLoading(true);
    setError("");
    try {
      const [{ data: m, error: e1 }, { data: v, error: e2 }, { data: d, error: e3 }] = await Promise.all([
        supabase.from("wms_manifests").select("id, code, route_description, status, departure_date, wms_vehicles:vehicle_id (plate), wms_drivers:driver_id (full_name)").order("created_at", { ascending: false }).limit(50),
        supabase.from("wms_vehicles").select("id, plate, model").eq("status", "active").order("plate"),
        supabase.from("wms_drivers").select("id, full_name").eq("status", "active").order("full_name"),
      ]);
      const firstError = e1 || e2 || e3;
      if (firstError) throw firstError;
      setManifests(m ?? []);
      setVehicles(v ?? []);
      setDrivers(d ?? []);
    } catch (err) {
      setError("Não foi possível carregar: " + (err.message ?? "erro desconhecido"));
    } finally {
      setLoading(false);
    }
  }

  async function loadManifestDetails(manifestId) {
    const [{ data: linked }, { data: allCtes }] = await Promise.all([
      supabase.from("wms_manifest_ctes").select("id, cte_id, wms_ctes:cte_id (numero, valor_frete, shipments:shipment_id (code))").eq("manifest_id", manifestId),
      supabase.from("wms_ctes").select("id, numero, valor_frete").eq("status", "emitido"),
    ]);
    setManifestCtes(linked ?? []);
    const linkedIds = (linked ?? []).map((l) => l.cte_id);
    setAvailableCtes((allCtes ?? []).filter((c) => !linkedIds.includes(c.id)));
  }

  useEffect(() => { if (company?.id) loadAll(); }, [company?.id]);
  useEffect(() => { if (selectedManifest) loadManifestDetails(selectedManifest.id); }, [selectedManifest]);

  async function createManifest(e) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const { data: code } = await supabase.rpc("next_wms_manifest_code", { p_company_id: company.id });
    const { error: insertError } = await supabase.from("wms_manifests").insert({
      company_id: company.id,
      code,
      vehicle_id: vehicleId || null,
      driver_id: driverId || null,
      route_description: routeDescription || null,
      departure_date: departureDate || null,
    });

    if (insertError) { setError(insertError.message); setSaving(false); return; }
    setVehicleId(""); setDriverId(""); setRouteDescription(""); setDepartureDate("");
    setSaving(false);
    await loadAll();
  }

  async function addCteToManifest() {
    if (!addingCteId || !selectedManifest) return;
    await supabase.from("wms_manifest_ctes").insert({ company_id: company.id, manifest_id: selectedManifest.id, cte_id: addingCteId });
    setAddingCteId("");
    await loadManifestDetails(selectedManifest.id);
  }

  async function removeCteFromManifest(id) {
    await supabase.from("wms_manifest_ctes").delete().eq("id", id);
    await loadManifestDetails(selectedManifest.id);
  }

  async function closeManifest() {
    await supabase.from("wms_manifests").update({ status: "encerrado", closed_at: new Date().toISOString() }).eq("id", selectedManifest.id);
    setSelectedManifest(null);
    await loadAll();
  }

  const totalFrete = manifestCtes.reduce((sum, m) => sum + Number(m.wms_ctes?.valor_frete ?? 0), 0);

  return (
    <div>
      <header style={{ marginBottom: 20 }}>
        <h1 style={styles.title}>MDF-e — Manifesto de Carga</h1>
        <p style={styles.subtitle}>Agrupa os CT-es de uma mesma viagem — o documento que o motorista leva na estrada.</p>
      </header>

      {error && <div style={styles.error}>{error}</div>}

      <form onSubmit={createManifest} style={styles.form}>
        <p style={styles.formTitle}>Nova viagem</p>
        <div style={styles.row}>
          <select style={styles.input} value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
            <option value="">Veículo...</option>
            {vehicles.map((v) => <option key={v.id} value={v.id}>{v.plate} {v.model && `— ${v.model}`}</option>)}
          </select>
          <select style={styles.input} value={driverId} onChange={(e) => setDriverId(e.target.value)}>
            <option value="">Motorista...</option>
            {drivers.map((d) => <option key={d.id} value={d.id}>{d.full_name}</option>)}
          </select>
        </div>
        <div style={styles.row}>
          <input style={styles.input} placeholder="Rota (ex: São Paulo → Curitiba)" value={routeDescription} onChange={(e) => setRouteDescription(e.target.value)} />
          <input style={styles.input} type="date" value={departureDate} onChange={(e) => setDepartureDate(e.target.value)} />
        </div>
        <button style={styles.saveBtn} type="submit" disabled={saving}>{saving ? "Criando..." : "Criar manifesto"}</button>
      </form>

      {loading ? (
        <p style={styles.dim}>Carregando...</p>
      ) : manifests.length === 0 ? (
        <p style={styles.dim}>Nenhum manifesto criado ainda.</p>
      ) : (
        <div style={styles.list}>
          {manifests.map((m) => (
            <div key={m.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={styles.code}>{m.code}</span>
                <span style={{ ...styles.statusBadge, color: STATUS_COLOR[m.status] }}>{STATUS_LABEL[m.status]}</span>
              </div>
              <p style={styles.dim}>
                {m.wms_vehicles?.plate ?? "sem veículo"} · {m.wms_drivers?.full_name ?? "sem motorista"}
                {m.route_description && ` · ${m.route_description}`}
              </p>
              <button style={styles.detailsBtn} onClick={() => setSelectedManifest(selectedManifest?.id === m.id ? null : m)} type="button">
                {selectedManifest?.id === m.id ? "Fechar" : "Ver CT-es"}
              </button>

              {selectedManifest?.id === m.id && (
                <div style={styles.detailsBox}>
                  {manifestCtes.length === 0 ? (
                    <p style={styles.dim}>Nenhum CT-e nesse manifesto ainda.</p>
                  ) : (
                    <ul style={styles.cteList}>
                      {manifestCtes.map((mc) => (
                        <li key={mc.id} style={styles.cteItem}>
                          <span>{mc.wms_ctes?.numero} — {mc.wms_ctes?.shipments?.code ?? "sem expedição"} — R$ {Number(mc.wms_ctes?.valor_frete ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                          {m.status !== "encerrado" && (
                            <button style={styles.removeBtn} onClick={() => removeCteFromManifest(mc.id)} type="button">✕</button>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                  <p style={styles.total}>Total do frete: R$ {totalFrete.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>

                  {m.status !== "encerrado" && (
                    <>
                      <div style={styles.addCteRow}>
                        <select style={styles.input} value={addingCteId} onChange={(e) => setAddingCteId(e.target.value)}>
                          <option value="">Adicionar CT-e...</option>
                          {availableCtes.map((c) => <option key={c.id} value={c.id}>{c.numero} — R$ {Number(c.valor_frete).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</option>)}
                        </select>
                        <button style={styles.addBtn} onClick={addCteToManifest} type="button">+ Adicionar</button>
                      </div>
                      <button style={styles.closeBtn} onClick={closeManifest} type="button">Encerrar manifesto</button>
                    </>
                  )}
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
  subtitle: { color: "var(--text-dim)", fontSize: 13, margin: "6px 0 0" },
  dim: { color: "var(--text-dim)", fontSize: 12.5 },
  form: { display: "flex", flexDirection: "column", gap: 12, background: "var(--panel)", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: 20, marginBottom: 28, maxWidth: 680 },
  formTitle: { fontSize: 13, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.04em", margin: "0 0 4px" },
  row: { display: "flex", gap: 10 },
  input: { flex: 1, background: "var(--panel-2)", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: "9px 10px", color: "var(--text)", fontSize: 13 },
  saveBtn: { background: "var(--amber)", color: "#FFFFFF", border: "none", borderRadius: "var(--radius)", padding: "10px 0", fontWeight: 700, fontSize: 13, cursor: "pointer" },
  list: { display: "flex", flexDirection: "column", gap: 12, maxWidth: 680 },
  card: { background: "var(--panel)", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: 16 },
  cardHeader: { display: "flex", justifyContent: "space-between", marginBottom: 4 },
  code: { fontWeight: 700, fontSize: 14 },
  statusBadge: { fontSize: 12, fontWeight: 700 },
  detailsBtn: { marginTop: 8, background: "transparent", border: "1px solid var(--line)", color: "var(--text-dim)", borderRadius: "var(--radius)", padding: "6px 14px", fontSize: 12, cursor: "pointer" },
  detailsBox: { marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--line)" },
  cteList: { listStyle: "none", padding: 0, margin: "0 0 8px", display: "flex", flexDirection: "column", gap: 6 },
  cteItem: { display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12.5 },
  removeBtn: { background: "transparent", border: "none", color: "var(--red)", cursor: "pointer" },
  total: { fontWeight: 700, fontSize: 13, margin: "8px 0" },
  addCteRow: { display: "flex", gap: 8, marginTop: 10 },
  addBtn: { background: "var(--panel-2)", border: "1px solid var(--line)", color: "var(--text)", borderRadius: "var(--radius)", padding: "8px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" },
  closeBtn: { marginTop: 10, background: "var(--red)", color: "#FFFFFF", border: "none", borderRadius: "var(--radius)", padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer" },
  error: { background: "rgba(217,105,95,0.12)", border: "1px solid var(--red)", color: "var(--red)", borderRadius: "var(--radius)", padding: "10px 12px", fontSize: 13, marginBottom: 16, maxWidth: 680 },
};
