import ModulePage from "../components/ModulePage";

export default function AlmoxarifadosPage() {
  return (
    <ModulePage
      table="warehouses"
      title="Almoxarifados"
      subtitle="Locais físicos de estoque da sua empresa."
      emptyLabel="Nenhum almoxarifado cadastrado ainda."
      fields={[
        { key: "name", label: "Nome", placeholder: "Ex: Depósito Central, Armazém 2", required: true },
        { key: "location", label: "Localização/Endereço", placeholder: "Endereço do local (opcional)" },
      ]}
    />
  );
}
