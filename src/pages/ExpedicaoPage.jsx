import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/AuthContext";

export default function ExpedicaoPage() {
  const { company } = useAuth();
  const [orders, setOrders] = useState([]);
  const [carriers, setCarriers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [orderId, setOrderId] = useState("");
  const [carrierId, setCarrierId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [driverName, setDriverName] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadAll() {
    setLoading(true);
    setError("");
    try {
      const [{ data: ords, error: e1 }, { data: carr, error: e2 }, { data: wh, error: e3 }, { data: ships, error: e4 }] = await Promise.all([
        supabase.from("wms_orders").select("id, code, customers:customer_id (name)").eq("status", "separado"),
        supabase.from("wms_carriers").select("id, name").eq("active", true).order("name"),
        supabase.from("warehouses").select("id, name").order("name"),
        supabase
          .from("shipments")
          .select("id, status, created_at, driver_name, vehicle_plate, wms_carriers:carrier_id (name), wms_orders:wms_order_id (code, customers:customer_id (name))")
          .not("wms_order_id", "is", null)
          .order("created_at", { ascending: false })
          .limit(30),
      ]);
      const firstError = e1 || e2 || e3 || e4;
      if (firstError) throw firstError;
      setOrders(ords ?? []);
      setCarriers(carr ?? []);
      setWarehouses(wh ?? []);
      setShipments(ships ?? []);
    } catch (err) {
      setError("Não foi possível carregar a tela: " + (err.message ?? "erro desconhecido"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (company?.id) loadAll(); }, [company?.id]);

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
        carrier_id: carrierId || null, driver_name: driverName || null, vehicle_plate: vehiclePlate || null,
        status: "entregue",
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

    setOrderId(""); setCarrierId(""); setWarehouseId(""); setDriverName(""); setVehiclePlate("");
    setSaving(false);
    await loadAll();
  }

  return (
    <div>
      <header style={{ marginBottom: 20 }}>
        <h1 style={styles.title}>Expedição</h1>
        <p style={styles.subtitle}>Só pedidos já separados aparecem aqui — confirmar já dá baixa no estoque.</p>
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
          <input style={styles.input} placeholder="Motorista (opcional)" value={driverName} onChange={(e) => setDriverName(e.target.value)} />
          <input style={styles.input} placeholder="Placa (opcional)" value={vehiclePlate} onChange={(e) => setVehiclePlate(e.target.value)} />
        </div>
        <button style={styles.saveBtn} type="submit" disabled={saving}>{saving ? "Expedindo..." : "Confirmar expedição"}</button>
      </form>

      <h2 style={styles.title2}>Últimas expedições</h2>
      {loading ? (
        <p style={styles.dim}>Carregando...</p>
      ) : shipments.length === 0 ? (
        <p style={styles.dim}>Nenhuma expedição registrada ainda.</p>
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead><tr><th style={styles.th}>Pedido</th><th style={styles.th}>Cliente</th><th style={styles.th}>Transportadora</th><th style={styles.th}>Motorista/Placa</th><th style={styles.th}>Quando</th></tr></thead>
            <tbody>
              {shipments.map((s) => (
                <tr key={s.id}>
                  <td style={styles.td}>{s.wms_orders?.code ?? "—"}</td>
                  <td style={styles.td}>{s.wms_orders?.customers?.name ?? "—"}</td>
                  <td style={styles.td}>{s.wms_carriers?.name ?? "—"}</td>
                  <td style={styles.td}>{s.driver_name ?? "—"} {s.vehicle_plate && `/ ${s.vehicle_plate}`}</td>
                  <td style={styles.td}>{new Date(s.created_at).toLocaleString("pt-BR")}</td>
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
  dim: { color: "var(--text-dim)", fontSize: 12.5 },
  form: { display: "flex", flexDirection: "column", gap: 12, background: "var(--panel)", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: 20, marginBottom: 28, maxWidth: 720 },
  formTitle: { fontSize: 13, fontWeight: 700, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.04em", margin: "0 0 4px" },
  row: { display: "flex", gap: 10, flexWrap: "wrap" },
  input: { flex: 1, minWidth: 150, background: "var(--panel-2)", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: "9px 10px", color: "var(--text)", fontSize: 13 },
  saveBtn: { background: "var(--amber)", color: "#FFFFFF", border: "none", borderRadius: "var(--radius)", padding: "10px 0", fontWeight: 700, fontSize: 13, cursor: "pointer" },
  tableWrap: { border: "1px solid var(--line)", borderRadius: "var(--radius)", overflow: "hidden", overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--text-dim)", padding: "10px 14px", background: "var(--panel)", borderBottom: "1px solid var(--line)" },
  td: { padding: "10px 14px", fontSize: 13.5, background: "var(--panel)", borderBottom: "1px solid var(--line)" },
  error: { background: "rgba(217,105,95,0.12)", border: "1px solid var(--red)", color: "var(--red)", borderRadius: "var(--radius)", padding: "10px 12px", fontSize: 13, marginBottom: 16, maxWidth: 720 },
};
