import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";

const NAV = [
  ["/recebimento", "Recebimento", "◆"], ["/estoque", "Níveis de Estoque", "▤"], ["/localizacoes", "Endereçamento", "▦"],
  ["/movimentacoes", "Movimentações", "⇄"], ["/picking", "Picking", "☑"], ["/expedicao", "Expedição", "▶"],
  ["/mdfe", "MDF-e (Manifesto)", "📋"], ["/inventario", "Inventário", "◎"], ["/fiscal", "Fiscal / NF-e", "🧾"],
  ["/cte", "CT-e", "📄"], ["/tabela-frete", "Tabela de Frete", "💰"], ["/produtos", "Produtos", "◆"],
  ["/almoxarifados", "Almoxarifados", "▥"], ["/fornecedores", "Fornecedores", "◐"], ["/transportadoras", "Transportadoras", "🚚"],
  ["/veiculos", "Veículos", "🚛"], ["/motoristas", "Motoristas", "👤"], ["/assinatura", "Assinatura", "◈"],
];

export default function Layout({ children }) {
  const { profile, signOut, impersonation, stopImpersonating } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const updateViewport = () => {
      const mobile = window.innerWidth <= 820;
      setIsMobile(mobile);
      setCollapsed(window.innerWidth <= 1180);
      if (!mobile) setMobileOpen(false);
    };
    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("pl-nav-open", mobileOpen);
    return () => document.body.classList.remove("pl-nav-open");
  }, [mobileOpen]);

  async function handleSignOut() { await signOut(); navigate("/login"); }
  function toggleMenu() { isMobile ? setMobileOpen(v => !v) : setCollapsed(v => !v); }

  return (
    <div className={`pl-shell ${collapsed ? "pl-collapsed" : ""} ${mobileOpen ? "pl-mobile-open" : ""}`}>
      <div className="pl-mobilebar">
        <button className="pl-menu-button no-print" onClick={toggleMenu} type="button" aria-label="Abrir menu">☰</button>
        <img src="/prodlog-logo.svg" alt="ProdLog" />
      </div>
      <div className="pl-mobile-backdrop" onClick={() => setMobileOpen(false)} aria-hidden="true" />

      <aside className="pl-sidebar">
        <div className="pl-brand-row">
          <img className="pl-logo" src="/prodlog-logo.svg" alt="ProdLog" />
          <button className="pl-collapse-button no-print" onClick={toggleMenu} type="button" aria-label={collapsed ? "Expandir menu" : "Recolher menu"}>{collapsed ? "»" : "«"}</button>
        </div>
        <nav className="pl-nav">
          {NAV.map(([to, label, icon]) => (
            <NavLink key={to} to={to} title={collapsed ? label : undefined} className={({ isActive }) => `pl-nav-item ${isActive ? "active" : ""}`} onClick={() => isMobile && setMobileOpen(false)}>
              <span className="pl-nav-icon">{icon}</span><span className="pl-nav-label">{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="pl-user">
          <div className="pl-user-name" title={profile?.full_name ?? profile?.email}>{profile?.full_name ?? profile?.email}</div>
          <button className="pl-signout no-print" onClick={handleSignOut} type="button">Sair</button>
        </div>
      </aside>

      <main className="pl-main">
        <div className="print-header">
          <img src="/prodlog-logo.svg" alt="ProdLog" />
          <div><strong>ProdLog WMS</strong><span>Documento operacional</span></div>
          <time>{new Date().toLocaleDateString("pt-BR")}</time>
        </div>
        {impersonation && <div className="pl-impersonation no-print"><span>👁 Você está vendo como <strong>{impersonation.companies?.name ?? "essa empresa"}</strong> — modo suporte.</span><button onClick={stopImpersonating} type="button">Sair desse modo</button></div>}
        {children}
      </main>
    </div>
  );
}
