import { neon } from '@neondatabase/serverless';

const url = process.env.MASTER_DATABASE_URL || process.env.DATABASE_URL || '';
export const masterSql = neon(url);

export async function ensureMasterSchema() {
  await masterSql`
    CREATE TABLE IF NOT EXISTS master_empresas (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      razao_social text NOT NULL,
      nome_fantasia text,
      cnpj text NOT NULL UNIQUE,
      plano text NOT NULL DEFAULT 'Básico',
      status text NOT NULL DEFAULT 'Ativa',
      database_url text,
      logo_url text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS master_mensalidades (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      empresa_id uuid NOT NULL REFERENCES master_empresas(id) ON DELETE CASCADE,
      vencimento date NOT NULL,
      valor numeric(14,2) NOT NULL DEFAULT 0,
      status text NOT NULL DEFAULT 'Pendente',
      observacao text,
      created_at timestamptz NOT NULL DEFAULT now()
    );
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
