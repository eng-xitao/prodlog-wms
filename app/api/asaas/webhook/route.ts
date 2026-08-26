import { NextResponse } from 'next/server';

function validWebhook(request: Request) {
  const configured = process.env.ASAAS_WEBHOOK_TOKEN;
  if (!configured) return false;
  return request.headers.get('asaas-access-token') === configured;
}

export async function POST(request: Request) {
  if (!validWebhook(request)) return NextResponse.json({ error: 'Webhook não autorizado.' }, { status: 401 });
  try {
    const event = await request.json();
    console.log('Asaas webhook recebido:', event.event, event.payment?.id, event.subscription?.id);
    // O evento é recebido com segurança. A atualização de status da empresa deve ser feita
    // usando event.payment.subscription/event.subscription e o externalReference da assinatura.
    return NextResponse.json({ received: true });
  } catch { return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 }); }
}
