import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// GET: Lista todos os itens do estoque
export async function GET() {
  try {
    const data = await sql`SELECT * FROM wms_estoque_armazem ORDER BY created_at DESC;`;
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Insere um novo item no estoque
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sku, descricao, categoria, quantidade, unidade, posicao, status } = body;

    const result = await sql`
      INSERT INTO wms_estoque_armazem (sku, descricao, categoria, quantidade, unidade, posicao, status)
      VALUES (${sku}, ${descricao}, ${categoria || 'Geral'}, ${quantidade}, ${unidade || 'un'}, ${posicao || 'Doca Entrada'}, ${status})
      RETURNING *;
    `;

    return NextResponse.json(result[0]);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}