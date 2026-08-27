# ProdLog WMS

Gestão de armazém e estoque — segundo produto da plataforma ProdOS.
Mesma conta, mesmo login, mesmo banco de dados de produtos/estoque do ProdOS;
o ProdLog adiciona uma camada de endereçamento (localização dentro do
almoxarifado) e um fluxo de movimentação pensado pra operação de armazém.

## Como rodar localmente

```bash
npm install
cp .env.example .env   # preencha com os dados do projeto Supabase
npm run dev
```

## Arquitetura

- **Banco de dados**: o mesmo Supabase do ProdOS (`fxrtwnqmncffzumeqelj`) — não é um projeto separado.
- **Autenticação**: `auth.users` e `profiles` compartilhados com o ProdOS. Uma pessoa que já tem conta no ProdOS usa a mesma conta aqui.
- **Assinatura**: controlada pela tabela `company_products`, filtrando por `product_key = 'prodlog'`. Uma empresa pode ter ProdOS, ProdLog, os dois, ou nenhum.
- **Dados de estoque**: reaproveita as tabelas `products`, `warehouses`, `stock_levels`, `stock_movements` que já existem pro ProdOS. O ProdLog adiciona `warehouse_locations` (endereço dentro do armazém) e a coluna `location_id` em `stock_levels`.
