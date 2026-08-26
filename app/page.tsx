'use client';

import { useState } from 'react';

interface Componente {
  id: string;
  codigo: string;
  nome: string;
  quantidade: number;
  localizacao: string;
  status: 'Em Estoque' | 'Em Produção' | 'Baixo Estoque';
}

export default function ProdLogDashboard() {
  const [itens, setItens] = useState<Componente[]>([
    { id: '1', codigo: 'PRD-001', nome: 'Estrutura Tubolar 40x40', quantidade: 150, localizacao: 'Rua A - A1', status: 'Em Estoque' },
    { id: '2', codigo: 'PRD-002', nome: 'Chapa Aço Galvanizado 2mm', quantidade: 12, localizacao: 'Rua B - B3', status: 'Baixo Estoque' },
    { id: '3', codigo: 'PRD-003', nome: 'Perfil U Dobrado 3m', quantidade: 85, localizacao: 'Rua C - A2', status: 'Em Produção' },
  ]);

  const [busca, setBusca] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [novoItem, setNovoItem] = useState({ codigo: '', nome: '', quantidade: 0, localizacao: '' });

  const adicionarItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoItem.nome || !novoItem.codigo) return;
    
    const item: Componente = {
      id: Date.now().toString(),
      codigo: novoItem.codigo,
      nome: novoItem.nome,
      quantidade: Number(novoItem.quantidade),
      localizacao: novoItem.localizacao || 'Geral',
      status: Number(novoItem.quantidade) < 20 ? 'Baixo Estoque' : 'Em Estoque',
    };

    setItens([...itens, item]);
    setNovoItem({ codigo: '', nome: '', quantidade: 0, localizacao: '' });
    setModalAberto(false);
  };

  const itensFiltrados = itens.filter(i => 
    i.nome.toLowerCase().includes(busca.toLowerCase()) || 
    i.codigo.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Topbar */}
      <header className="border-b border-slate-800 bg-slate-900 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded bg-blue-600 flex items-center justify-center font-bold text-white">P</div>
          <h1 className="text-xl font-bold tracking-tight text-white">ProdLog WMS</h1>
        </div>
        <button 
          onClick={() => setModalAberto(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors"
        >
          + Novo Material
        </button>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
            <p className="text-sm font-medium text-slate-400">Total de Itens Registrados</p>
            <p className="text-3xl font-bold mt-2 text-white">{itens.length}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
            <p className="text-sm font-medium text-slate-400">Itens em Alerta de Estoque</p>
            <p className="text-3xl font-bold mt-2 text-amber-500">
              {itens.filter(i => i.status === 'Baixo Estoque').length}
            </p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
            <p className="text-sm font-medium text-slate-400">Ordens em Produção</p>
            <p className="text-3xl font-bold mt-2 text-blue-400">
              {itens.filter(i => i.status === 'Em Produção').length}
            </p>
          </div>
        </div>

        {/* Tabela de Controle */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-4">
            <input
              type="text"
              placeholder="Buscar por código ou nome do material..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-xs">
                <tr>
                  <th className="px-6 py-3">Código</th>
                  <th className="px-6 py-3">Descrição / Material</th>
                  <th className="px-6 py-3">Qtd em Estoque</th>
                  <th className="px-6 py-3">Localização</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {itensFiltrados.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-mono font-medium text-blue-400">{item.codigo}</td>
                    <td className="px-6 py-4 font-medium text-white">{item.nome}</td>
                    <td className="px-6 py-4">{item.quantidade} un</td>
                    <td className="px-6 py-4 text-slate-400">{item.localizacao}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.status === 'Em Estoque' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        item.status === 'Baixo Estoque' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal Cadastro */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-lg font-bold text-white">Cadastrar Novo Item</h2>
            <form onSubmit={adicionarItem} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Código</label>
                <input
                  required
                  type="text"
                  placeholder="EX: PRD-004"
                  value={novoItem.codigo}
                  onChange={(e) => setNovoItem({ ...novoItem, codigo: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Nome / Descrição</label>
                <input
                  required
                  type="text"
                  placeholder="Descrição do material"
                  value={novoItem.nome}
                  onChange={(e) => setNovoItem({ ...novoItem, nome: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Quantidade</label>
                  <input
                    required
                    type="number"
                    value={novoItem.quantidade}
                    onChange={(e) => setNovoItem({ ...novoItem, quantidade: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Localização</label>
                  <input
                    type="text"
                    placeholder="Ex: Rua A"
                    value={novoItem.localizacao}
                    onChange={(e) => setNovoItem({ ...novoItem, localizacao: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}