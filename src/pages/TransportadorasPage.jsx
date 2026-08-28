import ModulePage from "../components/ModulePage";

export default function TransportadorasPage() {
  return (
    <ModulePage
      table="wms_carriers"
      title="Transportadoras"
      subtitle="Usadas na expedição, pra registrar quem levou a carga."
      emptyLabel="Nenhuma transportadora cadastrada ainda."
      fields={[
        { key: "name", label: "Nome", required: true },
        { key: "document", label: "CNPJ" },
        { key: "contact", label: "Contato" },
        { key: "email", label: "E-mail" },
      ]}
    />
  );
}
