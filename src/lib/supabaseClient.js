import { createClient } from "@supabase/supabase-js";

// Mesmo banco do ProdOS — ProdLog é outro produto na mesma plataforma,
// mesma empresa, mesmo login, dados de estoque compartilhados.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
