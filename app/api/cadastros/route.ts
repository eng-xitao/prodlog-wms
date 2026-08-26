import { NextResponse } from 'next/server';
import { masterSql, ensureMasterSchema } from '@/lib/master-db';
import { tenantSql } from '@/lib/tenant-db';

const tableByType = { clientes: 'clientes', fornecedores: 'fornecedores', transportadoras: 'transportadoras' } as const;
type TypeKey = keyof typeof tableByType;

async function getTenantDb(companyId: string) {
  await ensureMasterSchema();
  const rows = await masterSql`SELECT database_url FROM master_empresas WHERE id=${companyId} AND status='Ativa' LIMIT 1`;
  if (!rows[0]?.database_url) throw new Error('Banco da empresa não configurado.');
  return tenantSql(rows[0].database_url);
}

function table(type: string): TypeKey {
  const key = type.toLowerCase() as TypeKey;
  if (!(key in tableByType)) throw new Error('Tipo de cadastro inválido.');
  return key;
}

async function ensureTables(sql: any) {
  await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`;
  await sql`CREATE TABLE IF NOT EXISTS clientes (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), nome text NOT NULL, documento text NOT NULL, cidade text, contato text, email text, ativo boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now())`;
  await sql`CREATE TABLE IF NOT EXISTS fornecedores (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), nome text NOT NULL, documento text NOT NULL, cidade text, contato text, email text, ativo boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now())`;
  await sql`CREATE TABLE IF NOT EXISTS transportadoras (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), nome text NOT NULL, documento text, contato text, email text, ativo boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now())`;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const companyId = url.searchParams.get('companyId');
    const type = table(url.searchParams.get('type') || 'clientes');
    if (!companyId) return NextResponse.json({ error: 'companyId é obrigatório.' }, { status: 400 });
    const sql = await getTenantDb(companyId); await ensureTables(sql);
    const rows = await sql(`SELECT id,nome,documento,cidade,contato,email,ativo,status FROM ${tableByType[type]} ORDER BY created_at DESC`);
    return NextResponse.json(rows);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const type = table(body.type || 'clientes');
    if (!body.companyId || !body.nome?.trim() || !body.documento?.trim()) return NextResponse.json({ error: 'Empresa, nome/razão social e CPF/CNPJ são obrigatórios.' }, { status: 400 });
    const sql = await getTenantDb(body.companyId); await ensureTables(sql);
    const rows = await sql(`INSERT INTO ${tableByType[type]} (nome,documento,cidade,contato,email,ativo) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id,nome,documento,cidade,contato,email,ativo,created_at`, [body.nome.trim(), body.documento.trim(), body.cidade || null, body.contato || null, body.email || null, body.ativo !== false]);
    return NextResponse.json(rows[0], { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const companyId = url.searchParams.get('companyId');
    const type = table(url.searchParams.get('type') || 'clientes');
    const id = url.searchParams.get('id');
    if (!companyId || !id) return NextResponse.json({ error: 'companyId e id são obrigatórios.' }, { status: 400 });
    const sql = await getTenantDb(companyId); await ensureTables(sql);
    await sql(`DELETE FROM ${tableByType[type]} WHERE id=$1`, [id]);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
