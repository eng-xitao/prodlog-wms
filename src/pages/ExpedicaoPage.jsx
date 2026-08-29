import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/AuthContext";

const STATUS_LABEL = { aguardando: "Aguardando", em_rota: "Em rota", entregue: "Entregue", tentativa_frustrada: "Tentativa frustrada", devolvido: "Devolvido" };
const STATUS_COLOR = { aguardando: "var(--text-dim)", em_rota: "#2563EB", entregue: "var(--green)", tentativa_frustrada: "var(--amber)", devolvido: "var(--red)" };

export default function ExpedicaoPage() {
  const { company } = useAuth();
  const [orders, setOrders] = useState([]);
  const [carriers, setCarriers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [orderId, setOrderId] = useState("");
  const [carrierId, setCarrierId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [driverId, setDriverId] = useState("");
  const [saving, setSaving] = useState(false);

  const [expandedId, setExpandedId] = useState(null);
  const [events, setEvents] = useState([]);
  const [proof, setProof] = useState(null);
  const [newEventType, setNewEventType] = useState("em_rota");
  const [newEventNote, setNewEventNote] = useState("");
  const [proofForm, setProofForm] = useState({ name: "", document: "" });

  async function loadAll() {
    setLoading(true);
    setError("");
    try {
      const [{ data: ords, error: e1 }, { data: carr, error: e2 }, { data: wh, error: e3 }, { data: ships, error: e4 }, { data: veh, error: e5 }, { data: drv, error: e6 }] = await Promise.all([
        supabase.from("wms_orders").select("id, code, customers:customer_id (name)").eq("status", "separado"),
        supabase.from("wms_carriers").select("id, name").eq("active", true).order("name"),
        supabase.from("warehouses").select("id, name").order("name"),
        supabase
          .from("shipments")
          .select("id, status, created_at, wms_carriers:carrier_id (name), wms_vehicles:vehicle_id (plate, model), wms_drivers:driver_id (full_name), wms_orders:wms_order_id (code, customers:customer_id (name))")
          .not("wms_order_id", "is", null)
          .order("created_at", { ascending: false })
          .limit(30),
        supabase.from("wms_vehicles").select("id, plate, model").eq("status", "active").order("plate"),
        supabase.from("wms_drivers").select("id, full_name").eq("status", "active").order("full_name"),
      ]);
      const firstError = e1 || e2 || e3 || e4 || e5 || e6;
      if (firstError) throw firstError;
      setOrders(ords ?? []);
      setCarriers(carr ?? []);
      setWarehouses(wh ?? []);
      setShipments(ships ?? []);
      setVehicles(veh ?? []);
      setDrivers(drv ?? []);
    } catch (err) {
      setError("Não foi possível carregar a tela: " + (err.message ?? "erro desconhecido"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (company?.id) loadAll(); }, [company?.id]);

  async function loadShipmentDetails(shipmentId) {
    const [{ data: ev }, { data: pf }] = await Promise.all([
      supabase.from("wms_shipment_events").select("id, event_type, description, occurred_at").eq("shipment_id", shipmentId).order("occurred_at", { ascending: false }),
      supabase.from("wms_delivery_proofs").select("id, received_by_name, received_by_document, delivered_at").eq("shipment_id", shipmentId).maybeSingle(),
    ]);
    setEvents(ev ?? []);
    setProof(pf ?? null);
  }

  function toggleExpand(shipment) {
    if (expandedId === shipment.id) { setExpandedId(null); return; }
    setExpandedId(shipment.id);
    loadShipmentDetails(shipment.id);
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    if (!orderId || !warehouseId) { setError("Escolha o pedido e o almoxarifado de origem."); return; }
    setSaving(true);

    const { data: orderItems } = await supabase.from("wms_order_items").select("product_id, quantity").eq("order_id", orderId);

    const { data: shipment, error: shipError } = await supabase
      .from("shipments")
      .insert({
        company_id: company.id, warehouse_id: warehouseId, wms_order_id: orderId,
        carrier_id: carrierId || null, vehicle_id: vehicleId || null, driver_id: driverId || null,
        status: "aguardando",
      })
      .select("id").single();

    if (shipError) { setError(shipError.message); setSaving(false); return; }

    await supabase.from("shipment_items").insert(
      (orderItems ?? []).map((it) => ({ company_id: company.id, shipment_id: shipment.id, product_id: it.product_id, quantity: it.quantity }))
    );

    for (const it of orderItems ?? []) {
      const { data: level } = await supabase.from("stock_levels").select("id, quantity").eq("product_id", it.product_id).eq("warehouse_id", warehouseId).is("location_id", null).maybeSingle();
      if (level) {
        await supabase.from("stock_levels").update({ quantity: Math.max(0, Number(level.quantity) - Number(it.quantity)) }).eq("id", level.id);
      }
      await supabase.from("stock_movements").insert({
        company_id: company.id, product_id: it.product_id, warehouse_id: warehouseId,
        movement_type: "saida", quantity: it.quantity, reference_type: "expedicao",
      });
    }

    await supabase.from("wms_orders").update({ status: "expedido" }).eq("id", orderId);

    setOrderId(""); setCarrierId(""); setWarehouseId(""); setVehicleId(""); setDriverId("");
    setSaving(false);
    await loadAll();
  }

  async function addEvent(shipmentId) {
    setError("");
    await supabase.from("wms_shipment_events").insert({
      company_id: company.id, shipment_id: shipmentId, event_type: newEventType, description: newEventNote || null,
    });
    await supabase.from("shipments").update({ status: newEventType }).eq("id", shipmentId);
    setNewEventNote("");
    await loadShipmentDetails(shipmentId);
    await loadAll();
  }

  async function saveProof(shipmentId) {
    if (!proofForm.name) { setError("Informe quem recebeu a carga."); return; }
    setError("");
    await supabase.from("wms_delivery_proofs").insert({
      company_id: company.id, shipment_id: shipmentId,
      received_by_name: proofForm.name, received_by_document: proofForm.document || null,
    });
    setProofForm({ name: "", document: "" });
    await loadShipmentDetails(shipmentId);
  }

  return (
    <div>
      <header style={{ marginBottom: 20 }}>
        <h1 style={styles.title}>Expedição</h1>
        <p style={styles.subtitle}>Só pedidos já separados aparecem aqui — acompanhe o status até a entrega, com canhoto digital.</p>
      </header>

      {error && <div style={styles.error}>{error}</div>}

      <form onSubmit={handleCreate} style={styles.form}>
        <p style={styles.formTitle}>Nova expedição</p>
        <div style={styles.row}>
          <select style={styles.input} value={orderId} onChange={(e) => setOrderId(e.target.value)} required>
            <option value="">Pedido separado...</option>
            {orders.map((o) => <option key={o.id} value={o.id}>{o.code} — {o.customers?.name ?? "sem cliente"}</option>)}
          </select>
          <select style={styles.input} value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} required>
            <option value="">Almoxarifado de origem...</option>
            {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>
        <div style={styles.row}>
          <select style={styles.input} value={carrierId} onChange={(e) => setCarrierId(e.target.value)}>
            <option value="">Transportadora (opcional)...</option>
            {carriers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select style={styles.input} value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
            <option value="">Veículo (opcional)...</option>
            {vehicles.map((v) => <option key={v.id} value={v.id}>{v.plate} {v.model && `— ${v.model}`}</option>)}
          </select>
          <select style={styles.input} value={driverId} onChange={(e) => setDriverId(e.target.value)}>
            <option value="">Motorista (opcional)...</option>
            {drivers.map((d) => <option key={d.id} value={d.id}>{d.full_name}</option>)}
          </select>
        </div>
        <button style={styles.saveBtn} type="submit" disabled={saving}>{saving ? "Expedindo..." : "Confirmar expedição"}</button>
      </form>

      <h2 style={styles.title2}>Últimas expedições</h2>
      {loading ? (
        <p style={styles.dim}>Carregando...</p>
      ) : shipments.length === 0 ? (
        <p style={styles.dim}>Nenhuma expedição registrada ainda.</p>
      ) : (
        <div style={styles.list}>
          {shipments.map((s) => (
            <div key={s.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <div>
                  <strong>{s.wms_orders?.code ?? "—"}</strong>
                  <span style={styles.dim}> · {s.wms_orders?.customers?.name ?? "—"}</span>
                </div>
                <span style={{ ...styles.statusBadge, color: STATUS_COLOR[s.status] }}>{STATUS_LABEL[s.status] ?? s.status}</span>
              </div>
              <p style={styles.dim}>
                {s.wms_carriers?.name ?? "sem transportadora"} · {s.wms_drivers?.full_name ?? "sem motorista"} {s.wms_vehicles?.plate && `/ ${s.wms_vehicles.plate}`}
              </p>
              <button style={styles.expandBtn} onClick={() => toggleExpand(s)} type="button">
                {expandedId === s.id ? "Fechar" : "Ver status e canhoto"}
              </button>

              {expandedId === s.id && (
                <div style={styles.detailsBox}>
                  <p style={styles.detailsLabel}>Linha do tempo</p>
                  {events.length === 0 ? (
                    <p style={styles.dim}>Nenhum evento registrado ainda.</p>
                  ) : (
                    <ul style={styles.eventList}>
                      {events.map((ev) => (
                        <li key={ev.id} style={styles.eventItem}>
                          <span style={{ color: STATUS_COLOR[ev.event_type] ?? "var(--text)" }}>{STATUS_LABEL[ev.event_type] ?? ev.event_type}</span>
                          {ev.description && ` — ${ev.description}`}
                          <span style={styles.dim}> ({new Date(ev.occurred_at).toLocaleString("pt-BR")})</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {s.status !== "entregue" && (
                    <div style={styles.addEventRow}>
                      <select style={styles.input} value={newEventType} onChange={(e) => setNewEventType(e.target.value)}>
                        {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                      <input style={styles.input} placeholder="Observação (opcional)" value={newEventNote} onChange={(e) => setNewEventNote(e.target.value)} />
                      <button style={styles.addBtn} onClick={() => addEvent(s.id)} type="button">Atualizar status</button>
                    </div>
                  )}

                  <p style={{ ...styles.detailsLabel, marginTop: 16 }}>Canhoto digital</p>
                  {proof ? (
                    <p style={styles.dim}>
                      Recebido por {proof.received_by_name}{proof.received_by_document && ` (${proof.received_by_document})`} em {new Date(proof.delivered_at).toLocaleString("pt-BR")}
                    </p>
                  ) : s.status === "entregue" ? (
                    <div style={styles.addEventRow}>
                      <input style={styles.input} placeholder="Nome de quem recebeu" value={proofForm.name} onChange={(e) => setProofForm((p) => ({ ...p, name: e.target.value }))} />
                      <input style={styles.input} placeholder="CPF/RG (opcional)" value={proofForm.document} onChange={(e) => setProofForm((p) => ({ ...p, document: e.target.value }))} />
                      <button style={styles.addBtn} onClick={() => saveProof(s.id)} type="button">Salvar canhoto</button>
                    </div>
                  ) : (
                    <p style={styles.dim}>Disponível quando o status virar "Entregue".</p>
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
  title2: { fontFamily: "var(--font-display)", fontSize: 16, margin: "0 0 12px" },
  subtitle: { color: "var(--text-dim)", fontSize: 13, margin: "6px 0 0" },
  dim: { color: "var(--text-dim)", fontSize: 12.5 },
  form: { display: "flex", flexDirection: "column", gap: 12, background: "var(--panel)", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: 20, marginBottom: 28, maxWidth: 780 },
  formTitle: { fontSize: 13, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.04em", margin: "0 0 4px" },
  row: { display: "flex", gap: 10, flexWrap: "wrap" },
  input: { flex: 1, minWidth: 150, background: "var(--panel-2)", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: "9px 10px", color: "var(--text)", fontSize: 13 },
  saveBtn: { background: "var(--amber)", color: "#FFFFFF", border: "none", borderRadius: "var(--radius)", padding: "10px 0", fontWeight: 700, fontSize: 13, cursor: "pointer" },
  list: { display: "flex", flexDirection: "column", gap: 12, maxWidth: 780 },
  card: { background: "var(--panel)", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: 16 },
  cardHeader: { display: "flex", justifyContent: "space-between", marginBottom: 4 },
  statusBadge: { fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" },
  expandBtn: { marginTop: 8, background: "transparent", border: "1px solid var(--line)", color: "var(--text-dim)", borderRadius: "var(--radius)", padding: "6px 14px", fontSize: 12, cursor: "pointer" },
  detailsBox: { marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--line)" },
  detailsLabel: { fontSize: 11, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.04em", margin: "0 0 8px" },
  eventList: { listStyle: "none", padding: 0, margin: "0 0 10px", display: "flex", flexDirection: "column", gap: 4 },
  eventItem: { fontSize: 12.5 },
  addEventRow: { display: "flex", gap: 8, flexWrap: "wrap" },
  addBtn: { background: "var(--panel-2)", border: "1px solid var(--line)", color: "var(--text)", borderRadius: "var(--radius)", padding: "9px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" },
  error: { background: "rgba(217,105,95,0.12)", border: "1px solid var(--red)", color: "var(--red)", borderRadius: "var(--radius)", padding: "10px 12px", fontSize: 13, marginBottom: 16, maxWidth: 780 },
};
