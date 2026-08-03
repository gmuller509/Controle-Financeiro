"use client";

import { useState, useEffect, useCallback } from "react";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const headers = {
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
  "Prefer": "return=representation",
};

async function dbGet(table: string, params = "") {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, { headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function dbPost(table: string, body: object) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST", headers, body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function dbPatch(table: string, id: string, body: object) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: "PATCH", headers, body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function dbDelete(table: string, id: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: "DELETE", headers,
  });
  if (!res.ok) throw new Error(await res.text());
}

type Category = { id: string; name: string; icon: string; color: string; type: string };
type Transaction = {
  id: string; description: string; amount: number; type: string;
  category_id: string; date: string; notes: string; created_at: string;
};
type TransactionWithCategory = Transaction & { categories: Category | null };

const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

function fmt(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function fmtDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

export default function App() {
  const [view, setView] = useState<"dashboard" | "transactions">("dashboard");
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<TransactionWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTx, setEditTx] = useState<TransactionWithCategory | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());

  const [form, setForm] = useState({
    description: "", amount: "", type: "expense" as "income" | "expense",
    category_id: "", date: today.toISOString().split("T")[0], notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cats, txs] = await Promise.all([
        dbGet("categories", "order=type.asc,name.asc"),
        dbGet("transactions", `select=*,categories(*)&order=date.desc,created_at.desc`),
      ]);
      setCategories(cats);
      setTransactions(txs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filteredTxs = transactions.filter(tx => {
    const [y, m] = tx.date.split("-").map(Number);
    return y === selectedYear && m - 1 === selectedMonth;
  });

  const totalIncome = filteredTxs.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = filteredTxs.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const balance = totalIncome - totalExpense;

  const expenseByCategory = categories
    .filter(c => c.type === "expense")
    .map(cat => ({
      ...cat,
      total: filteredTxs.filter(t => t.category_id === cat.id && t.type === "expense").reduce((s, t) => s + Number(t.amount), 0),
    }))
    .filter(c => c.total > 0)
    .sort((a, b) => b.total - a.total);

  const maxExpense = expenseByCategory[0]?.total || 1;

  function openAdd() {
    setEditTx(null);
    const firstExpenseCat = categories.find(c => c.type === "expense");
    setForm({
      description: "", amount: "", type: "expense",
      category_id: firstExpenseCat?.id || "",
      date: today.toISOString().split("T")[0], notes: "",
    });
    setError("");
    setModalOpen(true);
  }

  function openEdit(tx: TransactionWithCategory) {
    setEditTx(tx);
    setForm({
      description: tx.description,
      amount: String(tx.amount),
      type: tx.type as "income" | "expense",
      category_id: tx.category_id || "",
      date: tx.date,
      notes: tx.notes || "",
    });
    setError("");
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.description.trim()) { setError("Informe a descrição"); return; }
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) { setError("Informe um valor válido"); return; }
    setSaving(true);
    setError("");
    try {
      const payload = {
        description: form.description.trim(),
        amount: Number(form.amount),
        type: form.type,
        category_id: form.category_id || null,
        date: form.date,
        notes: form.notes.trim() || null,
      };
      if (editTx) {
        await dbPatch("transactions", editTx.id, payload);
      } else {
        await dbPost("transactions", payload);
      }
      setModalOpen(false);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await dbDelete("transactions", id);
      setDeleteConfirm(null);
      await load();
    } catch (e) {
      console.error(e);
    }
  }

  function prevMonth() {
    if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear(y => y - 1); }
    else setSelectedMonth(m => m - 1);
  }
  function nextMonth() {
    if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear(y => y + 1); }
    else setSelectedMonth(m => m + 1);
  }

  const filteredCats = categories.filter(c => c.type === form.type);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💰</span>
            <h1 className="text-lg font-semibold text-gray-900">Minhas Finanças</h1>
          </div>
          <button
            onClick={openAdd}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center gap-1"
          >
            <span className="text-base">+</span> Adicionar
          </button>
        </div>

        {/* Nav tabs */}
        <div className="max-w-2xl mx-auto px-4 flex gap-1 pb-0">
          {(["dashboard", "transactions"] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                view === v
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {v === "dashboard" ? "Resumo" : "Lançamentos"}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4 pb-8">
        {/* Period Selector */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-gray-200 transition-colors text-gray-600">
            ‹
          </button>
          <span className="font-semibold text-gray-800">{MONTHS[selectedMonth]} {selectedYear}</span>
          <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-gray-200 transition-colors text-gray-600">
            ›
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {view === "dashboard" && (
              <DashboardView
                balance={balance}
                totalIncome={totalIncome}
                totalExpense={totalExpense}
                expenseByCategory={expenseByCategory}
                maxExpense={maxExpense}
                recentTxs={filteredTxs.slice(0, 5)}
                onEdit={openEdit}
                setView={setView}
              />
            )}
            {view === "transactions" && (
              <TransactionsView
                transactions={filteredTxs}
                onEdit={openEdit}
                onDelete={setDeleteConfirm}
              />
            )}
          </>
        )}
      </main>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center fade-in">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-lg p-6 slide-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">{editTx ? "Editar" : "Novo"} Lançamento</h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>

            {/* Type toggle */}
            <div className="flex rounded-xl overflow-hidden border border-gray-200 mb-4">
              <button
                onClick={() => {
                  setForm(f => ({ ...f, type: "expense", category_id: categories.find(c => c.type === "expense")?.id || "" }));
                }}
                className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${form.type === "expense" ? "bg-red-500 text-white" : "bg-white text-gray-500"}`}
              >
                Saída
              </button>
              <button
                onClick={() => {
                  setForm(f => ({ ...f, type: "income", category_id: categories.find(c => c.type === "income")?.id || "" }));
                }}
                className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${form.type === "income" ? "bg-emerald-500 text-white" : "bg-white text-gray-500"}`}
              >
                Entrada
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Descrição</label>
                <input
                  className="w-full mt-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Mercado, Salário..."
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Valor (R$)</label>
                <input
                  type="number" min="0" step="0.01"
                  className="w-full mt-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0,00"
                  value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Categoria</label>
                <select
                  className="w-full mt-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  value={form.category_id}
                  onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
                >
                  <option value="">Sem categoria</option>
                  {filteredCats.map(c => (
                    <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Data</label>
                <input
                  type="date"
                  className="w-full mt-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Observações (opcional)</label>
                <input
                  className="w-full mt-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Detalhe adicional..."
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                />
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 mt-2"
              >
                {saving ? "Salvando..." : editTx ? "Salvar alterações" : "Adicionar lançamento"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center fade-in px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-sm slide-in text-center">
            <p className="text-4xl mb-3">🗑️</p>
            <h3 className="font-bold text-gray-900 mb-1">Excluir lançamento?</h3>
            <p className="text-sm text-gray-500 mb-5">Essa ação não pode ser desfeita.</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600">
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DashboardView({
  balance, totalIncome, totalExpense, expenseByCategory, maxExpense, recentTxs, onEdit, setView,
}: {
  balance: number; totalIncome: number; totalExpense: number;
  expenseByCategory: (Category & { total: number })[];
  maxExpense: number;
  recentTxs: TransactionWithCategory[];
  onEdit: (tx: TransactionWithCategory) => void;
  setView: (v: "dashboard" | "transactions") => void;
}) {
  return (
    <div className="space-y-4 slide-in">
      {/* Balance card */}
      <div className="bg-blue-600 rounded-2xl p-5 text-white">
        <p className="text-blue-200 text-sm mb-1">Saldo do mês</p>
        <p className={`text-3xl font-bold mb-4 ${balance < 0 ? "text-red-300" : ""}`}>{fmt(balance)}</p>
        <div className="flex gap-4">
          <div className="flex-1 bg-blue-500/40 rounded-xl p-3">
            <p className="text-blue-200 text-xs mb-0.5">Entradas</p>
            <p className="text-white font-semibold">{fmt(totalIncome)}</p>
          </div>
          <div className="flex-1 bg-blue-500/40 rounded-xl p-3">
            <p className="text-blue-200 text-xs mb-0.5">Saídas</p>
            <p className="text-white font-semibold">{fmt(totalExpense)}</p>
          </div>
        </div>
      </div>

      {/* Expense by category */}
      {expenseByCategory.length > 0 && (
        <div className="bg-white rounded-2xl p-4">
          <h3 className="font-semibold text-gray-800 mb-3">Gastos por categoria</h3>
          <div className="space-y-3">
            {expenseByCategory.map((cat, i) => (
              <div key={cat.id}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{cat.icon}</span>
                    <span className="text-sm text-gray-700">{cat.name}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{fmt(cat.total)}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bar-grow"
                    style={{
                      width: `${(cat.total / maxExpense) * 100}%`,
                      backgroundColor: cat.color,
                      animationDelay: `${i * 0.08}s`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent transactions */}
      <div className="bg-white rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-800">Últimos lançamentos</h3>
          {recentTxs.length > 0 && (
            <button onClick={() => setView("transactions")} className="text-blue-600 text-sm font-medium">
              Ver todos
            </button>
          )}
        </div>
        {recentTxs.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-1">
            {recentTxs.map(tx => (
              <TxRow key={tx.id} tx={tx} onEdit={onEdit} compact />
            ))}
          </div>
        )}
      </div>

      {/* Forecast */}
      {totalExpense > 0 && (
        <ForecastCard totalIncome={totalIncome} totalExpense={totalExpense} />
      )}
    </div>
  );
}

function ForecastCard({ totalIncome, totalExpense }: { totalIncome: number; totalExpense: number }) {
  const today = new Date();
  const dayOfMonth = today.getDate();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const daysLeft = daysInMonth - dayOfMonth;
  const dailyRate = totalExpense / dayOfMonth;
  const projectedExpense = dailyRate * daysInMonth;
  const projectedBalance = totalIncome - projectedExpense;
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

  return (
    <div className="bg-white rounded-2xl p-4">
      <h3 className="font-semibold text-gray-800 mb-3">Previsão do mês</h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-xs text-gray-500 mb-0.5">Gasto médio/dia</p>
          <p className="font-semibold text-gray-900 text-sm">{fmt(dailyRate)}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-xs text-gray-500 mb-0.5">Gasto estimado</p>
          <p className="font-semibold text-gray-900 text-sm">{fmt(projectedExpense)}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-xs text-gray-500 mb-0.5">Saldo estimado</p>
          <p className={`font-semibold text-sm ${projectedBalance < 0 ? "text-red-500" : "text-emerald-600"}`}>{fmt(projectedBalance)}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-xs text-gray-500 mb-0.5">Taxa de economia</p>
          <p className={`font-semibold text-sm ${savingsRate < 0 ? "text-red-500" : "text-emerald-600"}`}>{savingsRate.toFixed(1)}%</p>
        </div>
      </div>
      <p className="text-xs text-gray-400 mt-2">Baseado nos {dayOfMonth} dias registrados. Faltam {daysLeft} dias.</p>
    </div>
  );
}

function TransactionsView({
  transactions, onEdit, onDelete,
}: {
  transactions: TransactionWithCategory[];
  onEdit: (tx: TransactionWithCategory) => void;
  onDelete: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all");

  const filtered = transactions.filter(tx => {
    const matchType = filter === "all" || tx.type === filter;
    const matchSearch = tx.description.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  return (
    <div className="space-y-3 slide-in">
      <div className="bg-white rounded-2xl p-3">
        <input
          className="w-full px-3 py-2 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
          placeholder="Buscar lançamento..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="flex gap-1">
          {(["all", "income", "expense"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === f ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"
              }`}
            >
              {f === "all" ? "Todos" : f === "income" ? "Entradas" : "Saídas"}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="bg-white rounded-2xl divide-y divide-gray-50">
          {filtered.map(tx => (
            <TxRow key={tx.id} tx={tx} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

function TxRow({
  tx, onEdit, onDelete, compact = false,
}: {
  tx: TransactionWithCategory;
  onEdit: (tx: TransactionWithCategory) => void;
  onDelete?: (id: string) => void;
  compact?: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 ${compact ? "py-2" : "px-4 py-3"}`}>
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
        style={{ backgroundColor: (tx.categories?.color || "#6b7280") + "20" }}
      >
        {tx.categories?.icon || "📦"}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{tx.description}</p>
        <p className="text-xs text-gray-400">{tx.categories?.name || "Sem categoria"} · {fmtDate(tx.date)}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-sm font-semibold ${tx.type === "income" ? "text-emerald-600" : "text-red-500"}`}>
          {tx.type === "income" ? "+" : "-"}{fmt(Number(tx.amount))}
        </span>
        {!compact && (
          <div className="flex gap-1">
            <button onClick={() => onEdit(tx)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
              ✏️
            </button>
            {onDelete && (
              <button onClick={() => onDelete(tx.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                🗑️
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-10">
      <p className="text-4xl mb-3">📭</p>
      <p className="text-gray-500 text-sm">Nenhum lançamento neste período</p>
      <p className="text-gray-400 text-xs mt-1">Clique em + Adicionar para começar</p>
    </div>
  );
}
