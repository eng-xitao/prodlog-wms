import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/AuthContext";
import LoginPage from "./pages/LoginPage";
import PendingSubscriptionPage from "./pages/PendingSubscriptionPage";
import Layout from "./components/Layout";
import LocalizacoesPage from "./pages/LocalizacoesPage";
import EstoquePage from "./pages/EstoquePage";
import MovimentacoesPage from "./pages/MovimentacoesPage";
import ProdutosPage from "./pages/ProdutosPage";
import AlmoxarifadosPage from "./pages/AlmoxarifadosPage";
import FornecedoresPage from "./pages/FornecedoresPage";
import AssinaturaPage from "./pages/AssinaturaPage";
import RecebimentoPage from "./pages/RecebimentoPage";
import PickingPage from "./pages/PickingPage";
import ExpedicaoPage from "./pages/ExpedicaoPage";
import InventarioPage from "./pages/InventarioPage";
import FiscalPage from "./pages/FiscalPage";
import TransportadorasPage from "./pages/TransportadorasPage";

function PrivateArea() {
  const { session, loading, profileLoading, subscription } = useAuth();

  if (loading || profileLoading) {
    return <div style={{ padding: 40 }}>Carregando...</div>;
  }
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  const isActive = subscription?.subscription_status === "active";

  return (
    <Layout>
      <Routes>
        {isActive ? (
          <>
            <Route path="/" element={<Navigate to="/recebimento" replace />} />
            <Route path="/recebimento" element={<RecebimentoPage />} />
            <Route path="/localizacoes" element={<LocalizacoesPage />} />
            <Route path="/estoque" element={<EstoquePage />} />
            <Route path="/movimentacoes" element={<MovimentacoesPage />} />
            <Route path="/picking" element={<PickingPage />} />
            <Route path="/expedicao" element={<ExpedicaoPage />} />
            <Route path="/inventario" element={<InventarioPage />} />
            <Route path="/fiscal" element={<FiscalPage />} />
            <Route path="/produtos" element={<ProdutosPage />} />
            <Route path="/almoxarifados" element={<AlmoxarifadosPage />} />
            <Route path="/fornecedores" element={<FornecedoresPage />} />
            <Route path="/transportadoras" element={<TransportadorasPage />} />
            <Route path="/assinatura" element={<AssinaturaPage />} />
            <Route path="*" element={<Navigate to="/recebimento" replace />} />
          </>
        ) : (
          <>
            <Route path="/assinatura" element={<AssinaturaPage />} />
            <Route path="*" element={<PendingSubscriptionPage />} />
          </>
        )}
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
