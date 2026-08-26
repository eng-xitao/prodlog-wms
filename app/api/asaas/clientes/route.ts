import { NextResponse } from 'next/server';
import { asaasRequest } from '@/lib/fiscal-payment';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.name || !body.cpfCnpj) return NextResponse.json({ error: 'Nome e CPF/CNPJ são obrigatórios.' }, { status: 400 });
    const customer = await asaasRequest('/v3/customers', { method: 'POST', body: JSON.stringify({ name: body.name, cpfCnpj: body.cpfCnpj, email: body.email || undefined, phone: body.phone || undefined, mobilePhone: body.mobilePhone || undefined, externalReference: body.externalReference || undefined }) });
    return NextResponse.json(customer, { status: 201 });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 502 }); }
}
