import { NextResponse } from 'next/server';
import { ensureMasterSchema, masterSql } from '@/lib/master-db';

export async function GET() {
  try {
    await ensureMasterSchema();
    const rows = await masterSql`SELECT id, razao_social, nome_fantasia, cnpj, plano, status, logo_url, created_at FROM master_empresas ORDER BY created_at DESC`;
    return NextResponse.json(rows);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureMasterSchema();
    const body = await request.json();
    if (!body.razao_social?.trim() || !body.cnpj?.trim()) {
      return NextResponse.json({ error: 'Razão social e CNPJ são obrigatórios.' }, { status: 400 });
    }
    const rows = await masterSql`
      INSERT INTO master_empresas (razao_social, nome_fantasia, cnpj, plano, status, database_url, logo_url)
      VALUES (${body.razao_social.trim()}, ${body.nome_fantasia || null}, ${body.cnpj.trim()}, ${body.plano || 'Básico'}, ${body.status || 'Ativa'}, ${body.database_url || null}, ${body.logo_url || null})
      RETURNING id, razao_social, nome_fantasia, cnpj, plano, status, logo_url, created_at
    `;
    return NextResponse.json(rows[0], { status: 201 });
  } catch (e: any) {
    if (String(e.message).toLowerCase().includes('unique')) return NextResponse.json({ error: 'CNPJ já cadastrado.' }, { status: 409 });
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
