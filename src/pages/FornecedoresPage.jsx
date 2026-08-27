import ModulePage from "../components/ModulePage";

export default function FornecedoresPage() {
  return (
    <ModulePage
      table="suppliers"
      title="Fornecedores"
      subtitle="Quem entrega material pro seu armazém — usado no recebimento."
      emptyLabel="Nenhum fornecedor cadastrado ainda."
      autoGenerateCode={{ field: "code", rpc: "next_supplier_code" }}
      fields={[
        { key: "code", label: "Código", placeholder: "Gerado automaticamente", required: true },
        { key: "name", label: "Nome", placeholder: "Nome ou razão social", required: true },
        { key: "document", label: "CPF/CNPJ", placeholder: "Documento do fornecedor" },
        { key: "email", label: "E-mail" },
        { key: "phone", label: "Telefone" },
        { key: "lead_time_days", label: "Prazo de entrega (dias)", type: "number" },
        { key: "address", label: "Endereço" },
      ]}
    />
  );
}
