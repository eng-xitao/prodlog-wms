import { useAuth } from "../lib/AuthContext";

export default function PendingSubscriptionPage() {
  const { company, signOut } = useAuth();

  return (
    <div style={styles.wrap}>
      <div style={styles.panel}>
        <h1 style={styles.title}>
          Prod<span style={{ color: "var(--amber)" }}>Log</span>
        </h1>
        <p style={styles.text}>
          A empresa <strong>{company?.name}</strong> ainda não tem uma assinatura ativa do ProdLog.
        </p>
        <p style={styles.text}>
          Fale com o suporte do ProdOS pra contratar o ProdLog — como você já usa a mesma
          plataforma, a liberação é rápida.
        </p>
        <button style={styles.btn} onClick={signOut} type="button">Sair</button>
      </div>
    </div>
  );
}

const styles = {
  wrap: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: 20 },
  panel: { background: "var(--panel)", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: "40px 36px", maxWidth: 440, width: "100%" },
  title: { fontFamily: "var(--font-display)", fontSize: 26, margin: "0 0 16px", fontWeight: 800 },
  text: { color: "var(--text-dim)", fontSize: 14, lineHeight: 1.6, marginBottom: 14 },
  btn: {
    marginTop: 10, background: "transparent", border: "1px solid var(--line)", borderRadius: "var(--radius)",
    padding: "10px 20px", color: "var(--text)", fontSize: 13, fontWeight: 600, cursor: "pointer",
  },
};
