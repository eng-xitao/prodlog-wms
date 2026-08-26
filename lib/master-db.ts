import { neon } from '@neondatabase/serverless';

const url = process.env.MASTER_DATABASE_URL || process.env.DATABASE_URL || '';
export const masterSql = neon(url);

export async function ensureMasterSchema() {
  await masterSql`
    CREATE EXTENSION IF NOT EXISTS pgcrypto;
    CREATE TABLE IF NOT EXISTS master_empresas (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      razao_social text NOT NULL,
      nome_fantasia text,
      cnpj text NOT NULL UNIQUE,
      plano text NOT NULL DEFAULT 'Básico',
      status text NOT NULL DEFAULT 'Ativa',
      database_url text,
      logo_url text,
      asaas_customer_id text,
      asaas_subscription_id text,
      assinatura_status text NOT NULL DEFAULT 'Pendente',
      focus_nfe_empresa_id text,
      focus_nfe_ambiente text NOT NULL DEFAULT 'producao',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
    ALTER TABLE master_empresas ADD COLUMN IF NOT EXISTS asaas_customer_id text;
    ALTER TABLE master_empresas ADD COLUMN IF NOT EXISTS asaas_subscription_id text;
    ALTER TABLE master_empresas ADD COLUMN IF NOT EXISTS assinatura_status text NOT NULL DEFAULT 'Pendente';
    ALTER TABLE master_empresas ADD COLUMN IF NOT EXISTS focus_nfe_empresa_id text;
    ALTER TABLE master_empresas ADD COLUMN IF NOT EXISTS focus_nfe_ambiente text NOT NULL DEFAULT 'producao';

    CREATE TABLE IF NOT EXISTS master_mensalidades (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      empresa_id uuid NOT NULL REFERENCES master_empresas(id) ON DELETE CASCADE,
      asaas_payment_id text,
      asaas_subscription_id text,
      vencimento date NOT NULL,
      valor numeric(14,2) NOT NULL DEFAULT 0,
      status text NOT NULL DEFAULT 'Pendente',
      observacao text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
    ALTER TABLE master_mensalidades ADD COLUMN IF NOT EXISTS asaas_payment_id text;
    ALTER TABLE master_mensalidades ADD COLUMN IF NOT EXISTS asaas_subscription_id text;
    ALTER TABLE master_mensalidades ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

    CREATE TABLE IF NOT EXISTS master_chamados (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      empresa_id uuid NOT NULL REFERENCES master_empresas(id) ON DELETE CASCADE,
      assunto text NOT NULL,
      prioridade text NOT NULL DEFAULT 'Normal',
      status text NOT NULL DEFAULT 'Aberto',
      responsavel text,
      descricao text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  `;
}
