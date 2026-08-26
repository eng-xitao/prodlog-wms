'use client';

import { useState } from 'react';

const companies = [
  ['Belmonte Indústria', '12.345.678/0001-10', 'Premium', '14', 'Ativa'],
  ['Alfa Componentes', '23.456.789/0001-20', 'Intermediário', '8', 'Ativa'],
  ['Metalúrgica Nova Era', '34.567.890/0001-30', 'Básico', '4', 'Pendente'],
];

export default function AdminPage() {
  const [modal, setModal] = useState(false);
  return (
    <main className="min-h-screen bg-slate-100 text-slate-900 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[.2em] text-blue-600 font-bold">ProdLog WMS • MASTER</div>
            <h1 className="text-3xl font-black mt-1">Administração da plataforma</h1>
            <p className="text-slate-500 mt-1">Controle central de clientes, planos, mensalidades e suporte.</p>
          </div>
          <a href="/" className="border bg-white px-4 py-2.5 rounded-lg text-sm font-semibold">← Voltar ao WMS</a>
        </div>

        <section className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[['Empresas','24','3 pendentes'],['Clientes ativos','21','87,5% da base'],['Mensalidades em aberto','3','R$ 8.450'],['Chamados','7','2 prioritários']].map(([label,value,hint]) => (
            <div key={label} className="bg-white border rounded-2xl p-5 shadow-sm">
              <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">{label}</div>
              <div className="text-3xl font-black mt-2 text-blue-600">{value}</div>
              <div className="text-xs text-slate-400 mt-1">{hint}</div>
            </div>
          ))}
        </section>

        <div className="grid xl:grid-cols-3 gap-6">
          <section className="xl:col-span-2 bg-white border rounded-2xl overflow-hidden shadow-sm">
            <div className="p-5 border-b flex items-center justify-between gap-3">
              <div><h2 className="font-bold text-lg">Empresas clientes</h2><p className="text-xs text-slate-400">Cada cliente possui seu ambiente e banco próprio.</p></div>
              <button onClick={() => setModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold">+ Nova empresa</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr>{['Empresa','CNPJ','Plano','Usuários','Status'].map(h => <th key={h} className="text-left px-5 py-3">{h}</th>)}</tr></thead>
                <tbody className="divide-y">{companies.map(c => <tr key={c[1]} className="hover:bg-slate-50"><td className="px-5 py-4 font-semibold">{c[0]}</td><td className="px-5 py-4 font-mono text-xs">{c[1]}</td><td className="px-5 py-4">{c[2]}</td><td className="px-5 py-4">{c[3]}</td><td className="px-5 py-4"><span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${c[4] === 'Ativa' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{c[4]}</span></td></tr>)}</tbody>
              </table>
            </div>
          </section>

          <section className="space-y-4">
            {[['💳','Mensalidades','Vencimentos, pagamentos e histórico.'],['🎫','Suporte','Chamados, prioridade e atendimento.'],['👥','Usuários MASTER','Equipe interna e permissões administrativas.'],['📝','Auditoria','Acessos e ações realizadas na plataforma.']].map(([icon,title,desc]) => <div key={title} className="bg-white border rounded-2xl p-5 shadow-sm"><div className="text-2xl">{icon}</div><h3 className="font-bold mt-3">{title}</h3><p className="text-sm text-slate-500 mt-1">{desc}</p><button className="text-blue-600 text-sm font-semibold mt-4">Abrir módulo →</button></div>)}
          </section>
        </div>

        {modal && <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"><div className="bg-white rounded-2xl w-full max-w-xl p-6"><h2 className="text-xl font-bold">Cadastrar empresa</h2><div className="grid sm:grid-cols-2 gap-4 mt-5">{['Razão social','CNPJ','Responsável','E-mail','Plano','Banco do cliente'].map(f => <label key={f} className="text-sm font-medium text-slate-600">{f}<input className="mt-1 w-full border rounded-lg px-3 py-2.5" placeholder={f}/></label>)}</div><div className="flex justify-end gap-2 mt-6"><button onClick={() => setModal(false)} className="border px-4 py-2 rounded-lg">Cancelar</button><button onClick={() => setModal(false)} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold">Salvar empresa</button></div></div></div>}
      </div>
    </main>
  );
}
