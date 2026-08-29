import ModulePage from "../components/ModulePage";

export default function MotoristasPage() {
  return (
    <ModulePage
      table="wms_drivers"
      title="Motoristas"
      subtitle="Quem dirige — usado na expedição pra saber quem levou cada carga."
      emptyLabel="Nenhum motorista cadastrado ainda."
      statusField={{ key: "status", activeValue: "active", inactiveValue: "inactive", trueLabel: "Ativo", falseLabel: "Inativo" }}
      fields={[
        { key: "full_name", label: "Nome completo", required: true },
        { key: "document", label: "CPF" },
        { key: "cnh_number", label: "Número da CNH" },
        { key: "cnh_category", label: "Categoria da CNH", placeholder: "Ex: D, E" },
        { key: "cnh_expiry", label: "Validade da CNH", type: "date" },
        { key: "phone", label: "Telefone" },
      ]}
    />
  );
}
