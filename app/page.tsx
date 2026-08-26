'use client';

import { useState, useEffect } from 'react';

interface ItemArmazem {
  id: string;
  sku: string;
  descricao: string;
  categoria: string;
  quantidade: number;
  unidade: string;
  posicao: string;
  status: string;
}

export default function WmsDashboard() {
  const [abaAtiva, setAbaAtiva] = useState<'dashboard' | 'entradas' | 'saidas' | 'posicoes'>('dashboard');
  const [itens, setItens] = useState<ItemArmazem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [novoItem, setNovoItem] = useState({ sku: '', descricao: '', categoria: '', quantidade: 0, unidade: 'un', posicao: '' });

  const carregarItens = async () => {
    setCarregando(true);
    try {
      const res = await fetch('/api/estoque');
      const data = await res.json();
      if (Array.isArray(data)) setItens(data);
    } catch (err) {
      console.error('Erro ao carregar itens:', err);
    }
    setCarregando(false);
  };

  useEffect(() => {
    carregarItens();
  }, []);

  const adicionarItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoItem.descricao || !novoItem.sku) return;

    const qtd = Number(novoItem.quantidade);
    const statusCalculado = qtd === 0 ? 'Bloqueado' : qtd < 20 ? 'Estoque Crítico' : 'Disponível';

    try {
      const res = await fetch('/api/estoque', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...novoItem, quantidade: qtd, status: statusCalculado })
      });

      if (res.ok) {
        setNovoItem({ sku: '', descricao: '', categoria: '', quantidade: 0, unidade: 'un', posicao: '' });
        setModalAberto(false);
        carregarItens();
      }
    } catch (err) {
      alert('Erro na requisição.');
    }
  };

  const itensFiltrados = itens.filter(i =>
    i.descricao?.toLowerCase().includes(busca.toLowerCase()) ||
    i.sku?.toLowerCase().includes(busca.toLowerCase()) ||
    i.posicao?.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-100 flex text-gray-900 font-sans">
      {/* Menu Lateral / Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-md">
            W
          </div>
          <div>
            <h1 className="text-base font-bold text-white leading-tight">ProdLog WMS</h1>
            <p className="text-xs text-slate-400">Sistemas de Produção</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <button
            onClick={() => setAbaAtiva('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              abaAtiva === 'dashboard' ? 'bg-blue-600 text-white shadow-sm' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            📊 Visão Geral / Estoque
          </button>
          <button
            onClick={() => setAbaAtiva('entradas')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              abaAtiva === 'entradas' ? 'bg-blue-600 text-white shadow-sm' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            📥 Recebimento (Entradas)
          </button>
          <button
            onClick={() => setAbaAtiva('saidas')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              abaAtiva === 'saidas' ? 'bg-blue-600 text-white shadow-sm' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            📤 Expedição (Saídas)
          </button>
          <button
            onClick={() => setAbaAtiva('posicoes')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              abaAtiva === 'posicoes' ? 'bg-blue-600 text-white shadow-sm' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            📍 Endereçamento / Racks
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="bg-slate-800 p-3 rounded-lg text-xs text-slate-400">
            <span className="block font-semibold text-slate-200">ProdOS Cloud</span>
            <span>Servidor: Neon PostgreSQL</span>
          </div>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800 capitalize">
            {abaAtiva === 'dashboard' && 'Estoque Físico & Indicadores'}
            {abaAtiva === 'entradas' && 'Recebimento de Notas & Insumos'}
            {abaAtiva === 'saidas' && 'Expedição & Baixa de Materiais'}
            {abaAtiva === 'posicoes' && 'Mapeamento de Posições (Racks)'}
          </h2>
          <button
            onClick={() => setModalAberto(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg text-sm shadow-sm transition-all"
          >
            + Dar Entrada de SKU
          </button>
        </header>

        <main className="p-8 flex-1 overflow-y-auto">
          {abaAtiva === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total de SKUs</span>
                  <p className="text-3xl font-extrabold mt-2 text-gray-900">{itens.length}</p>
                </div>
                <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Volume Total em Estocagem</span>
                  <p className="text-3xl font-extrabold mt-2 text-blue-600">
                    {itens.reduce((acc, curr) => acc + (curr.quantidade || 0), 0)}{' '}
                    <span className="text-xs text-gray-500 font-normal">itens</span>
                  </p>
                </div>
                <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Abaixo da Posição Mínima</span>
                  <p className="text-3xl font-extrabold mt-2 text-amber-500">
                    {itens.filter(i => i.status === 'Estoque Crítico').length}
                  </p>
                </div>
                <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Indisponível / Bloqueado</span>
                  <p className="text-3xl font-extrabold mt-2 text-rose-500">
                    {itens.filter(i => i.status === 'Bloqueado').length}
                  </p>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-white">
                  <input
                    type="text"
                    placeholder="Buscar por SKU, descrição ou posição (ex: A-01)..."
                    value={busca}
                    onChange={e => setBusca(e.target.value)}
                    className="w-full max-w-md bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="overflow-x-auto">
                  {carregando ? (
                    <div className="p-8 text-center text-gray-500 text-sm">Carregando estoque do Neon...</div>
                  ) : (
                    <table className="w-full text-left text-sm text-gray-600">
                      <thead className="bg-gray-50 text-gray-500 font-semibold text-xs border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3.5">Código SKU</th>
                          <th className="px-6 py-3.5">Descrição do Item</th>
                          <th className="px-6 py-3.5">Categoria</th>
                          <th className="px-6 py-3.5">Saldo Físico</th>
                          <th className="px-6 py-3.5">Posição / Racks</th>
                          <th className="px-6 py-3.5">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {itensFiltrados.map(item => (
                          <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                            <td className="px-6 py-4 font-mono font-semibold text-blue-600">{item.sku}</td>
                            <td className="px-6 py-4 font-medium text-gray-900">{item.descricao}</td>
                            <td className="px-6 py-4 text-gray-500">{item.categoria}</td>
                            <td className="px-6 py-4 font-medium text-gray-900">
                              {item.quantidade} <span className="text-xs text-gray-400 font-normal">{item.unidade}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-mono bg-gray-100 text-gray-700 px-2.5 py-1 rounded border border-gray-200 text-xs">
                                {item.posicao}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                                  item.status === 'Disponível'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : item.status === 'Estoque Crítico'
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}
                              >
                                {item.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}

          {abaAtiva === 'entradas' && (
            <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Histórico de Recebimento de Cargas</h3>
              <p className="text-sm text-gray-500 mb-6">Acompanhe as últimas notas fiscais e entradas efetuadas na doca.</p>
              <div className="p-12 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                Nenhuma entrada de Nota Fiscal pendente de conferência no momento.
              </div>
            </div>
          )}

          {abaAtiva === 'saidas' && (
            <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Ordem de Separação e Expedição</h3>
              <p className="text-sm text-gray-500 mb-6">Gere ordens de picking e dê baixa em SKUs solicitados pela produção.</p>
              <div className="p-12 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                Todas as ordens de separação do dia foram finalizadas.
              </div>
            </div>
          )}

          {abaAtiva === 'posicoes' && (
            <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Estatuto de Ocupação dos Racks</h3>
                <p className="text-sm text-gray-500">Visualização de posições cadastradas no estoque.</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {itens.map(i => (
                  <div key={i.id} className="border border-gray-200 p-4 rounded-lg bg-gray-50 space-y-2">
                    <span className="text-xs font-mono font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                      {i.posicao}
                    </span>
                    <p className="text-sm font-semibold text-gray-800 truncate">{i.descricao}</p>
                    <p className="text-xs text-gray-500">
                      Qtd: {i.quantidade} {i.unidade}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modal de Cadastro */}
      {modalAberto && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-gray-200 rounded-xl max-w-lg w-full p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-base font-bold text-gray-900">Dar Entrada de Item no Armazém</h2>
              <button onClick={() => setModalAberto(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            <form onSubmit={adicionarItem} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Código SKU</label>
                  <input
                    required
                    type="text"
                    placeholder="Ex: WM-5011"
                    value={novoItem.sku}
                    onChange={e => setNovoItem({ ...novoItem, sku: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Categoria</label>
                  <input
                    type="text"
                    placeholder="Ex: Embalagens"
                    value={novoItem.categoria}
                    onChange={e => setNovoItem({ ...novoItem, categoria: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Descrição do Item</label>
                <input
                  required
                  type="text"
                  placeholder="Ex: Caixa de Papelão Mod. B"
                  value={novoItem.descricao}
                  onChange={e => setNovoItem({ ...novoItem, descricao: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Qtd Entrada</label>
                  <input
                    required
                    type="number"
                    value={novoItem.quantidade}
                    onChange={e => setNovoItem({ ...novoItem, quantidade: Number(e.target.value) })}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Unidade</label>
                  <select
                    value={novoItem.unidade}
                    onChange={e => setNovoItem({ ...novoItem, unidade: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-600"
                  >
                    <option value="un">un</option>
                    <option value="cx">cx</option>
                    <option value="rl">rl</option>
                    <option value="kg">kg</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Posição (Rack)</label>
                  <input
                    type="text"
                    placeholder="Ex: A-01-02-B"
                    value={novoItem.posicao}
                    onChange={e => setNovoItem({ ...novoItem, posicao: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
                >
                  Registrar Entrada
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}