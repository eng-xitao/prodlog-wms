import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";

const NAV = [
  { to: "/recebimento", label: "Recebimento", icon: "◆" },
  { to: "/estoque", label: "Níveis de Estoque", icon: "▤" },
  { to: "/localizacoes", label: "Endereçamento", icon: "▦" },
  { to: "/movimentacoes", label: "Movimentações", icon: "⇄" },
  { to: "/picking", label: "Picking", icon: "☑" },
  { to: "/expedicao", label: "Expedição", icon: "▶" },
  { to: "/inventario", label: "Inventário", icon: "◎" },
  { to: "/fiscal", label: "Fiscal / NF-e", icon: "🧾" },
  { to: "/produtos", label: "Produtos", icon: "◆" },
  { to: "/almoxarifados", label: "Almoxarifados", icon: "▥" },
  { to: "/fornecedores", label: "Fornecedores", icon: "◐" },
  { to: "/transportadoras", label: "Transportadoras", icon: "🚚" },
  { to: "/veiculos", label: "Veículos", icon: "🚛" },
  { to: "/motoristas", label: "Motoristas", icon: "👤" },
  { to: "/assinatura", label: "Assinatura", icon: "◈" },
];

export default function Layout({ children }) {
  const { profile, signOut, impersonation, stopImpersonating } = useAuth();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate("/login");
  }

  return (
    <div style={styles.wrap}>
      <aside style={styles.sidebar}>
        <div style={styles.brand}>
          Prod<span style={{ color: "var(--amber)" }}>Log</span>
        </div>
        <nav style={styles.nav}>
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({ ...styles.navItem, ...(isActive ? styles.navItemActive : {}) })}
            >
              <span>{item.icon}</span> {item.label}
            </NavLink>
          ))}
        </nav>
        <div style={styles.footer}>
          <div style={styles.userName}>{profile?.full_name ?? profile?.email}</div>
          <button style={styles.signOutBtn} onClick={handleSignOut} type="button">Sair</button>
        </div>
      </aside>
      <main style={styles.main}>
        {impersonation && (
          <div style={styles.impersonationBanner}>
            <span>👁 Você está vendo como <strong>{impersonation.companies?.name ?? "essa empresa"}</strong> — modo suporte.</span>
            <button style={styles.impersonationBtn} onClick={stopImpersonating} type="button">Sair desse modo</button>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}

const styles = {
  impersonationBanner: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    background: "var(--amber)", color: "#FFFFFF", padding: "10px 20px",
    fontSize: 13, fontWeight: 600, marginBottom: 16, borderRadius: "var(--radius)",
  },
  impersonationBtn: {
    background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.4)", color: "#FFFFFF",
    borderRadius: "var(--radius)", padding: "6px 14px", fontSize: 12.5, fontWeight: 700, cursor: "pointer",
  },
  wrap: { display: "flex", minHeight: "100vh", background: "var(--bg)" },
  sidebar: {
    width: 220, background: "var(--panel)", borderRight: "1px solid var(--line)",
    display: "flex", flexDirection: "column", padding: "20px 14px", flexShrink: 0,
  },
  brand: { fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 800, padding: "0 8px 20px" },
  nav: { display: "flex", flexDirection: "column", gap: 2, flex: 1 },
  navItem: {
    display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: "var(--radius)",
    color: "var(--text-dim)", fontSize: 13.5, fontWeight: 600, textDecoration: "none",
  },
  navItemActive: { background: "var(--panel-2)", color: "var(--text)" },
  footer: { borderTop: "1px solid var(--line)", paddingTop: 14, marginTop: 14 },
  userName: { fontSize: 12.5, color: "var(--text-dim)", marginBottom: 8, padding: "0 8px" },
  signOutBtn: {
    width: "100%", background: "transparent", border: "1px solid var(--line)", borderRadius: "var(--radius)",
    padding: "8px 0", color: "var(--text-dim)", fontSize: 12.5, fontWeight: 600, cursor: "pointer",
  },
  main: { flex: 1, padding: 28, overflowY: "auto" },
};
