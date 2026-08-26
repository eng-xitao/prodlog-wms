import { NextResponse } from 'next/server';
import { asaasRequest } from '@/lib/fiscal-payment';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.customer || !body.value || !body.nextDueDate) return NextResponse.json({ error: 'Cliente, valor e próximo vencimento são obrigatórios.' }, { status: 400 });
    const subscription = await asaasRequest('/v3/subscriptions', { method: 'POST', body: JSON.stringify({ customer: body.customer, billingType: body.billingType || 'PIX', value: Number(body.value), nextDueDate: body.nextDueDate, cycle: body.cycle || 'MONTHLY', description: body.description || 'Assinatura ProdLog', externalReference: body.externalReference || undefined }) });
    return NextResponse.json(subscription, { status: 201 });
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 502 }); }
}

export async function GET(request: Request) {
  try {
    const customer = new URL(request.url).searchParams.get('customer');
    const query = customer ? `?customer=${encodeURIComponent(customer)}` : '';
    return NextResponse.json(await asaasRequest(`/v3/subscriptions${query}`));
  } catch (e: any) { return NextResponse.json({ error: e.message }, { status: 502 }); }
}
