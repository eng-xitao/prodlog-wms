import ModulePage from "../components/ModulePage";

const TYPE_OPTIONS = [
  { value: "acabado", label: "Produto acabado" },
  { value: "componente", label: "Componente" },
  { value: "materia_prima", label: "Matéria-prima" },
  { value: "insumo", label: "Insumo" },
  { value: "maquina", label: "Máquina" },
];

export default function ProdutosPage() {
  return (
    <ModulePage
      table="products"
      title="Produtos"
      subtitle="Itens controlados no seu armazém."
      emptyLabel="Nenhum produto cadastrado ainda."
      statusField={{ key: "status", activeValue: "active", inactiveValue: "inactive", trueLabel: "Ativo", falseLabel: "Inativo" }}
      fields={[
        { key: "sku", label: "SKU", placeholder: "Código único do item", required: true },
        { key: "name", label: "Nome", required: true },
        { key: "type", label: "Classe", type: "select", options: TYPE_OPTIONS, required: true },
        { key: "unit", label: "Unidade", placeholder: "Ex: UN, KG, CX", required: true },
        { key: "min_stock", label: "Estoque mínimo", type: "number" },
        { key: "reorder_point", label: "Ponto de pedido", type: "number", placeholder: "Se vazio, usa o estoque mínimo" },
        { key: "max_stock", label: "Estoque máximo", type: "number" },
      ]}
    />
  );
}
