import { NextResponse } from 'next/server';
import { masterSql, ensureMasterSchema } from '@/lib/master-db';
import { tenantSql } from '@/lib/tenant-db';

async function db(companyId: string) {
  await ensureMasterSchema();
  const r = await masterSql`SELECT database_url FROM master_empresas WHERE id=${companyId} AND status='Ativa' LIMIT 1`;
  if (!r[0]?.database_url) throw new Error('Banco da empresa não configurado.');
  const sql = tenantSql(r[0].database_url);
  await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`;
  await sql`CREATE TABLE IF NOT EXISTS inventarios (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), codigo text NOT NULL, descricao text NOT NULL, armazem text NOT NULL, status text NOT NULL DEFAULT 'Em andamento', responsavel text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now())`;
  await sql`CREATE TABLE IF NOT EXISTS inventario_itens (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), inventario_id uuid NOT NULL REFERENCES inventarios(id) ON DELETE CASCADE, sku text NOT NULL, produto text NOT NULL, endereco text, sistema numeric NOT NULL DEFAULT 0, contagem numeric NOT NULL DEFAULT 0, status text NOT NULL DEFAULT 'Pendente', created_at timestamptz NOT NULL DEFAULT now())`;
  return sql;
}

export async function GET(req: Request) {
  try { const u=new URL(req.url); const companyId=u.searchParams.get('companyId'); if(!companyId)return NextResponse.json({error:'companyId é obrigatório.'},{status:400}); const sql=await db(companyId); let inv=(await sql`SELECT * FROM inventarios ORDER BY created_at DESC LIMIT 1`)[0]; if(!inv){ const r=await sql`INSERT INTO inventarios(codigo,descricao,armazem,status,responsavel) VALUES ('INV-001','Inventário Geral','Armazém Principal','Em andamento','') RETURNING *`; inv=r[0]; } const items=await sql`SELECT * FROM inventario_itens WHERE inventario_id=${inv.id} ORDER BY created_at`; return NextResponse.json({inventario:inv,itens:items}); } catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Erro ao carregar inventário.'},{status:500});}
}

export async function POST(req: Request) {
 try { const b=await req.json(); if(!b.companyId||!b.inventarioId||!b.sku||!b.produto)return NextResponse.json({error:'Empresa, inventário, SKU e produto são obrigatórios.'},{status:400}); const sql=await db(b.companyId); const sistema=Number(b.sistema||0),contagem=Number(b.contagem??0); const status=contagem===sistema?'Conferido':'Divergência'; const r=await sql`INSERT INTO inventario_itens(inventario_id,sku,produto,endereco,sistema,contagem,status) VALUES(${b.inventarioId},${b.sku},${b.produto},${b.endereco||null},${sistema},${contagem},${status}) RETURNING *`; return NextResponse.json(r[0],{status:201}); } catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Erro ao incluir item.'},{status:500});}
}

export async function PATCH(req: Request) {
 try { const b=await req.json(); if(!b.companyId||!b.id)return NextResponse.json({error:'Empresa e item são obrigatórios.'},{status:400}); const sql=await db(b.companyId); const fields={contagem:Number(b.contagem??0)}; const r=await sql`UPDATE inventario_itens SET contagem=${fields.contagem}, status=CASE WHEN contagem=${fields.contagem} THEN 'Conferido' ELSE 'Divergência' END WHERE id=${b.id} RETURNING *`; if(!r[0])return NextResponse.json({error:'Item não encontrado.'},{status:404}); return NextResponse.json(r[0]); } catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Erro ao atualizar item.'},{status:500});}
}

export async function DELETE(req: Request) {
 try { const u=new URL(req.url); const companyId=u.searchParams.get('companyId'),id=u.searchParams.get('id'); if(!companyId||!id)return NextResponse.json({error:'Empresa e id são obrigatórios.'},{status:400}); const sql=await db(companyId); await sql`DELETE FROM inventario_itens WHERE id=${id}`; return NextResponse.json({ok:true}); } catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Erro ao excluir item.'},{status:500});}
}
