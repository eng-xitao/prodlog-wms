import { useState } from "react";
import { useAuth } from "../lib/AuthContext";

export default function LoginPage(){
  const {signIn}=useAuth();
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [show,setShow]=useState(false);
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(false);

  async function handleSubmit(e){
    e.preventDefault();
    setError("");
    setLoading(true);
    const {error}=await signIn({email,password});
    if(error)setError("E-mail ou senha incorretos.");
    setLoading(false);
  }

  return (
    <div className="pl-login-shell">
      <form onSubmit={handleSubmit} className="pl-login-card">
        <img className="pl-login-logo" src="/prodlog-logo.svg" alt="ProdLog" />
        <div className="pl-login-badge">ACESSO AO SISTEMA</div>
        <h1 className="pl-login-title">Entrar</h1>
        <p className="pl-login-text">Informe seus dados de acesso para continuar.</p>

        <label className="pl-login-field">
          <span>Usuário</span>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="username" placeholder="seu@empresa.com.br" required />
        </label>

        <label className="pl-login-field">
          <span>Senha</span>
          <div className="pl-login-password">
            <input type={show?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password" placeholder="Sua senha" required />
            <button type="button" onClick={()=>setShow(v=>!v)}>{show?"Ocultar":"Visualizar"}</button>
          </div>
        </label>

        {error&&<div className="pl-login-error" role="alert">{error}</div>}
        <button className="pl-login-submit" type="submit" disabled={loading}>{loading?"Entrando...":"Entrar"}</button>
      </form>
    </div>
  );
}
