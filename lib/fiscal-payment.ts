const ASAAS_BASE_URL = process.env.ASAAS_BASE_URL || 'https://api.asaas.com';
const FOCUS_NFE_BASE_URL = process.env.FOCUS_NFE_BASE_URL || 'https://api.focusnfe.com.br';

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} não configurada.`);
  return value;
}

export async function asaasRequest(path: string, init: RequestInit = {}) {
  const apiKey = requireEnv('ASAAS_API_KEY');
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  headers.set('Accept', 'application/json');
  headers.set('access_token', apiKey);
  const response = await fetch(`${ASAAS_BASE_URL}${path}`, { ...init, headers, cache: 'no-store' });
  const text = await response.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
  if (!response.ok) throw new Error(data?.errors?.map((e: any) => e.description).join('; ') || data?.message || `Asaas HTTP ${response.status}`);
  return data;
}

export async function focusNfeRequest(path: string, init: RequestInit = {}) {
  const token = requireEnv('FOCUS_NFE_TOKEN');
  const basic = Buffer.from(`${token}:`).toString('base64');
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  headers.set('Accept', 'application/json');
  headers.set('Authorization', `Basic ${basic}`);
  const response = await fetch(`${FOCUS_NFE_BASE_URL}${path}`, { ...init, headers, cache: 'no-store' });
  const text = await response.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
  if (!response.ok) throw new Error(data?.mensagem || data?.message || `Focus NFe HTTP ${response.status}`);
  return data;
}

export function isProductionIntegrationConfigured() {
  return {
    asaas: Boolean(process.env.ASAAS_API_KEY),
    focusNfe: Boolean(process.env.FOCUS_NFE_TOKEN),
  };
}
