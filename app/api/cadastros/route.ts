import { NextResponse } from 'next/server';
import { masterSql, ensureMasterSchema } from '@/lib/master-db';
import { tenantSql } from '@/lib/tenant-db';

const TYPES = ['clientes', 'fornecedores', 'transportadoras'] as const;
type TypeKey = typeof TYPES[number];

function validType(value: string): TypeKey {
  if ((TYPES as readonly string[]).includes(value)) return value as TypeKey;
  throw new Error('Tipo de cadastro inválido.');
}

async function getTenantDb(companyId: string) {
  await ensureMasterSchema();
  const rows = await masterSql`SELECT database_url FROM master_empresas WHERE id=${companyId} AND status='Ativa' LIMIT 1`;
  if (!rows[0]?.database_url) throw new Error('Banco da empresa não configurado.');
  return tenantSql(rows[0].database_url);
}

async function ensureTables(sql: ReturnType<typeof tenantSql>) {
  await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`;
  await sql`CREATE TABLE IF NOT EXISTS clientes (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), nome text NOT NULL, documento text NOT NULL, cidade text, contato text, email text, ativo boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now())`;
  await sql`CREATE TABLE IF NOT EXISTS fornecedores (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), nome text NOT NULL, documento text NOT NULL, cidade text, contato text, email text, ativo boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now())`;
  await sql`CREATE TABLE IF NOT EXISTS transportadoras (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), nome text NOT NULL, documento text, contato text, email text, ativo boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now())`;
}

async function selectRows(sql: ReturnType<typeof tenantSql>, type: TypeKey) {
  if (type === 'clientes') return sql`SELECT id,nome,documento,cidade,contato,email,ativo,created_at FROM clientes ORDER BY created_at DESC`;
  if (type === 'fornecedores') return sql`SELECT id,nome,documento,cidade,contato,email,ativo,created_at FROM fornecedores ORDER BY created_at DESC`;
  return sql`SELECT id,nome,documento,cidade,contato,email,ativo,created_at FROM transportadoras ORDER BY created_at DESC`;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const companyId = url.searchParams.get('companyId');
    const type = validType(url.searchParams.get('type') || 'clientes');
    if (!companyId) return NextResponse.json({ error: 'companyId é obrigatório.' }, { status: 400 });
    const sql = await getTenantDb(companyId);
    await ensureTables(sql);
    return NextResponse.json(await selectRows(sql, type));
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erro ao consultar cadastros.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const type = validType(body.type || 'clientes');
    if (!body.companyId || !body.nome?.trim() || !body.documento?.trim()) return NextResponse.json({ error: 'Empresa, nome/razão social e CPF/CNPJ são obrigatórios.' }, { status: 400 });
    const sql = await getTenantDb(body.companyId);
    await ensureTables(sql);
    const nome = body.nome.trim(); const documento = body.documento.trim();
    const cidade = body.cidade || null; const contato = body.contato || null; const email = body.email || null; const ativo = body.ativo !== false;
    let rows;
    if (type === 'clientes') rows = await sql`INSERT INTO clientes (nome,documento,cidade,contato,email,ativo) VALUES (${nome},${documento},${cidade},${contato},${email},${ativo}) RETURNING *`;
    else if (type === 'fornecedores') rows = await sql`INSERT INTO fornecedores (nome,documento,cidade,contato,email,ativo) VALUES (${nome},${documento},${cidade},${contato},${email},${ativo}) RETURNING *`;
    else rows = await sql`INSERT INTO transportadoras (nome,documento,cidade,contato,email,ativo) VALUES (${nome},${documento},${cidade},${contato},${email},${ativo}) RETURNING *`;
    return NextResponse.json(rows[0], { status: 201 });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erro ao cadastrar.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url); const companyId = url.searchParams.get('companyId'); const id = url.searchParams.get('id'); const type = validType(url.searchParams.get('type') || 'clientes');
    if (!companyId || !id) return NextResponse.json({ error: 'companyId e id são obrigatórios.' }, { status: 400 });
    const sql = await getTenantDb(companyId); await ensureTables(sql);
    if (type === 'clientes') await sql`DELETE FROM clientes WHERE id=${id}`;
    else if (type === 'fornecedores') await sql`DELETE FROM fornecedores WHERE id=${id}`;
    else await sql`DELETE FROM transportadoras WHERE id=${id}`;
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erro ao excluir.' }, { status: 500 });
  }
}
