import { NextResponse } from 'next/server';
import { masterSql, ensureMasterSchema } from '@/lib/master-db';
import { tenantSql } from '@/lib/tenant-db';

async function db(companyId:string){
 await ensureMasterSchema();
 const r=await masterSql`SELECT database_url FROM master_empresas WHERE id=${companyId} AND status='Ativa' LIMIT 1`;
 if(!r[0]?.database_url) throw new Error('Banco da empresa não configurado.');
 const sql=tenantSql(r[0].database_url);
 await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`;
 await sql`CREATE TABLE IF NOT EXISTS produtos (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), sku text UNIQUE NOT NULL, descricao text NOT NULL, categoria text, unidade text NOT NULL DEFAULT 'un', lote_controlado boolean NOT NULL DEFAULT false, validade_controlada boolean NOT NULL DEFAULT false, ativo boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now())`;
 return sql;
}
export async function GET(request:Request){try{const companyId=new URL(request.url).searchParams.get('companyId');if(!companyId)return NextResponse.json({error:'companyId é obrigatório.'},{status:400});const sql=await db(companyId);return NextResponse.json(await sql`SELECT * FROM produtos ORDER BY created_at DESC`)}catch(e:any){return NextResponse.json({error:e.message},{status:500})}}
export async function POST(request:Request){try{const b=await request.json();if(!b.companyId||!b.sku?.trim()||!b.descricao?.trim())return NextResponse.json({error:'Empresa, SKU e descrição são obrigatórios.'},{status:400});const sql=await db(b.companyId);const r=await sql`INSERT INTO produtos(sku,descricao,categoria,unidade,lote_controlado,validade_controlada,ativo) VALUES(${b.sku.trim()},${b.descricao.trim()},${b.categoria||null},${b.unidade||'un'},${b.lote_controlado===true},${b.validade_controlada===true},${b.ativo!==false}) RETURNING *`;return NextResponse.json(r[0],{status:201})}catch(e:any){return NextResponse.json({error:String(e.message).toLowerCase().includes('unique')?'SKU já cadastrado.':e.message},{status:500})}}
export async function PATCH(request:Request){try{const b=await request.json();if(!b.companyId||!b.id)return NextResponse.json({error:'Empresa e id são obrigatórios.'},{status:400});const sql=await db(b.companyId);const r=await sql`UPDATE produtos SET sku=COALESCE(${b.sku?.trim()||null},sku),descricao=COALESCE(${b.descricao?.trim()||null},descricao),categoria=${b.categoria??null},unidade=${b.unidade||'un'},lote_controlado=${b.lote_controlado===true},validade_controlada=${b.validade_controlada===true},ativo=${b.ativo!==false} WHERE id=${b.id} RETURNING *`;if(!r[0])return NextResponse.json({error:'Produto não encontrado.'},{status:404});return NextResponse.json(r[0])}catch(e:any){return NextResponse.json({error:e.message},{status:500})}}
export async function DELETE(request:Request){try{const u=new URL(request.url);const companyId=u.searchParams.get('companyId'),id=u.searchParams.get('id');if(!companyId||!id)return NextResponse.json({error:'Empresa e id são obrigatórios.'},{status:400});const sql=await db(companyId);await sql`DELETE FROM produtos WHERE id=${id}`;return NextResponse.json({ok:true})}catch(e:any){return NextResponse.json({error:e.message},{status:500})}}
