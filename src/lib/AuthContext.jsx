import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [company, setCompany] = useState(null);
  const [subscription, setSubscription] = useState(null); // assinatura do ProdLog especificamente
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);

  async function loadAll(userId) {
    const { data: profileData } = await supabase.from("profiles").select("*").eq("id", userId).single();
    setProfile(profileData ?? null);

    if (profileData?.company_id) {
      const { data: companyData } = await supabase.from("companies").select("*").eq("id", profileData.company_id).single();
      setCompany(companyData ?? null);

      const { data: subData } = await supabase
        .from("company_products")
        .select("*, plans:plan_id (name, price, features, included_users, extra_user_price)")
        .eq("company_id", profileData.company_id)
        .eq("product_key", "prodlog")
        .maybeSingle();
      setSubscription(subData ?? null);
    } else {
      setCompany(null);
      setSubscription(null);
    }
  }

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session?.user) {
        setProfileLoading(true);
        await loadAll(session.user.id);
        setProfileLoading(false);
      } else {
        setProfile(null);
        setCompany(null);
        setSubscription(null);
        setProfileLoading(false);
      }
      setLoading(false);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function signIn({ email, password }) {
    return supabase.auth.signInWithPassword({ email, password });
  }
  async function signOut() {
    await supabase.auth.signOut();
  }
  async function refreshCompany() {
    if (profile?.id) await loadAll(profile.id);
  }

  return (
    <AuthContext.Provider value={{ session, profile, company, subscription, loading, profileLoading, signIn, signOut, refreshCompany }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
