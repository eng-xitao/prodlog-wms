import { useState } from "react";
import { useAuth } from "../lib/AuthContext";

export default function LoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault(); setError(""); setLoading(true);
    const { error } = await signIn({ email, password });
    if (error) setError("E-mail ou senha incorretos.");
    setLoading(false);
  }

  return (
    <div className="pl-login-shell">
      <div className="pl-login-card">
        <img className="pl-login-logo" src="/prodlog-logo.svg" alt="ProdLog" />
        <div className="pl-login-system">WMS • Gestão de armazém e estoque</div>
        <div className="pl-login-divider" />
        <form onSubmit={handleSubmit} className="pl-login-form">
          <label><span>E-mail</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required /></label>
          <label><span>Senha</span><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required /></label>
          {error && <div className="pl-login-error">{error}</div>}
          <button type="submit" disabled={loading}>{loading ? "Aguarde..." : "Entrar"}</button>
        </form>
        <p className="pl-login-hint">Acesso integrado à plataforma ProdOS.</p>
      </div>
    </div>
  );
}
