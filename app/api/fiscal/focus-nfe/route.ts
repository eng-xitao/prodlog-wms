import { NextResponse } from 'next/server';
import { focusNfeRequest } from '@/lib/fiscal-payment';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const document = body.document || 'nfe';
    const ref = body.ref;
    if (!ref) return NextResponse.json({ error: 'ref é obrigatório para a emissão fiscal.' }, { status: 400 });
    if (!['nfe', 'nfce', 'nfse'].includes(document)) return NextResponse.json({ error: 'Documento fiscal não suportado.' }, { status: 400 });
    const payload = { ...body };
    delete payload.document;
    delete payload.ref;
    const result = await focusNfeRequest(`/v2/${document}?ref=${encodeURIComponent(ref)}`, { method: 'POST', body: JSON.stringify(payload) });
    return NextResponse.json(result, { status: 200 });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 502 }); }
}
