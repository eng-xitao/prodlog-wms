import { NextResponse } from 'next/server';
import { isProductionIntegrationConfigured } from '@/lib/fiscal-payment';

export async function GET() {
  return NextResponse.json({ environment: 'production', ...isProductionIntegrationConfigured() });
}
