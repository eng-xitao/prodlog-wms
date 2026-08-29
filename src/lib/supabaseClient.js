import { createClient } from "@supabase/supabase-js";

// Mesmo banco do ProdOS — ProdLog é outro produto na mesma plataforma,
// mesma empresa, mesmo login, dados de estoque compartilhados.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Nunca guarda a sessão entre acessos — toda vez que a pessoa
    // abrir o sistema (aba nova, F5, ou depois de sair), precisa
    // digitar e-mail e senha de novo. Decisão de segurança.
    persistSession: false,
  },
});
