import ModulePage from "../components/ModulePage";

export default function TabelaFretePage() {
  return (
    <ModulePage
      table="wms_freight_table"
      title="Tabela de Frete"
      subtitle="Faixas de peso e regiões pra calcular o valor do frete rapidamente."
      emptyLabel="Nenhuma faixa de frete cadastrada ainda."
      statusField={{ key: "active", trueLabel: "Ativa", falseLabel: "Inativa" }}
      fields={[
        { key: "name", label: "Nome da faixa", placeholder: "Ex: Sudeste até 500kg", required: true },
        { key: "origin_region", label: "Origem", placeholder: "Ex: São Paulo/SP" },
        { key: "destination_region", label: "Destino", placeholder: "Ex: Região Sudeste" },
        { key: "min_weight_kg", label: "Peso mínimo (kg)", type: "number", required: true },
        { key: "max_weight_kg", label: "Peso máximo (kg)", type: "number", placeholder: "Vazio = sem limite" },
        { key: "base_price", label: "Valor fixo (R$)", type: "currency" },
        { key: "price_per_kg", label: "Valor por kg (R$)", type: "currency" },
      ]}
    />
  );
}
