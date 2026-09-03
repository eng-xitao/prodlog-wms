import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";

const NAV_GROUPS = [
  { label: "Visão geral", icon: "▦", items: [["/", "Dashboard", "▦"]] },
  { label: "Operação", icon: "◆", items: [["/recebimento", "Recebimento", "◆"], ["/picking", "Picking / Separação", "☑"], ["/expedicao", "Expedição", "▶"], ["/inventario", "Inventário", "◎"]] },
  { label: "Estoque", icon: "▥", items: [["/estoque", "Níveis de Estoque", "▤"], ["/localizacoes", "Endereçamento", "▦"], ["/movimentacoes", "Movimentações", "⇄"]] },
  { label: "Transporte", icon: "🚛", items: [["/tabela-frete", "Tabela de Frete", "💰"], ["/transportadoras", "Transportadoras", "🚚"], ["/veiculos", "Veículos", "🚛"], ["/motoristas", "Motoristas", "👤"]] },
  { label: "Documentos Fiscais", icon: "🧾", items: [["/fiscal", "NF-e / Fiscal", "🧾"], ["/cte", "CT-e", "📄"], ["/mdfe", "MDF-e / Manifestos", "📋"]] },
  { label: "Cadastros", icon: "▣", items: [["/produtos", "Produtos", "◆"], ["/almoxarifados", "Almoxarifados", "▥"], ["/fornecedores", "Fornecedores", "◐"]] },
  { label: "Conta", icon: "◈", items: [["/assinatura", "Assinatura", "◈"]] },
];

export default function Layout({ children }) {
  const { profile, signOut, impersonation, stopImpersonating } = useAuth();
  const navigate = useNavigate(); const location = useLocation();
  const [collapsed, setCollapsed] = useState(false); const [mobileOpen, setMobileOpen] = useState(false); const [isMobile, setIsMobile] = useState(false); const [openGroup, setOpenGroup] = useState("Visão geral");
  useEffect(() => { const g= NAV_GROUPS.find(x=>x.items.some(([to])=>location.pathname===to)); if(g)setOpenGroup(g.label); }, [location.pathname]);
  useEffect(() => { const f=()=>{const m=window.innerWidth<=820;setIsMobile(m);setCollapsed(window.innerWidth<=1180);if(!m)setMobileOpen(false)};f();window.addEventListener("resize",f);return()=>window.removeEventListener("resize",f)},[]);
  useEffect(()=>{document.body.classList.toggle("pl-nav-open",mobileOpen);return()=>document.body.classList.remove("pl-nav-open")},[mobileOpen]);
  async function handleSignOut(){await signOut();navigate("/login")}; function toggleMenu(){isMobile?setMobileOpen(v=>!v):setCollapsed(v=>!v)}
  return <div className={`pl-shell ${collapsed?"pl-collapsed":""} ${mobileOpen?"pl-mobile-open":""}`}>
    <div className="pl-mobilebar"><button className="pl-menu-button no-print" onClick={toggleMenu} type="button">☰</button><img src="/prodlog-logo.svg" alt="ProdLog"/></div><div className="pl-mobile-backdrop" onClick={()=>setMobileOpen(false)} aria-hidden="true"/>
    <aside className="pl-sidebar"><div className="pl-brand-row"><img className="pl-logo" src="/prodlog-logo.svg" alt="ProdLog"/><button className="pl-collapse-button no-print" onClick={toggleMenu} type="button">{collapsed?"»":"«"}</button></div><nav className="pl-nav">{NAV_GROUPS.map(g=>{const active=g.items.some(([to])=>location.pathname===to);const open=openGroup===g.label;return <div className="pl-nav-group" key={g.label}><button className={`pl-nav-group-title ${active?"active":""}`} type="button" title={collapsed?g.label:undefined} onClick={()=>setOpenGroup(open?"":g.label)}><span className="pl-nav-icon">{g.icon}</span><span className="pl-nav-label">{g.label}</span>{!collapsed&&<span className="pl-nav-chevron">{open?"⌄":"›"}</span>}</button>{open&&<div className="pl-nav-submenu">{g.items.map(([to,label,icon])=><NavLink key={to} to={to} title={collapsed?label:undefined} className={({isActive})=>`pl-nav-item pl-nav-subitem ${isActive?"active":""}`} onClick={()=>isMobile&&setMobileOpen(false)}><span className="pl-nav-icon">{icon}</span><span className="pl-nav-label">{label}</span></NavLink>)}</div>}</div>})}</nav><div className="pl-user"><div className="pl-user-name" title={profile?.full_name??profile?.email}>{profile?.full_name??profile?.email}</div><button className="pl-signout no-print" onClick={handleSignOut} type="button">Sair</button></div></aside>
    <main className="pl-main"><div className="print-header" style={{display:"none"}}><img src="/prodlog-logo.svg" alt="ProdLog"/><div><strong>ProdLog WMS</strong><span>Documento operacional</span></div><time>{new Date().toLocaleDateString("pt-BR")}</time></div>{impersonation&&<div className="pl-impersonation no-print"><span>👁 Você está vendo como <strong>{impersonation.companies?.name??"essa empresa"}</strong> — modo suporte.</span><button onClick={stopImpersonating} type="button">Sair desse modo</button></div>}{children}</main>
  </div>;
}
