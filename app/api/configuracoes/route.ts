import { NextResponse } from 'next/server';
import { masterSql, ensureMasterSchema } from '@/lib/master-db';
import { tenantSql } from '@/lib/tenant-db';

async function db(companyId:string){
  if(!companyId) throw new Error('companyId é obrigatório.');
  await ensureMasterSchema();
  const r=await masterSql`SELECT database_url FROM master_empresas WHERE id=${companyId} AND status='Ativa' LIMIT 1`;
  if(!r[0]?.database_url) throw new Error('Banco da empresa não configurado.');
  const sql=tenantSql(r[0].database_url);
  await sql`CREATE TABLE IF NOT EXISTS configuracoes (chave text PRIMARY KEY, valor text NOT NULL DEFAULT '', updated_at timestamptz NOT NULL DEFAULT now())`;
  return sql;
}
export async function GET(req:Request){try{const companyId=new URL(req.url).searchParams.get('companyId')||'';const sql=await db(companyId);return NextResponse.json(await sql`SELECT chave,valor,updated_at FROM configuracoes ORDER BY chave`)}catch(e:unknown){return NextResponse.json({error:e instanceof Error?e.message:'Erro ao consultar configurações.'},{status:500})}}
export async function PUT(req:Request){try{const b=await req.json();const sql=await db(b.companyId);if(!b.chave)return NextResponse.json({error:'Chave obrigatória.'},{status:400});const r=await sql`INSERT INTO configuracoes(chave,valor,updated_at) VALUES(${b.chave},${String(b.valor??'')},now()) ON CONFLICT(chave) DO UPDATE SET valor=EXCLUDED.valor,updated_at=now() RETURNING *`;return NextResponse.json(r[0])}catch(e:unknown){return NextResponse.json({error:e instanceof Error?e.message:'Erro ao salvar configuração.'},{status:500})}}
export async function DELETE(req:Request){try{const u=new URL(req.url),companyId=u.searchParams.get('companyId')||'',chave=u.searchParams.get('chave');if(!chave)return NextResponse.json({error:'Chave obrigatória.'},{status:400});const sql=await db(companyId);await sql`DELETE FROM configuracoes WHERE chave=${chave}`;return NextResponse.json({ok:true})}catch(e:unknown){return NextResponse.json({error:e instanceof Error?e.message:'Erro ao excluir configuração.'},{status:500})}}
