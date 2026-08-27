import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/AuthContext";
import LoginPage from "./pages/LoginPage";
import PendingSubscriptionPage from "./pages/PendingSubscriptionPage";
import Layout from "./components/Layout";
import LocalizacoesPage from "./pages/LocalizacoesPage";
import EstoquePage from "./pages/EstoquePage";
import MovimentacoesPage from "./pages/MovimentacoesPage";

function PrivateArea() {
  const { session, loading, profileLoading, subscription } = useAuth();

  if (loading || profileLoading) {
    return <div style={{ padding: 40 }}>Carregando...</div>;
  }
  if (!session) {
    return <Navigate to="/login" replace />;
  }
  if (subscription?.subscription_status !== "active") {
    return <PendingSubscriptionPage />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/estoque" replace />} />
        <Route path="/localizacoes" element={<LocalizacoesPage />} />
        <Route path="/estoque" element={<EstoquePage />} />
        <Route path="/movimentacoes" element={<MovimentacoesPage />} />
        <Route path="*" element={<Navigate to="/estoque" replace />} />
      </Routes>
    </Layout>
  );
}

function AppRoutes() {
  const { session, loading } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={!loading && session ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/*" element={<PrivateArea />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
