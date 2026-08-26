'use client';

import { useState } from 'react';

interface ItemArmazem {
  id: string;
  sku: string;
  descricao: string;
  categoria: string;
  quantidade: number;
  unidade: string;
  posicao: string;
  status: 'Disponível' | 'Estoque Crítico' | 'Bloqueado';
}

export default function WmsDashboard() {
  const [itens, setItens] = useState<ItemArmazem[]>([
    { id: '1', sku: 'WM-1002', descricao: 'Caixa de Papelão Dupla 60x40x40', categoria: 'Embalagens', quantidade: 480, unidade: 'cx', posicao: 'A-01-02-A', status: 'Disponível' },
    { id: '2', sku: 'WM-3045', descricao: 'Palete PBR Madeira Padronizado', categoria: 'Movimentação', quantidade: 14, unidade: 'un', posicao: 'B-03-01-C', status: 'Estoque Crítico' },
    { id: '3', sku: 'WM-8821', descricao: 'Filme Stretch Manual 500mm x 25mic', categoria: 'Insumos', quantidade: 120, unidade: 'rl', posicao: 'A-02-04-B', status: 'Disponível' },
    { id: '4', sku: 'WM-9012', descricao: 'Fita Adesiva Transparente 48mmx100m', categoria: 'Insumos', quantidade: 0, unidade: 'cx', posicao: 'C-01-01-A', status: 'Bloqueado' },
  ]);

  const [busca, setBusca] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [novoItem, setNovoItem] = useState({ sku: '', descricao: '', categoria: '', quantidade: 0, unidade: 'un', posicao: '' });

  const adicionarItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoItem.descricao || !novoItem.sku) return;
    
    const qtd = Number(novoItem.quantidade);
    const item: ItemArmazem = {
      id: Date.now().toString(),
      sku: novoItem.sku,
      descricao: novoItem.descricao,
      categoria: novoItem.categoria || 'Geral',
      quantidade: qtd,
      unidade: novoItem.unidade || 'un',
      posicao: novoItem.posicao || 'Doca Entrada',
      status: qtd === 0 ? 'Bloqueado' : qtd < 20 ? 'Estoque Crítico' : 'Disponível',
    };

    setItens([...itens, item]);
    setNovoItem({ sku: '', descricao: '', categoria: '', quantidade: 0, unidade: 'un', posicao: '' });
    setModalAberto(false);
  };

  const itensFiltrados = itens.filter(i => 
    i.descricao.toLowerCase().includes(busca.toLowerCase()) || 
    i.sku.toLowerCase().includes(busca.toLowerCase()) ||
    i.posicao.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col font-sans">
      {/* Topbar Claro */}
      <header className="border-b border-gray-200 bg-white px-8 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-sm">
            W
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">ProdLog WMS</h1>
            <p className="text-xs text-gray-500">Gestão de Armazém e Controle de Estoque</p>
          </div>
        </div>
        <button 
          onClick={() => setModalAberto(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg text-sm shadow-sm transition-all flex items-center gap-2"
        >
          <span className="text-lg font-normal">+</span> Dar Entrada de SKU
        </button>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 p-8 max-w-7xl w-full mx-auto space-y-6">
        
        {/* KPI Cards em Estilo Claro ProdOS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total de SKUs</span>
            <p className="text-3xl font-extrabold mt-2 text-gray-900">{itens.length}</p>
          </div>
          <div className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Volume Total em Estocagem</span>
            <p className="text-3xl font-extrabold mt-2 text-blue-600">
              {itens.reduce((acc, curr) => acc + curr.quantidade, 0)} <span className="text-xs text-gray-500 font-normal">itens</span>
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

        {/* Tabela Limpa */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-200 bg-white flex items-center justify-between gap-4">
            <div className="w-full max-w-md relative">
              <input
                type="text"
                placeholder="Buscar por SKU, descrição ou posição (ex: A-01)..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
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
                {itensFiltrados.map((item) => (
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
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                        item.status === 'Disponível' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        item.status === 'Estoque Crítico' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-rose-50 text-rose-700 border border-rose-200'
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

      {/* Modal de Entrada de Material */}
      {modalAberto && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-gray-200 rounded-xl max-w-lg w-full p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2 className="text-base font-bold text-gray-900">Dar Entrada de Item no Armazém</h2>
              <button onClick={() => setModalAberto(false)} className="text-gray-400 hover:text-gray-600">✕</button>
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
                    onChange={(e) => setNovoItem({ ...novoItem, sku: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Categoria</label>
                  <input
                    type="text"
                    placeholder="Ex: Embalagens"
                    value={novoItem.categoria}
                    onChange={(e) => setNovoItem({ ...novoItem, categoria: e.target.value })}
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
                  onChange={(e) => setNovoItem({ ...novoItem, descricao: e.target.value })}
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
                    onChange={(e) => setNovoItem({ ...novoItem, quantidade: Number(e.target.value) })}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Unidade</label>
                  <select
                    value={novoItem.unidade}
                    onChange={(e) => setNovoItem({ ...novoItem, unidade: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-blue-600"
                  >
                    <option value="un">un</option>
                    <option value="cx">cx</option>
                    <option value="rl">rl</option>
                    <option value="kg">kg</option>
                    <option value="pt">pt</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Posição (Rack/Rua)</label>
                  <input
                    type="text"
                    placeholder="Ex: A-01-02-B"
                    value={novoItem.posicao}
                    onChange={(e) => setNovoItem({ ...novoItem, posicao: e.target.value })}
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