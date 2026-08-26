-- ProdLog WMS 1.0 - estrutura inicial do banco INDIVIDUAL de cada empresa
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS usuarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  cargo text,
  departamento text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS perfis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text UNIQUE NOT NULL,
  descricao text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS permissoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  modulo text NOT NULL,
  visualizar boolean NOT NULL DEFAULT false,
  criar boolean NOT NULL DEFAULT false,
  editar boolean NOT NULL DEFAULT false,
  excluir boolean NOT NULL DEFAULT false,
  aprovar boolean NOT NULL DEFAULT false,
  UNIQUE(modulo)
);

CREATE TABLE IF NOT EXISTS usuario_perfis (
  usuario_id uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  perfil_id uuid NOT NULL REFERENCES perfis(id) ON DELETE CASCADE,
  PRIMARY KEY (usuario_id, perfil_id)
);

CREATE TABLE IF NOT EXISTS perfil_permissoes (
  perfil_id uuid NOT NULL REFERENCES perfis(id) ON DELETE CASCADE,
  permissao_id uuid NOT NULL REFERENCES permissoes(id) ON DELETE CASCADE,
  PRIMARY KEY (perfil_id, permissao_id)
);

CREATE TABLE IF NOT EXISTS armazens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text UNIQUE NOT NULL,
  nome text NOT NULL,
  status text NOT NULL DEFAULT 'Ativo',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS enderecos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  armazem_id uuid NOT NULL REFERENCES armazens(id) ON DELETE CASCADE,
  corredor text,
  rua text,
  modulo text,
  nivel text,
  posicao text NOT NULL,
  capacidade numeric(14,3) NOT NULL DEFAULT 0,
  ocupacao numeric(14,3) NOT NULL DEFAULT 0,
  tipo text NOT NULL DEFAULT 'Estoque',
  status text NOT NULL DEFAULT 'Disponível',
  UNIQUE(armazem_id, posicao)
);

CREATE TABLE IF NOT EXISTS produtos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku text UNIQUE NOT NULL,
  descricao text NOT NULL,
  categoria text,
  unidade text NOT NULL DEFAULT 'un',
  lote_controlado boolean NOT NULL DEFAULT false,
  validade_controlada boolean NOT NULL DEFAULT false,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS estoque (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id uuid NOT NULL REFERENCES produtos(id),
  endereco_id uuid REFERENCES enderecos(id),
  lote text,
  validade date,
  quantidade numeric(14,3) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'Disponível',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS movimentacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id uuid NOT NULL REFERENCES produtos(id),
  origem_endereco_id uuid REFERENCES enderecos(id),
  destino_endereco_id uuid REFERENCES enderecos(id),
  quantidade numeric(14,3) NOT NULL,
  motivo text,
  usuario_id uuid REFERENCES usuarios(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS recebimentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fornecedor text,
  documento text,
  status text NOT NULL DEFAULT 'Pendente',
  data_recebimento timestamptz,
  usuario_id uuid REFERENCES usuarios(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pedidos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero text UNIQUE NOT NULL,
  cliente text,
  status text NOT NULL DEFAULT 'Pendente',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pedido_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id uuid NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  produto_id uuid NOT NULL REFERENCES produtos(id),
  quantidade numeric(14,3) NOT NULL
);

CREATE TABLE IF NOT EXISTS picking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id uuid NOT NULL REFERENCES pedidos(id),
  status text NOT NULL DEFAULT 'Pendente',
  usuario_id uuid REFERENCES usuarios(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS expedicoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id uuid NOT NULL REFERENCES pedidos(id),
  transportadora text,
  motorista text,
  placa text,
  status text NOT NULL DEFAULT 'Pendente',
  expedido_em timestamptz,
  usuario_id uuid REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS inventarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text UNIQUE NOT NULL,
  tipo text NOT NULL DEFAULT 'Rotativo',
  status text NOT NULL DEFAULT 'Aberto',
  criado_por uuid REFERENCES usuarios(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  encerrado_em timestamptz
);

CREATE TABLE IF NOT EXISTS inventario_contagens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inventario_id uuid NOT NULL REFERENCES inventarios(id) ON DELETE CASCADE,
  produto_id uuid NOT NULL REFERENCES produtos(id),
  endereco_id uuid REFERENCES enderecos(id),
  quantidade_sistema numeric(14,3) NOT NULL DEFAULT 0,
  quantidade_contada numeric(14,3),
  divergencia numeric(14,3),
  usuario_id uuid REFERENCES usuarios(id),
  contado_em timestamptz
);

CREATE TABLE IF NOT EXISTS auditoria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid REFERENCES usuarios(id),
  modulo text NOT NULL,
  acao text NOT NULL,
  registro_id uuid,
  detalhes jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO perfis (nome, descricao) VALUES
('Administrador da Empresa', 'Acesso administrativo ao ambiente da empresa'),
('Gestor WMS', 'Gestão operacional do WMS'),
('Recebimento', 'Operações de recebimento'),
('Armazenagem', 'Operações de armazenagem e movimentação'),
('Picking', 'Separação de pedidos'),
('Expedição', 'Conferência e expedição'),
('Inventário', 'Contagem e inventário'),
('Consulta', 'Acesso somente para consulta')
ON CONFLICT (nome) DO NOTHING;

INSERT INTO permissoes (modulo, visualizar, criar, editar, excluir, aprovar) VALUES
('dashboard', true, false, false, false, false),
('recebimento', true, true, true, false, true),
('estoque', true, true, true, false, false),
('enderecamento', true, true, true, true, false),
('movimentacoes', true, true, true, false, false),
('picking', true, true, true, false, false),
('expedicao', true, true, true, false, true),
('inventario', true, true, true, false, true),
('relatorios', true, false, false, false, false),
('usuarios', true, true, true, false, false),
('configuracoes', true, true, true, false, true)
ON CONFLICT (modulo) DO NOTHING;
