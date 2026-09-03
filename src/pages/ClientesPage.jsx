import ModulePage from "../components/ModulePage";

export default function ClientesPage() {
  return (
    <ModulePage
      table="customers"
      title="Clientes"
      subtitle="Quem recebe as mercadorias — usado na expedição."
      emptyLabel="Nenhum cliente cadastrado ainda."
      autoGenerateCode={{ field: "code", rpc: "next_customer_code" }}
      fields={[
        { key: "code", label: "Código", placeholder: "Gerado automaticamente", required: true },
        { key: "name", label: "Nome / Razão Social", placeholder: "Nome do cliente", required: true },
        { key: "document", label: "CPF/CNPJ" },
        { key: "email", label: "E-mail" },
        { key: "phone", label: "Telefone" },
        { key: "address", label: "Endereço de entrega" },
      ]}
    />
  );
}
