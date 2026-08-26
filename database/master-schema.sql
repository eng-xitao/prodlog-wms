-- ProdLog WMS 1.0 - estrutura inicial do banco MASTER
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS empresas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  razao_social text NOT NULL,
  nome_fantasia text NOT NULL,
  cnpj text,
  email text,
  telefone text,
  plano text NOT NULL DEFAULT 'Básico',
  status text NOT NULL DEFAULT 'Ativa',
  database_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS master_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'MASTER',
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS assinaturas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  plano text NOT NULL,
  valor numeric(12,2) NOT NULL DEFAULT 0,
  usuarios_inclusos integer NOT NULL DEFAULT 5,
  usuarios_adicionais integer NOT NULL DEFAULT 0,
  vencimento date,
  status text NOT NULL DEFAULT 'Ativa',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chamados_suporte (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  assunto text NOT NULL,
  prioridade text NOT NULL DEFAULT 'Normal',
  status text NOT NULL DEFAULT 'Aberto',
  descricao text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS auditoria_master (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES master_users(id),
  empresa_id uuid REFERENCES empresas(id),
  acao text NOT NULL,
  detalhes jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
