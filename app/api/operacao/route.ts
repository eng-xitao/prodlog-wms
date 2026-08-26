import { NextResponse } from 'next/server';
import { masterSql, ensureMasterSchema } from '@/lib/master-db';
import { tenantSql } from '@/lib/tenant-db';

const allowed = new Set(['recebimento','estoque','enderecamento','movimentacoes','picking','expedicao','relatorios']);
async function db(companyId:string, modulo:string){
 if(!companyId || !allowed.has(modulo)) throw new Error('Empresa ou módulo inválido.');
 await ensureMasterSchema();
 const r=await masterSql`SELECT database_url FROM master_empresas WHERE id=${companyId} AND status='Ativa' LIMIT 1`;
 if(!r[0]?.database_url) throw new Error('Banco da empresa não configurado.');
 const sql=tenantSql(r[0].database_url);
 await sql`CREATE TABLE IF NOT EXISTS wms_operacoes (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), modulo text NOT NULL, codigo text NOT NULL, descricao text NOT NULL, status text NOT NULL DEFAULT 'Ativo', quantidade numeric NOT NULL DEFAULT 0, localizacao text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now())`;
 return sql;
}
export async function GET(req:Request){try{const u=new URL(req.url), companyId=u.searchParams.get('companyId')||'', modulo=u.searchParams.get('modulo')||'';const sql=await db(companyId,modulo);return NextResponse.json(await sql`SELECT * FROM wms_operacoes WHERE modulo=${modulo} ORDER BY created_at DESC`)}catch(e:any){return NextResponse.json({error:e.message},{status:400})}}
export async function POST(req:Request){try{const b=await req.json(),sql=await db(b.companyId,b.modulo);const codigo=b.codigo?.trim()||`${b.modulo.toUpperCase()}-${Date.now()}`;const r=await sql`INSERT INTO wms_operacoes(modulo,codigo,descricao,status,quantidade,localizacao) VALUES(${b.modulo},${codigo},${b.descricao?.trim()||'Novo registro'},${b.status||'Ativo'},${Number(b.quantidade)||0},${b.localizacao||null}) RETURNING *`;return NextResponse.json(r[0],{status:201})}catch(e:any){return NextResponse.json({error:e.message},{status:400})}}
export async function PATCH(req:Request){try{const b=await req.json(),sql=await db(b.companyId,b.modulo);const r=await sql`UPDATE wms_operacoes SET descricao=COALESCE(${b.descricao?.trim()||null},descricao),status=COALESCE(${b.status||null},status),quantidade=COALESCE(${Number.isFinite(Number(b.quantidade))?Number(b.quantidade):null},quantidade),localizacao=COALESCE(${b.localizacao||null},localizacao),updated_at=now() WHERE id=${b.id} AND modulo=${b.modulo} RETURNING *`;if(!r[0])return NextResponse.json({error:'Registro não encontrado.'},{status:404});return NextResponse.json(r[0])}catch(e:any){return NextResponse.json({error:e.message},{status:400})}}
export async function DELETE(req:Request){try{const u=new URL(req.url),sql=await db(u.searchParams.get('companyId')||'',u.searchParams.get('modulo')||'');const r=await sql`DELETE FROM wms_operacoes WHERE id=${u.searchParams.get('id')} AND modulo=${u.searchParams.get('modulo')} RETURNING id`;if(!r[0])return NextResponse.json({error:'Registro não encontrado.'},{status:404});return NextResponse.json({ok:true})}catch(e:any){return NextResponse.json({error:e.message},{status:400})}}
