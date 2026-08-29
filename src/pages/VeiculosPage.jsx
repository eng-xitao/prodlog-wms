import ModulePage from "../components/ModulePage";

const TYPE_OPTIONS = [
  { value: "caminhao", label: "Caminhão" },
  { value: "carreta", label: "Carreta" },
  { value: "van", label: "Van" },
  { value: "utilitario", label: "Utilitário" },
  { value: "moto", label: "Moto" },
];

export default function VeiculosPage() {
  return (
    <ModulePage
      table="wms_vehicles"
      title="Veículos"
      subtitle="Sua frota — usada na expedição pra saber quem levou cada carga."
      emptyLabel="Nenhum veículo cadastrado ainda."
      statusField={{ key: "status", activeValue: "active", inactiveValue: "inactive", trueLabel: "Ativo", falseLabel: "Inativo" }}
      fields={[
        { key: "plate", label: "Placa", placeholder: "ABC-1D23", required: true },
        { key: "model", label: "Modelo", placeholder: "Ex: Mercedes-Benz Atego" },
        { key: "vehicle_type", label: "Tipo", type: "select", options: TYPE_OPTIONS, required: true },
        { key: "capacity_kg", label: "Capacidade (kg)", type: "number" },
        { key: "capacity_m3", label: "Capacidade (m³)", type: "number" },
        { key: "notes", label: "Observações" },
      ]}
    />
  );
}
