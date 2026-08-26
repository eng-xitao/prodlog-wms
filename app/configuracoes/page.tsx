'use client';

import { useState } from 'react';

const sections = [
  ['Dados da empresa', 'Razão social, CNPJ, contatos e responsável.'],
  ['Armazéns e docas', 'Cadastre armazéns, docas e áreas operacionais.'],
  ['Regras de estoque', 'Estoque mínimo, máximo, bloqueios e alertas.'],
  ['Unidades de medida', 'Configure unidade, conversões e casas decimais.'],
  ['Notificações', 'Defina alertas operacionais e administrativos.'],
  ['Integrações', 'Configure APIs, ERP, NF-e e serviços externos.'],
];

export default function ConfiguracoesPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [value, setValue] = useState('');

  function open(name: string) { setSelected(name); setSaved(false); setValue(''); }
  function save() { setSaved(true); }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[.2em] text-blue-600 font-bold">ProdLog WMS • Gestão</div>
            <h1 className="text-3xl font-black mt-1">Configurações</h1>
            <p className="text-slate-500 mt-1">Parâmetros do ambiente operacional da empresa.</p>
          </div>
          <a href="/" className="border bg-white px-4 py-2.5 rounded-lg text-sm font-semibold">← Voltar ao WMS</a>
        </div>

        {saved && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-3 text-sm font-semibold">Configuração salva no protótipo.</div>}

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {sections.map(([name, desc]) => (
            <button key={name} onClick={() => open(name)} className="text-left bg-white border rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-blue-300 transition">
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl">⚙</div>
              <h2 className="font-bold text-lg mt-4">{name}</h2>
              <p className="text-sm text-slate-500 mt-1">{desc}</p>
              <span className="inline-block text-blue-600 text-sm font-semibold mt-5">Configurar →</span>
            </button>
          ))}
        </div>

        <section className="bg-white border rounded-2xl p-6 shadow-sm">
          <h2 className="font-bold text-lg">Ambiente atual</h2>
          <div className="grid sm:grid-cols-3 gap-4 mt-4">
            <div><span className="text-xs text-slate-400">Empresa</span><p className="font-semibold">Belmonte Indústria</p></div>
            <div><span className="text-xs text-slate-400">Ambiente</span><p className="font-semibold text-emerald-600">● Produção</p></div>
            <div><span className="text-xs text-slate-400">Banco</span><p className="font-semibold">Banco individual do cliente</p></div>
          </div>
        </section>

        {selected && <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="p-5 border-b flex items-center justify-between"><div><h2 className="text-xl font-bold">{selected}</h2><p className="text-xs text-slate-400 mt-1">Configuração do ambiente</p></div><button onClick={() => setSelected(null)} className="text-2xl">×</button></div>
            <div className="p-5 space-y-4"><label className="text-sm font-medium text-slate-600">Parâmetro / observação<textarea value={value} onChange={e => setValue(e.target.value)} rows={5} className="mt-1 w-full border rounded-lg px-3 py-2.5" placeholder={`Informe as configurações de ${selected.toLowerCase()}...`} /></label><div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-500">As configurações serão vinculadas somente à empresa atualmente selecionada.</div></div>
            <div className="p-5 border-t flex justify-end gap-2"><button onClick={() => setSelected(null)} className="border px-4 py-2 rounded-lg">Cancelar</button><button onClick={save} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold">Salvar configuração</button></div>
          </div>
        </div>}
      </div>
    </main>
  );
}
