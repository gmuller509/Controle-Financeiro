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
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, { method: "POST", headers, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
async function dbPatch(table: string, id: string, body: object) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, { method: "PATCH", headers, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
async function dbDelete(table: string, id: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, { method: "DELETE", headers });
  if (!res.ok) throw new Error(await res.text());
}

type Category = { id: string; name: string; icon: string; color: string; type: string };
type Transaction = { id: string; description: string; amount: number; type: string; category_id: string; date: string; notes: string; created_at: string };
type TxFull = Transaction & { categories: Category | null };

const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
const fmtDate = (d: string) => { const [y,m,dd] = d.split("-"); return `${dd}/${m}/${y}`; };

type Tab = "home" | "transactions" | "reports";

const NAV = [
  { id: "home" as Tab, label: "Início", icon: "🏠" },
  { id: "transactions" as Tab, label: "Lançamentos", icon: "📋" },
  { id: "reports" as Tab, label: "Relatórios", icon: "📊" },
];

export default function App() {
  const [tab, setTab] = useState<Tab>("home");
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<TxFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTx, setEditTx] = useState<TxFull | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());

  const [form, setForm] = useState({
    description: "", amount: "", type: "expense" as "income" | "expense",
    category_id: "", date: today.toISOString().split("T")[0], notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cats, txs] = await Promise.all([
        dbGet("categories", "order=type.asc,name.asc"),
        dbGet("transactions", "select=*,categories(*)&order=date.desc,created_at.desc"),
      ]);
      setCategories(cats);
      setTransactions(txs);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = transactions.filter(tx => {
    const [y, m] = tx.date.split("-").map(Number);
    return y === year && m - 1 === month;
  });

  const income = filtered.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const expense = filtered.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const balance = income - expense;

  const byCat = categories
    .filter(c => c.type === "expense")
    .map(c => ({ ...c, total: filtered.filter(t => t.category_id === c.id && t.type === "expense").reduce((s, t) => s + Number(t.amount), 0) }))
    .filter(c => c.total > 0)
    .sort((a, b) => b.total - a.total);

  function openAdd() {
    setEditTx(null);
    const first = categories.find(c => c.type === "expense");
    setForm({ description: "", amount: "", type: "expense", category_id: first?.id || "", date: today.toISOString().split("T")[0], notes: "" });
    setErr("");
    setModalOpen(true);
  }
  function openEdit(tx: TxFull) {
    setEditTx(tx);
    setForm({ description: tx.description, amount: String(tx.amount), type: tx.type as "income" | "expense", category_id: tx.category_id || "", date: tx.date, notes: tx.notes || "" });
    setErr("");
    setModalOpen(true);
  }
  async function handleSave() {
    if (!form.description.trim()) { setErr("Informe a descrição"); return; }
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) { setErr("Informe um valor válido"); return; }
    setSaving(true); setErr("");
    try {
      const payload = { description: form.description.trim(), amount: Number(form.amount), type: form.type, category_id: form.category_id || null, date: form.date, notes: form.notes.trim() || null };
      if (editTx) await dbPatch("transactions", editTx.id, payload);
      else await dbPost("transactions", payload);
      setModalOpen(false);
      await load();
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : "Erro ao salvar"); }
    finally { setSaving(false); }
  }
  async function handleDelete(id: string) {
    await dbDelete("transactions", id);
    setDeleteId(null);
    await load();
  }

  const filteredCats = categories.filter(c => c.type === form.type);

  return (
    <div style={{ background: "#f0f2f5", minHeight: "100vh", fontFamily: "'Inter',system-ui,sans-serif", maxWidth: 430, margin: "0 auto", position: "relative", paddingBottom: 80 }}>

      {/* ── Header escuro com saldo ── */}
      <div style={{ background: "linear-gradient(145deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)", padding: "32px 24px 36px" }}>
        {/* Seletor de período */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <button onClick={() => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); }} style={navBtnStyle}>‹</button>
          <div style={{ textAlign: "center" }}>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 2 }}>período</p>
            <p style={{ color: "#fff", fontSize: 15, fontWeight: 600 }}>{MONTHS[month]} {year}</p>
          </div>
          <button onClick={() => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); }} style={navBtnStyle}>›</button>
        </div>

        {/* Saldo principal */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, marginBottom: 8, letterSpacing: 0.5 }}>Saldo do mês</p>
          {loading
            ? <div style={{ width: 160, height: 44, background: "rgba(255,255,255,0.08)", borderRadius: 12, margin: "0 auto", animation: "pulse 1.5s ease infinite" }} />
            : <p style={{ color: balance < 0 ? "#ff6b6b" : "#fff", fontSize: 40, fontWeight: 800, letterSpacing: -2, lineHeight: 1 }}>{fmt(balance)}</p>
          }
        </div>

        {/* Entradas / Saídas */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: 16, padding: "14px 16px", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <span style={{ width: 24, height: 24, borderRadius: 8, background: "rgba(52,211,153,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>↑</span>
              <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, textTransform: "uppercase", letterSpacing: 0.8 }}>Entradas</span>
            </div>
            <p style={{ color: "#34d399", fontSize: 17, fontWeight: 700 }}>{fmt(income)}</p>
          </div>
          <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: 16, padding: "14px 16px", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <span style={{ width: 24, height: 24, borderRadius: 8, background: "rgba(248,113,113,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>↓</span>
              <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, textTransform: "uppercase", letterSpacing: 0.8 }}>Saídas</span>
            </div>
            <p style={{ color: "#f87171", fontSize: 17, fontWeight: 700 }}>{fmt(expense)}</p>
          </div>
        </div>
      </div>

      {/* ── Conteúdo ── */}
      <div style={{ padding: "20px 16px 16px" }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
            <div style={{ width: 32, height: 32, border: "3px solid #e5e7eb", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          </div>
        ) : (
          <>
            {tab === "home" && <HomeTab filtered={filtered} onEdit={openEdit} onAdd={openAdd} goTo={setTab} />}
            {tab === "transactions" && <TransactionsTab txs={filtered} onEdit={openEdit} onDelete={setDeleteId} />}
            {tab === "reports" && <ReportsTab byCat={byCat} income={income} expense={expense} filtered={filtered} />}
          </>
        )}
      </div>

      {/* ── Bottom Nav ── */}
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: "#fff", borderTop: "1px solid #f0f2f5", display: "flex", zIndex: 40, paddingBottom: "env(safe-area-inset-bottom)" }}>
        {NAV.map(n => (
          <button key={n.id} onClick={() => setTab(n.id)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "10px 0 8px", background: "none", border: "none", cursor: "pointer" }}>
            <span style={{ fontSize: 20, filter: tab === n.id ? "none" : "grayscale(1) opacity(0.45)" }}>{n.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: tab === n.id ? "#6366f1" : "#9ca3af", letterSpacing: 0.2 }}>{n.label}</span>
            {tab === n.id && <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#6366f1" }} />}
          </button>
        ))}
        {/* FAB no centro */}
        <button onClick={openAdd} style={{ position: "absolute", top: -22, left: "50%", transform: "translateX(-50%)", width: 52, height: 52, borderRadius: 18, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "3px solid #f0f2f5", color: "#fff", fontSize: 26, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 20px rgba(99,102,241,0.45)", zIndex: 50 }}>
          +
        </button>
      </div>

      {/* ── Modal add/edit ── */}
      {modalOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div onClick={() => setModalOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }} />
          <div style={{ position: "relative", background: "#fff", borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 430, padding: "20px 24px 32px", maxHeight: "92vh", overflowY: "auto" }}>
            <div style={{ width: 36, height: 4, background: "#e5e7eb", borderRadius: 2, margin: "0 auto 20px" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111" }}>{editTx ? "Editar" : "Novo"} Lançamento</h2>
              <button onClick={() => setModalOpen(false)} style={{ background: "#f3f4f6", border: "none", width: 32, height: 32, borderRadius: 10, cursor: "pointer", fontSize: 15, color: "#6b7280" }}>✕</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
              <button onClick={() => setForm(f => ({ ...f, type: "expense", category_id: categories.find(c => c.type === "expense")?.id || "" }))} style={{ padding: "12px 0", borderRadius: 14, border: "2px solid", borderColor: form.type === "expense" ? "#f87171" : "#e5e7eb", background: form.type === "expense" ? "#fff1f1" : "#fff", color: form.type === "expense" ? "#ef4444" : "#9ca3af", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                ↓ Saída
              </button>
              <button onClick={() => setForm(f => ({ ...f, type: "income", category_id: categories.find(c => c.type === "income")?.id || "" }))} style={{ padding: "12px 0", borderRadius: 14, border: "2px solid", borderColor: form.type === "income" ? "#34d399" : "#e5e7eb", background: form.type === "income" ? "#f0fdf4" : "#fff", color: form.type === "income" ? "#10b981" : "#9ca3af", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
                ↑ Entrada
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Field label="Descrição"><input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Ex: Mercado, Salário..." style={inputStyle} /></Field>
              <Field label="Valor (R$)"><input type="number" min="0" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0,00" style={inputStyle} /></Field>
              <Field label="Categoria">
                <select value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))} style={inputStyle}>
                  <option value="">Sem categoria</option>
                  {filteredCats.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </select>
              </Field>
              <Field label="Data"><input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={inputStyle} /></Field>
              <Field label="Observação (opcional)"><input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Detalhe adicional..." style={inputStyle} /></Field>

              {err && <p style={{ color: "#ef4444", fontSize: 13 }}>{err}</p>}

              <button onClick={handleSave} disabled={saving} style={{ marginTop: 4, padding: "16px 0", borderRadius: 16, border: "none", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer", opacity: saving ? 0.7 : 1 }}>
                {saving ? "Salvando..." : editTx ? "Salvar alterações" : "Adicionar lançamento"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirmar exclusão ── */}
      {deleteId && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div onClick={() => setDeleteId(null)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }} />
          <div style={{ position: "relative", background: "#fff", borderRadius: 24, padding: 28, width: "100%", maxWidth: 320, textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🗑️</div>
            <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>Excluir lançamento?</h3>
            <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 24 }}>Essa ação não pode ser desfeita.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button onClick={() => setDeleteId(null)} style={{ padding: "13px 0", borderRadius: 14, border: "1.5px solid #e5e7eb", background: "#fff", color: "#374151", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Cancelar</button>
              <button onClick={() => handleDelete(deleteId)} style={{ padding: "13px 0", borderRadius: 14, border: "none", background: "#ef4444", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Excluir</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes pulse { 0%,100% { opacity:0.4 } 50% { opacity:0.8 } }
      `}</style>
    </div>
  );
}

/* ── Abas ── */

function HomeTab({ filtered, onEdit, onAdd, goTo }: { filtered: TxFull[]; onEdit: (tx: TxFull) => void; onAdd: () => void; goTo: (t: Tab) => void }) {
  const recent = filtered.slice(0, 5);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {recent.length === 0
        ? (
          <Card>
            <Empty />
            <button onClick={onAdd} style={{ display: "block", margin: "16px auto 0", padding: "12px 28px", borderRadius: 14, border: "none", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>+ Adicionar primeiro lançamento</button>
          </Card>
        )
        : (
          <Card>
            <SectionHeader title="Lançamentos recentes" action={{ label: "Ver todos", onClick: () => goTo("transactions") }} />
            {recent.map(tx => <TxItem key={tx.id} tx={tx} onEdit={onEdit} />)}
          </Card>
        )
      }
    </div>
  );
}

function TransactionsTab({ txs, onEdit, onDelete }: { txs: TxFull[]; onEdit: (tx: TxFull) => void; onDelete: (id: string) => void }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all");
  const items = txs.filter(tx => (filter === "all" || tx.type === filter) && tx.description.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Card>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍  Buscar..." style={{ ...inputStyle, background: "#f3f4f6", border: "none", marginBottom: 10 }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
          {(["all", "income", "expense"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: "8px 0", borderRadius: 10, border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer", background: filter === f ? "#1a1a2e" : "#f3f4f6", color: filter === f ? "#fff" : "#6b7280" }}>
              {f === "all" ? "Todos" : f === "income" ? "Entradas" : "Saídas"}
            </button>
          ))}
        </div>
      </Card>

      {items.length === 0
        ? <Card><Empty /></Card>
        : <Card>{items.map(tx => <TxItem key={tx.id} tx={tx} onEdit={onEdit} onDelete={onDelete} />)}</Card>
      }
    </div>
  );
}

function ReportsTab({ byCat, income, expense, filtered }: { byCat: (Category & { total: number })[]; income: number; expense: number; filtered: TxFull[] }) {
  const today = new Date();
  const day = today.getDate();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const dailyRate = day > 0 ? expense / day : 0;
  const projected = dailyRate * daysInMonth;
  const savings = income > 0 ? ((income - expense) / income) * 100 : 0;
  const totalTxs = filtered.length;
  const avgTx = totalTxs > 0 ? expense / filtered.filter(t => t.type === "expense").length || 0 : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Previsão */}
      <Card>
        <SectionHeader title="Previsão do mês" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            { label: "Gasto médio/dia", value: fmt(dailyRate), color: "#374151" },
            { label: "Projeção de gastos", value: fmt(projected), color: "#374151" },
            { label: "Saldo estimado", value: fmt(income - projected), color: income - projected < 0 ? "#ef4444" : "#10b981" },
            { label: "Taxa de economia", value: `${savings.toFixed(1)}%`, color: savings < 0 ? "#ef4444" : "#10b981" },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: "#f9fafb", borderRadius: 14, padding: "14px" }}>
              <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 5 }}>{label}</p>
              <p style={{ fontSize: 16, fontWeight: 700, color }}>{value}</p>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 11, color: "#d1d5db", marginTop: 10 }}>Baseado nos {day} de {daysInMonth} dias do mês</p>
      </Card>

      {/* Resumo rápido */}
      <Card>
        <SectionHeader title="Resumo" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div style={{ background: "#f0fdf4", borderRadius: 14, padding: 14 }}>
            <p style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>Total de entradas</p>
            <p style={{ fontSize: 16, fontWeight: 700, color: "#10b981" }}>{fmt(income)}</p>
          </div>
          <div style={{ background: "#fff1f1", borderRadius: 14, padding: 14 }}>
            <p style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>Total de saídas</p>
            <p style={{ fontSize: 16, fontWeight: 700, color: "#ef4444" }}>{fmt(expense)}</p>
          </div>
          <div style={{ background: "#f5f3ff", borderRadius: 14, padding: 14 }}>
            <p style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>Lançamentos</p>
            <p style={{ fontSize: 16, fontWeight: 700, color: "#6366f1" }}>{totalTxs}</p>
          </div>
          <div style={{ background: "#fefce8", borderRadius: 14, padding: 14 }}>
            <p style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>Gasto médio/item</p>
            <p style={{ fontSize: 16, fontWeight: 700, color: "#d97706" }}>{fmt(avgTx)}</p>
          </div>
        </div>
      </Card>

      {/* Por categoria */}
      {byCat.length > 0 && (
        <Card>
          <SectionHeader title="Gastos por categoria" />
          {byCat.map((c, i) => (
            <div key={c.id} style={{ marginBottom: i < byCat.length - 1 ? 16 : 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ width: 32, height: 32, borderRadius: 10, background: c.color + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{c.icon}</span>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>{c.name}</p>
                    <p style={{ fontSize: 11, color: "#9ca3af" }}>{((c.total / expense) * 100).toFixed(1)}% do total</p>
                  </div>
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#111" }}>{fmt(c.total)}</span>
              </div>
              <div style={{ height: 6, background: "#f3f4f6", borderRadius: 6, overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 6, background: c.color, width: `${(c.total / byCat[0].total) * 100}%` }} />
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

/* ── Componentes base ── */

function Card({ children }: { children: React.ReactNode }) {
  return <div style={{ background: "#fff", borderRadius: 20, padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>{children}</div>;
}

function SectionHeader({ title, action }: { title: string; action?: { label: string; onClick: () => void } }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: "#111" }}>{title}</h3>
      {action && <button onClick={action.onClick} style={{ fontSize: 12, color: "#6366f1", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>{action.label} →</button>}
    </div>
  );
}

function TxItem({ tx, onEdit, onDelete }: { tx: TxFull; onEdit: (tx: TxFull) => void; onDelete?: (id: string) => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid #f3f4f6" }}>
      <div style={{ width: 42, height: 42, borderRadius: 14, background: (tx.categories?.color || "#6b7280") + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
        {tx.categories?.icon || "📦"}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: "#111", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tx.description}</p>
        <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{tx.categories?.name || "Sem categoria"} · {fmtDate(tx.date)}</p>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: tx.type === "income" ? "#10b981" : "#ef4444", whiteSpace: "nowrap" }}>
          {tx.type === "income" ? "+" : "-"}{fmt(Number(tx.amount))}
        </span>
        <div style={{ display: "flex", gap: 4 }}>
          <button onClick={() => onEdit(tx)} style={{ width: 30, height: 30, borderRadius: 9, background: "#f3f4f6", border: "none", cursor: "pointer", fontSize: 13 }}>✏️</button>
          {onDelete && <button onClick={() => onDelete(tx.id)} style={{ width: 30, height: 30, borderRadius: 9, background: "#fff1f1", border: "none", cursor: "pointer", fontSize: 13 }}>🗑️</button>}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}

function Empty() {
  return (
    <div style={{ textAlign: "center", padding: "20px 0" }}>
      <p style={{ fontSize: 36, marginBottom: 8 }}>📭</p>
      <p style={{ fontSize: 14, color: "#6b7280", fontWeight: 500 }}>Nenhum lançamento neste período</p>
      <p style={{ fontSize: 12, color: "#d1d5db", marginTop: 4 }}>Toque em + para adicionar</p>
    </div>
  );
}

const navBtnStyle: React.CSSProperties = { background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", width: 36, height: 36, borderRadius: 12, fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" };
const inputStyle: React.CSSProperties = { width: "100%", padding: "13px 14px", borderRadius: 14, border: "1.5px solid #e5e7eb", fontSize: 14, outline: "none", background: "#f9fafb", color: "#111", fontFamily: "inherit" };
