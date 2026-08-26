import { NextResponse } from 'next/server';
import { masterSql, ensureMasterSchema } from '@/lib/master-db';
import { tenantSql } from '@/lib/tenant-db';

async function getTenantDb(companyId: string) {
  await ensureMasterSchema();
  const rows = await masterSql`SELECT database_url FROM master_empresas WHERE id=${companyId} AND status='Ativa' LIMIT 1`;
  const url = rows[0]?.database_url;
  if (!url) throw new Error('Banco da empresa não configurado. Cadastre a DATABASE_URL do tenant no cadastro da empresa.');
  return tenantSql(url);
}

async function ensureTenantUsers(sql: any) {
  await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`;
  await sql`CREATE TABLE IF NOT EXISTS usuarios (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), nome text NOT NULL, email text UNIQUE NOT NULL, password_hash text NOT NULL DEFAULT '', cargo text, departamento text, perfil text, permissoes jsonb NOT NULL DEFAULT '{}'::jsonb, ativo boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now())`;
  await sql`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS perfil text`;
  await sql`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS permissoes jsonb NOT NULL DEFAULT '{}'::jsonb`;
  await sql`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS password_hash text NOT NULL DEFAULT ''`;
}

export async function GET(request: Request) {
  try {
    const companyId = new URL(request.url).searchParams.get('companyId');
    if (!companyId) return NextResponse.json({ error: 'companyId é obrigatório.' }, { status: 400 });
    const sql = await getTenantDb(companyId); await ensureTenantUsers(sql);
    return NextResponse.json(await sql`SELECT id,nome,email,cargo,departamento,perfil,permissoes,ativo,created_at FROM usuarios ORDER BY created_at DESC`);
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.companyId || !body.nome?.trim() || !body.email?.trim()) return NextResponse.json({ error: 'Empresa, nome e e-mail são obrigatórios.' }, { status: 400 });
    const sql = await getTenantDb(body.companyId); await ensureTenantUsers(sql);
    const rows = await sql`INSERT INTO usuarios (nome,email,cargo,departamento,perfil,permissoes,ativo) VALUES (${body.nome.trim()},${body.email.trim().toLowerCase()},${body.cargo||null},${body.departamento||null},${body.perfil||'Usuário'},${JSON.stringify(body.permissoes||{})}::jsonb,${body.ativo!==false}) RETURNING id,nome,email,cargo,departamento,perfil,permissoes,ativo,created_at`;
    return NextResponse.json(rows[0], { status: 201 });
  } catch (e: any) { return NextResponse.json({ error: String(e.message).toLowerCase().includes('unique') ? 'E-mail já cadastrado.' : e.message }, { status: 500 }); }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    if (!body.companyId || !body.id) return NextResponse.json({ error: 'Empresa e id são obrigatórios.' }, { status: 400 });
    const sql = await getTenantDb(body.companyId); await ensureTenantUsers(sql);
    const rows = await sql`UPDATE usuarios SET nome=COALESCE(${body.nome?.trim() || null},nome), email=COALESCE(${body.email?.trim().toLowerCase() || null},email), cargo=${body.cargo ?? null}, departamento=${body.departamento ?? null}, perfil=${body.perfil ?? 'Usuário'}, permissoes=${JSON.stringify(body.permissoes||{})}::jsonb, ativo=${body.ativo !== false}, updated_at=now() WHERE id=${body.id} RETURNING id,nome,email,cargo,departamento,perfil,permissoes,ativo,created_at`;
    if (!rows[0]) return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
    return NextResponse.json(rows[0]);
  } catch (e: any) { return NextResponse.json({ error: String(e.message).toLowerCase().includes('unique') ? 'E-mail já cadastrado.' : e.message }, { status: 500 }); }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url); const companyId=url.searchParams.get('companyId'); const id=url.searchParams.get('id');
    if (!companyId || !id) return NextResponse.json({ error: 'Empresa e id são obrigatórios.' }, { status: 400 });
    const sql=await getTenantDb(companyId); await ensureTenantUsers(sql);
    await sql`DELETE FROM usuarios WHERE id=${id}`;
    return NextResponse.json({ok:true});
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
