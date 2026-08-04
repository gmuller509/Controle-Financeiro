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
type Transaction = {
  id: string; description: string; amount: number; type: string;
  category_id: string; date: string; notes: string;
  payment_method: string | null; created_at: string;
};
type TxFull = Transaction & { categories: Category | null };
type Tab = "home" | "transactions" | "reports";
type CardFilter = "all" | "PICPAY" | "BRADESCO" | "PIX";

const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const MONTHS_SHORT = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
const fmtDate = (d: string) => { const [y,m,dd] = d.split("-"); return `${dd}/${m}/${y}`; };

const CARD_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  PICPAY:   { bg: "#e6faf2", color: "#059669", label: "PicPay" },
  BRADESCO: { bg: "#fff0e6", color: "#d97706", label: "Bradesco" },
  PIX:      { bg: "#f0f5ff", color: "#4f46e5", label: "Pix" },
};

const NAV: { id: Tab; label: string; icon: string }[] = [
  { id: "home", label: "Início", icon: "🏠" },
  { id: "transactions", label: "Lançamentos", icon: "📋" },
  { id: "reports", label: "Relatórios", icon: "📊" },
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
    payment_method: "PICPAY",
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

  const picpayTotal = filtered.filter(t => t.type === "expense" && t.payment_method === "PICPAY").reduce((s, t) => s + Number(t.amount), 0);
  const bradescoTotal = filtered.filter(t => t.type === "expense" && t.payment_method === "BRADESCO").reduce((s, t) => s + Number(t.amount), 0);
  const pixTotal = filtered.filter(t => t.type === "expense" && t.payment_method === "PIX").reduce((s, t) => s + Number(t.amount), 0);

  const byCat = categories
    .filter(c => c.type === "expense")
    .map(c => ({ ...c, total: filtered.filter(t => t.category_id === c.id && t.type === "expense").reduce((s, t) => s + Number(t.amount), 0) }))
    .filter(c => c.total > 0)
    .sort((a, b) => b.total - a.total);

  function openAdd() {
    setEditTx(null);
    const first = categories.find(c => c.type === "expense");
    setForm({ description: "", amount: "", type: "expense", category_id: first?.id || "", date: today.toISOString().split("T")[0], notes: "", payment_method: "PICPAY" });
    setErr("");
    setModalOpen(true);
  }
  function openEdit(tx: TxFull) {
    setEditTx(tx);
    setForm({
      description: tx.description, amount: String(tx.amount),
      type: tx.type as "income" | "expense", category_id: tx.category_id || "",
      date: tx.date, notes: tx.notes || "", payment_method: tx.payment_method || "PICPAY",
    });
    setErr("");
    setModalOpen(true);
  }
  async function handleSave() {
    if (!form.description.trim()) { setErr("Informe a descrição"); return; }
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) { setErr("Informe um valor válido"); return; }
    setSaving(true); setErr("");
    try {
      const payload = {
        description: form.description.trim(), amount: Number(form.amount),
        type: form.type, category_id: form.category_id || null,
        date: form.date, notes: form.notes.trim() || null,
        payment_method: form.type === "expense" ? form.payment_method || null : null,
      };
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
  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        * { box-sizing: border-box; }
        body { margin: 0; background: #f0f2f5; font-family: 'Inter',system-ui,sans-serif; }
        .layout { display: flex; min-height: 100vh; }
        .sidebar { display: none; width: 240px; min-height: 100vh; background: #1a1a2e; flex-direction: column; padding: 28px 16px; position: fixed; top: 0; left: 0; bottom: 0; z-index: 30; }
        .sidebar-logo { font-size: 18px; font-weight: 800; color: #fff; padding: 0 8px; margin-bottom: 36px; letter-spacing: -0.5px; }
        .sidebar-logo span { color: #818cf8; }
        .sidebar-nav-item { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 14px; cursor: pointer; border: none; background: none; width: 100%; text-align: left; font-size: 14px; font-weight: 500; color: rgba(255,255,255,0.45); margin-bottom: 4px; transition: all 0.15s; }
        .sidebar-nav-item:hover { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.8); }
        .sidebar-nav-item.active { background: rgba(99,102,241,0.2); color: #a5b4fc; }
        .sidebar-nav-icon { font-size: 18px; width: 24px; text-align: center; }
        .sidebar-add-btn { margin-top: auto; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 14px; border-radius: 16px; border: none; background: linear-gradient(135deg,#6366f1,#8b5cf6); color: #fff; font-weight: 700; font-size: 14px; cursor: pointer; width: 100%; }
        .main { flex: 1; display: flex; flex-direction: column; }
        .topbar-header { background: linear-gradient(145deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%); padding: 28px 20px 32px; }
        .bottom-nav { position: fixed; bottom: 0; left: 0; right: 0; background: #fff; border-top: 1px solid #f0f2f5; display: flex; z-index: 40; padding-bottom: env(safe-area-inset-bottom); }
        .bottom-nav-item { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px; padding: 10px 0 8px; background: none; border: none; cursor: pointer; }
        .bottom-nav-icon { font-size: 20px; }
        .bottom-nav-label { font-size: 10px; font-weight: 600; letter-spacing: 0.2px; }
        .bottom-nav-dot { width: 4px; height: 4px; border-radius: 50%; background: #6366f1; }
        .fab { position: absolute; top: -22px; left: 50%; transform: translateX(-50%); width: 52px; height: 52px; border-radius: 18px; background: linear-gradient(135deg,#6366f1,#8b5cf6); border: 3px solid #f0f2f5; color: #fff; font-size: 26px; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 6px 20px rgba(99,102,241,0.45); z-index: 50; }
        .desktop-topbar { display: none; padding: 20px 32px 0; align-items: center; justify-content: space-between; }
        .desktop-topbar-title { font-size: 22px; font-weight: 800; color: #111; letter-spacing: -0.5px; }
        .desktop-add-btn { display: flex; align-items: center; gap: 8px; padding: 10px 20px; border-radius: 14px; border: none; background: linear-gradient(135deg,#6366f1,#8b5cf6); color: #fff; font-weight: 700; font-size: 14px; cursor: pointer; }
        .desktop-summary { display: none; padding: 20px 32px; gap: 16px; }
        .desktop-summary-card { flex: 1; border-radius: 20px; padding: 20px 24px; display: flex; flex-direction: column; gap: 6px; }
        .content-area { padding: 16px 16px 100px; }
        .period-nav { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
        .period-btn { border: none; background: rgba(255,255,255,0.1); color: #fff; width: 36px; height: 36px; border-radius: 12px; font-size: 18px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .card-badge { display: inline-flex; align-items: center; padding: 2px 7px; border-radius: 6px; font-size: 10px; font-weight: 700; letter-spacing: 0.3px; }
        @media (min-width: 768px) {
          .layout { padding-left: 240px; }
          .sidebar { display: flex; }
          .topbar-header { display: none; }
          .bottom-nav { display: none; }
          .desktop-topbar { display: flex; }
          .desktop-summary { display: flex; }
          .content-area { padding: 16px 32px 32px; max-width: 100%; }
          .period-btn { background: #f3f4f6; color: #374151; }
        }
      `}</style>

      <div className="layout">
        <aside className="sidebar">
          <div className="sidebar-logo">Minhas<span>Finanças</span></div>
          {NAV.map(n => (
            <button key={n.id} onClick={() => setTab(n.id)} className={`sidebar-nav-item${tab === n.id ? " active" : ""}`}>
              <span className="sidebar-nav-icon">{n.icon}</span>{n.label}
            </button>
          ))}
          <button onClick={openAdd} className="sidebar-add-btn">+ Novo lançamento</button>
        </aside>

        <main className="main">
          {/* Mobile header */}
          <div className="topbar-header">
            <div className="period-nav">
              <button onClick={prevMonth} className="period-btn">‹</button>
              <div style={{ textAlign: "center" }}>
                <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 2 }}>período</p>
                <p style={{ color: "#fff", fontSize: 15, fontWeight: 600 }}>{MONTHS[month]} {year}</p>
              </div>
              <button onClick={nextMonth} className="period-btn">›</button>
            </div>
            <div style={{ textAlign: "center", margin: "20px 0" }}>
              <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, marginBottom: 8 }}>Saldo do mês</p>
              {loading
                ? <div style={{ width: 160, height: 40, background: "rgba(255,255,255,0.08)", borderRadius: 12, margin: "0 auto" }} />
                : <p style={{ color: balance < 0 ? "#ff6b6b" : "#fff", fontSize: 36, fontWeight: 800, letterSpacing: -1.5, lineHeight: 1 }}>{fmt(balance)}</p>
              }
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <MiniCard label="Entradas" value={fmt(income)} color="#34d399" arrow="↑" />
              <MiniCard label="Saídas" value={fmt(expense)} color="#f87171" arrow="↓" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 10 }}>
              <CardStat label="PicPay" value={fmt(picpayTotal)} color="#059669" bg="rgba(5,150,105,0.12)" />
              <CardStat label="Bradesco" value={fmt(bradescoTotal)} color="#d97706" bg="rgba(217,119,6,0.12)" />
              <CardStat label="Pix" value={fmt(pixTotal)} color="#818cf8" bg="rgba(129,140,248,0.12)" />
            </div>
          </div>

          {/* Desktop top bar */}
          <div className="desktop-topbar">
            <div>
              <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 2 }}>{MONTHS[month]} {year}</p>
              <h1 className="desktop-topbar-title">{NAV.find(n => n.id === tab)?.label}</h1>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button onClick={prevMonth} style={{ padding: "8px 14px", borderRadius: 12, border: "1.5px solid #e5e7eb", background: "#fff", cursor: "pointer", fontSize: 16, color: "#374151" }}>‹</button>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#374151", minWidth: 120, textAlign: "center" }}>{MONTHS[month]} {year}</span>
              <button onClick={nextMonth} style={{ padding: "8px 14px", borderRadius: 12, border: "1.5px solid #e5e7eb", background: "#fff", cursor: "pointer", fontSize: 16, color: "#374151" }}>›</button>
              <button onClick={openAdd} className="desktop-add-btn">+ Adicionar</button>
            </div>
          </div>

          {/* Desktop summary cards */}
          <div className="desktop-summary">
            {[
              { label: "Saldo do mês", value: fmt(balance), bg: balance < 0 ? "#fff1f1" : "#f0fdf4", color: balance < 0 ? "#ef4444" : "#10b981", bold: true },
              { label: "Fatura PicPay", value: fmt(picpayTotal), bg: "#e6faf2", color: "#059669", bold: false },
              { label: "Fatura Bradesco", value: fmt(bradescoTotal), bg: "#fff7ed", color: "#d97706", bold: false },
              { label: "Pix / Débito", value: fmt(pixTotal), bg: "#f5f3ff", color: "#6366f1", bold: false },
            ].map(c => (
              <div key={c.label} className="desktop-summary-card" style={{ background: c.bg }}>
                <p style={{ fontSize: 12, color: "#6b7280" }}>{c.label}</p>
                <p style={{ fontSize: c.bold ? 24 : 20, fontWeight: 700, color: c.color }}>{c.value}</p>
              </div>
            ))}
          </div>

          <div className="content-area">
            {loading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: 48 }}>
                <div style={{ width: 32, height: 32, border: "3px solid #e5e7eb", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              </div>
            ) : (
              <>
                {tab === "home" && <HomeTab filtered={filtered} onEdit={openEdit} onAdd={openAdd} goTo={setTab} picpay={picpayTotal} bradesco={bradescoTotal} pix={pixTotal} income={income} expense={expense} />}
                {tab === "transactions" && <TransactionsTab txs={filtered} onEdit={openEdit} onDelete={setDeleteId} />}
                {tab === "reports" && <ReportsTab byCat={byCat} income={income} expense={expense} filtered={filtered} picpay={picpayTotal} bradesco={bradescoTotal} pix={pixTotal} month={month} year={year} allTransactions={transactions} />}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Bottom nav */}
      <nav className="bottom-nav">
        {NAV.map(n => (
          <button key={n.id} onClick={() => setTab(n.id)} className="bottom-nav-item">
            <span className="bottom-nav-icon" style={{ filter: tab === n.id ? "none" : "grayscale(1) opacity(.4)" }}>{n.icon}</span>
            <span className="bottom-nav-label" style={{ color: tab === n.id ? "#6366f1" : "#9ca3af" }}>{n.label}</span>
            {tab === n.id && <span className="bottom-nav-dot" />}
          </button>
        ))}
        <button onClick={openAdd} className="fab">+</button>
      </nav>

      {/* Modal */}
      {modalOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div onClick={() => setModalOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }} />
          <div style={{ position: "relative", background: "#fff", borderRadius: "24px 24px 0 0", width: "100%", maxWidth: 480, padding: "20px 24px 36px", maxHeight: "92vh", overflowY: "auto" }}>
            <div style={{ width: 36, height: 4, background: "#e5e7eb", borderRadius: 2, margin: "0 auto 20px" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111" }}>{editTx ? "Editar" : "Novo"} Lançamento</h2>
              <button onClick={() => setModalOpen(false)} style={{ background: "#f3f4f6", border: "none", width: 32, height: 32, borderRadius: 10, cursor: "pointer", fontSize: 15, color: "#6b7280" }}>✕</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
              <button onClick={() => setForm(f => ({ ...f, type: "expense", category_id: categories.find(c => c.type === "expense")?.id || "" }))} style={{ padding: "12px 0", borderRadius: 14, border: "2px solid", borderColor: form.type === "expense" ? "#f87171" : "#e5e7eb", background: form.type === "expense" ? "#fff1f1" : "#fff", color: form.type === "expense" ? "#ef4444" : "#9ca3af", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>↓ Saída</button>
              <button onClick={() => setForm(f => ({ ...f, type: "income", category_id: categories.find(c => c.type === "income")?.id || "" }))} style={{ padding: "12px 0", borderRadius: 14, border: "2px solid", borderColor: form.type === "income" ? "#34d399" : "#e5e7eb", background: form.type === "income" ? "#f0fdf4" : "#fff", color: form.type === "income" ? "#10b981" : "#9ca3af", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>↑ Entrada</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Field label="Descrição"><input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Ex: Mercado, Salário..." style={inputStyle} /></Field>
              <Field label="Valor (R$)"><input type="number" min="0" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0,00" style={inputStyle} /></Field>
              {form.type === "expense" && (
                <Field label="Forma de pagamento">
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                    {["PICPAY", "BRADESCO", "PIX"].map(m => {
                      const c = CARD_COLORS[m];
                      const active = form.payment_method === m;
                      return (
                        <button key={m} onClick={() => setForm(f => ({ ...f, payment_method: m }))} style={{ padding: "10px 0", borderRadius: 12, border: `2px solid ${active ? c.color : "#e5e7eb"}`, background: active ? c.bg : "#fff", color: active ? c.color : "#9ca3af", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                          {c.label}
                        </button>
                      );
                    })}
                  </div>
                </Field>
              )}
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

      {/* Delete confirm */}
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
    </>
  );
}

/* ── Tabs ── */

function HomeTab({ filtered, onEdit, onAdd, goTo, picpay, bradesco, pix, income, expense }: {
  filtered: TxFull[]; onEdit: (tx: TxFull) => void; onAdd: () => void;
  goTo: (t: Tab) => void; picpay: number; bradesco: number; pix: number; income: number; expense: number;
}) {
  const recent = filtered.slice(0, 6);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Card>
        <SectionHeader title="Faturas do mês" />
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { key: "PICPAY", label: "PicPay", value: picpay, bg: CARD_COLORS.PICPAY.bg, color: CARD_COLORS.PICPAY.color },
            { key: "BRADESCO", label: "Bradesco", value: bradesco, bg: CARD_COLORS.BRADESCO.bg, color: CARD_COLORS.BRADESCO.color },
            { key: "PIX", label: "Pix / Débito", value: pix, bg: CARD_COLORS.PIX.bg, color: CARD_COLORS.PIX.color },
          ].map(({ key, label, value, bg, color }) => (
            <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderRadius: 14, background: bg }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 34, height: 34, borderRadius: 10, background: color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                  {key === "PICPAY" ? "💚" : key === "BRADESCO" ? "🟠" : "⚡"}
                </span>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>{label}</p>
                  {expense > 0 && <p style={{ fontSize: 11, color: "#9ca3af" }}>{((value / expense) * 100).toFixed(0)}% dos gastos</p>}
                </div>
              </div>
              <p style={{ fontSize: 15, fontWeight: 700, color }}>{fmt(value)}</p>
            </div>
          ))}
        </div>
        {expense > 0 && (
          <div style={{ marginTop: 12, height: 8, borderRadius: 8, overflow: "hidden", display: "flex" }}>
            {[
              { v: picpay, c: "#059669" },
              { v: bradesco, c: "#d97706" },
              { v: pix, c: "#4f46e5" },
            ].filter(s => s.v > 0).map((s, i) => (
              <div key={i} style={{ width: `${(s.v / expense) * 100}%`, background: s.c, transition: "width 0.8s ease" }} />
            ))}
          </div>
        )}
        {income > 0 && (
          <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 12, background: "#f9fafb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, color: "#6b7280" }}>Comprometimento da renda</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: expense / income > 0.8 ? "#ef4444" : expense / income > 0.6 ? "#d97706" : "#10b981" }}>
              {((expense / income) * 100).toFixed(0)}%
            </span>
          </div>
        )}
      </Card>

      {recent.length === 0 ? (
        <Card>
          <Empty />
          <button onClick={onAdd} style={{ display: "block", margin: "16px auto 0", padding: "12px 28px", borderRadius: 14, border: "none", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>+ Adicionar primeiro lançamento</button>
        </Card>
      ) : (
        <Card>
          <SectionHeader title="Lançamentos recentes" action={{ label: "Ver todos", onClick: () => goTo("transactions") }} />
          {recent.map(tx => <TxItem key={tx.id} tx={tx} onEdit={onEdit} />)}
        </Card>
      )}
    </div>
  );
}

function TransactionsTab({ txs, onEdit, onDelete }: { txs: TxFull[]; onEdit: (tx: TxFull) => void; onDelete: (id: string) => void }) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");
  const [cardFilter, setCardFilter] = useState<CardFilter>("all");

  const items = txs.filter(tx => {
    if (typeFilter !== "all" && tx.type !== typeFilter) return false;
    if (cardFilter !== "all" && tx.payment_method !== cardFilter) return false;
    if (!tx.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Card>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍  Buscar..." style={{ ...inputStyle, background: "#f3f4f6", border: "none", marginBottom: 10 }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 8 }}>
          {(["all", "income", "expense"] as const).map(f => (
            <button key={f} onClick={() => setTypeFilter(f)} style={{ padding: "8px 0", borderRadius: 10, border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer", background: typeFilter === f ? "#1a1a2e" : "#f3f4f6", color: typeFilter === f ? "#fff" : "#6b7280" }}>
              {f === "all" ? "Todos" : f === "income" ? "Entradas" : "Saídas"}
            </button>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6 }}>
          {(["all", "PICPAY", "BRADESCO", "PIX"] as const).map(f => {
            const active = cardFilter === f;
            const c = f !== "all" ? CARD_COLORS[f] : null;
            return (
              <button key={f} onClick={() => setCardFilter(f)} style={{ padding: "7px 0", borderRadius: 10, border: `1.5px solid ${active && c ? c.color : active ? "#1a1a2e" : "#e5e7eb"}`, fontSize: 11, fontWeight: 700, cursor: "pointer", background: active ? (c ? c.bg : "#1a1a2e") : "#fff", color: active ? (c ? c.color : "#fff") : "#9ca3af" }}>
                {f === "all" ? "Todos" : f === "PICPAY" ? "PicPay" : f === "BRADESCO" ? "Bradesco" : "Pix"}
              </button>
            );
          })}
        </div>
      </Card>
      {items.length === 0
        ? <Card><Empty /></Card>
        : <Card>{items.map(tx => <TxItem key={tx.id} tx={tx} onEdit={onEdit} onDelete={onDelete} />)}</Card>
      }
    </div>
  );
}

function ReportsTab({ byCat, income, expense, filtered, picpay, bradesco, pix, month, year, allTransactions }: {
  byCat: (Category & { total: number })[]; income: number; expense: number;
  filtered: TxFull[]; picpay: number; bradesco: number; pix: number;
  month: number; year: number; allTransactions: TxFull[];
}) {
  const today = new Date();
  const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;
  const day = isCurrentMonth ? today.getDate() : new Date(year, month + 1, 0).getDate();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dailyRate = day > 0 ? expense / day : 0;
  const projected = isCurrentMonth ? dailyRate * daysInMonth : expense;
  const savings = income > 0 ? ((income - expense) / income) * 100 : 0;
  const expTxs = filtered.filter(t => t.type === "expense");
  const avgTx = expTxs.length > 0 ? expense / expTxs.length : 0;

  // Monthly trend — last 5 months from current
  const monthlyData = (() => {
    const result: { key: string; label: string; picpay: number; bradesco: number; pix: number; other: number; income: number; total: number }[] = [];
    for (let i = 4; i >= 0; i--) {
      let m = month - i;
      let y = year;
      while (m < 0) { m += 12; y--; }
      const key = `${y}-${String(m + 1).padStart(2, "0")}`;
      const mTxs = allTransactions.filter(tx => tx.date.startsWith(key));
      const pp = mTxs.filter(t => t.type === "expense" && t.payment_method === "PICPAY").reduce((s, t) => s + Number(t.amount), 0);
      const br = mTxs.filter(t => t.type === "expense" && t.payment_method === "BRADESCO").reduce((s, t) => s + Number(t.amount), 0);
      const px = mTxs.filter(t => t.type === "expense" && t.payment_method === "PIX").reduce((s, t) => s + Number(t.amount), 0);
      const other = mTxs.filter(t => t.type === "expense" && !t.payment_method).reduce((s, t) => s + Number(t.amount), 0);
      const inc = mTxs.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
      result.push({ key, label: MONTHS_SHORT[m], picpay: pp, bradesco: br, pix: px, other, income: inc, total: pp + br + px + other });
    }
    return result;
  })();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* Tendência mensal */}
      <Card>
        <SectionHeader title="Tendência dos últimos meses" />
        <MonthlyBarsChart data={monthlyData} />
        <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
          {[
            { color: "#059669", label: "PicPay" },
            { color: "#d97706", label: "Bradesco" },
            { color: "#4f46e5", label: "Pix/Débito" },
            { color: "#10b981", label: "Entradas", dashed: true },
          ].map(({ color, label, dashed }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              {dashed
                ? <svg width="24" height="3"><line x1="0" y1="1.5" x2="24" y2="1.5" stroke={color} strokeWidth="2" strokeDasharray="4,2" /></svg>
                : <div style={{ width: 24, height: 3, borderRadius: 2, background: color }} />
              }
              <span style={{ fontSize: 11, color: "#6b7280" }}>{label}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Por cartão */}
      <Card>
        <SectionHeader title="Por cartão / forma de pagamento" />
        {expense > 0 && (
          <div style={{ height: 10, borderRadius: 8, overflow: "hidden", display: "flex", marginBottom: 16 }}>
            {[
              { v: picpay, c: "#059669" },
              { v: bradesco, c: "#d97706" },
              { v: pix, c: "#4f46e5" },
            ].filter(s => s.v > 0).map((s, i) => (
              <div key={i} style={{ width: `${(s.v / expense) * 100}%`, background: s.c, transition: "width 0.8s ease" }} />
            ))}
          </div>
        )}
        {[
          { label: "PicPay", value: picpay, icon: "💚", bg: CARD_COLORS.PICPAY.bg, color: CARD_COLORS.PICPAY.color, txCount: filtered.filter(t => t.payment_method === "PICPAY").length },
          { label: "Bradesco", value: bradesco, icon: "🟠", bg: CARD_COLORS.BRADESCO.bg, color: CARD_COLORS.BRADESCO.color, txCount: filtered.filter(t => t.payment_method === "BRADESCO").length },
          { label: "Pix / Débito", value: pix, icon: "⚡", bg: CARD_COLORS.PIX.bg, color: CARD_COLORS.PIX.color, txCount: filtered.filter(t => t.payment_method === "PIX").length },
        ].map(({ label, value, icon, bg, color, txCount }) => (
          <div key={label} style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 30, height: 30, borderRadius: 9, background: bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>{icon}</span>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>{label}</p>
                  <p style={{ fontSize: 11, color: "#9ca3af" }}>{txCount} lançamento{txCount !== 1 ? "s" : ""} · {expense > 0 ? ((value / expense) * 100).toFixed(0) : 0}%</p>
                </div>
              </div>
              <p style={{ fontSize: 14, fontWeight: 700, color }}>{fmt(value)}</p>
            </div>
            <div style={{ height: 5, background: "#f3f4f6", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ height: "100%", background: color, width: expense > 0 ? `${(value / expense) * 100}%` : "0%", borderRadius: 4, transition: "width 0.8s ease" }} />
            </div>
          </div>
        ))}
      </Card>

      {/* Gastos por categoria — donut + lista */}
      {byCat.length > 0 && (
        <Card>
          <SectionHeader title="Gastos por categoria" />
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <DonutChart
              slices={byCat.slice(0, 6).map(c => ({ value: c.total, color: c.color, label: c.name }))}
              total={expense}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              {byCat.slice(0, 6).map((c, i) => (
                <div key={c.id} style={{ marginBottom: i < Math.min(byCat.length, 6) - 1 ? 10 : 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: c.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.icon} {c.name}</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#111", whiteSpace: "nowrap", marginLeft: 8 }}>{fmt(c.total)}</span>
                  </div>
                  <div style={{ height: 4, background: "#f3f4f6", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", background: c.color, width: `${(c.total / byCat[0].total) * 100}%`, transition: "width 0.8s ease" }} />
                  </div>
                </div>
              ))}
              {byCat.length > 6 && (
                <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 8 }}>+ {byCat.length - 6} outras categorias</p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Projeção */}
      {isCurrentMonth && (
        <Card>
          <SectionHeader title="Projeção do mês" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { label: "Gasto médio/dia", value: fmt(dailyRate), color: "#374151" },
              { label: "Projeção de gastos", value: fmt(projected), color: "#374151" },
              { label: "Saldo estimado", value: fmt(income - projected), color: income - projected < 0 ? "#ef4444" : "#10b981" },
              { label: "Taxa de economia", value: `${savings.toFixed(1)}%`, color: savings < 0 ? "#ef4444" : "#10b981" },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: "#f9fafb", borderRadius: 14, padding: 14 }}>
                <p style={{ fontSize: 11, color: "#9ca3af", marginBottom: 5 }}>{label}</p>
                <p style={{ fontSize: 16, fontWeight: 700, color }}>{value}</p>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 11, color: "#d1d5db", marginTop: 10 }}>Baseado nos {day} de {daysInMonth} dias do mês</p>
        </Card>
      )}

      {/* Resumo geral */}
      <Card>
        <SectionHeader title="Resumo geral" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            { label: "Total entradas", value: fmt(income), color: "#10b981", bg: "#f0fdf4" },
            { label: "Total saídas", value: fmt(expense), color: "#ef4444", bg: "#fff1f1" },
            { label: "Nº lançamentos", value: String(filtered.length), color: "#6366f1", bg: "#f5f3ff" },
            { label: "Gasto médio/item", value: fmt(avgTx), color: "#d97706", bg: "#fefce8" },
          ].map(({ label, value, color, bg }) => (
            <div key={label} style={{ background: bg, borderRadius: 14, padding: 14 }}>
              <p style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>{label}</p>
              <p style={{ fontSize: 16, fontWeight: 700, color }}>{value}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ── Chart components ── */

function DonutChart({ slices, total }: { slices: { value: number; color: string; label: string }[]; total: number }) {
  const R = 54; const r = 34; const cx = 70; const cy = 70;
  let angle = -Math.PI / 2;
  const active = slices.filter(s => s.value > 0);

  const paths = active.map(s => {
    const sweep = total > 0 ? (s.value / total) * 2 * Math.PI : 0;
    const x1 = cx + R * Math.cos(angle);
    const y1 = cy + R * Math.sin(angle);
    angle += sweep;
    const x2 = cx + R * Math.cos(angle);
    const y2 = cy + R * Math.sin(angle);
    const large = sweep > Math.PI ? 1 : 0;
    return { path: `M${cx},${cy}L${x1.toFixed(1)},${y1.toFixed(1)}A${R},${R},0,${large},1,${x2.toFixed(1)},${y2.toFixed(1)}Z`, color: s.color };
  });

  return (
    <svg viewBox="0 0 140 140" style={{ width: 130, height: 130, flexShrink: 0 }}>
      {paths.length === 0
        ? <circle cx={cx} cy={cy} r={R} fill="#f3f4f6" />
        : paths.map((p, i) => <path key={i} d={p.path} fill={p.color} />)
      }
      <circle cx={cx} cy={cy} r={r} fill="#fff" />
      <text x={cx} y={cy - 5} textAnchor="middle" fontSize="9" fill="#9ca3af">total</text>
      <text x={cx} y={cy + 11} textAnchor="middle" fontSize="11" fontWeight="700" fill="#111">
        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(total)}
      </text>
    </svg>
  );
}

function MonthlyBarsChart({ data }: { data: { label: string; picpay: number; bradesco: number; pix: number; other: number; income: number; total: number }[] }) {
  const W = 300; const H = 160;
  const PAD = { top: 16, right: 8, bottom: 28, left: 8 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;
  const maxVal = Math.max(...data.map(d => Math.max(d.total, d.income)), 1);
  const n = data.length;
  const slot = chartW / n;
  const barW = slot * 0.55;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto" }}>
      {/* Grid lines */}
      {[0.25, 0.5, 0.75, 1].map(p => {
        const y = PAD.top + chartH * (1 - p);
        return <line key={p} x1={PAD.left} x2={W - PAD.right} y1={y} y2={y} stroke="#f3f4f6" strokeWidth="1" />;
      })}

      {data.map((d, i) => {
        const cx = PAD.left + slot * i + slot / 2;
        const x = cx - barW / 2;
        const isLast = i === data.length - 1;

        const segments = [
          { v: d.picpay, c: "#059669" },
          { v: d.bradesco, c: "#d97706" },
          { v: d.pix, c: "#4f46e5" },
          { v: d.other, c: "#9ca3af" },
        ].filter(s => s.v > 0);

        let curY = PAD.top + chartH;
        const bars = segments.map(seg => {
          const h = (seg.v / maxVal) * chartH;
          curY -= h;
          return <rect key={seg.c} x={x} y={curY} width={barW} height={h} fill={seg.c} rx={i === 0 ? 0 : 2} />;
        });

        // Income dot/line
        const incY = PAD.top + chartH * (1 - d.income / maxVal);

        return (
          <g key={d.label}>
            {bars}
            {/* Bar rounded top */}
            {d.total > 0 && <rect x={x} y={PAD.top + chartH - (d.total / maxVal) * chartH} width={barW} height={4} fill={segments[segments.length - 1]?.c || "#9ca3af"} rx="2" />}
            {/* Income dot */}
            {d.income > 0 && <circle cx={cx} cy={incY} r={3} fill="#10b981" />}
            {/* Income line segment to next */}
            {d.income > 0 && i < data.length - 1 && data[i + 1].income > 0 && (
              <line
                x1={cx} y1={incY}
                x2={PAD.left + slot * (i + 1) + slot / 2}
                y2={PAD.top + chartH * (1 - data[i + 1].income / maxVal)}
                stroke="#10b981" strokeWidth="1.5" strokeDasharray="3,2"
              />
            )}
            {/* Current month highlight */}
            {isLast && <rect x={x - 2} y={PAD.top} width={barW + 4} height={chartH} fill="rgba(99,102,241,0.04)" rx="3" />}
            {/* X label */}
            <text x={cx} y={H - PAD.bottom + 14} textAnchor="middle" fontSize="9" fill={isLast ? "#6366f1" : "#9ca3af"} fontWeight={isLast ? "700" : "400"}>{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

/* ── Base components ── */

function CardStat({ label, value, color, bg }: { label: string; value: string; color: string; bg: string }) {
  return (
    <div style={{ background: bg, borderRadius: 12, padding: "10px 12px", textAlign: "center" }}>
      <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 9, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>{label}</p>
      <p style={{ color, fontSize: 12, fontWeight: 700 }}>{value}</p>
    </div>
  );
}

function MiniCard({ label, value, color, arrow }: { label: string; value: string; color: string; arrow: string }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: 16, padding: "14px 16px", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
        <span style={{ width: 22, height: 22, borderRadius: 7, background: color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>{arrow}</span>
        <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, textTransform: "uppercase", letterSpacing: 0.8 }}>{label}</span>
      </div>
      <p style={{ color, fontSize: 17, fontWeight: 700 }}>{value}</p>
    </div>
  );
}

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
  const card = tx.payment_method ? CARD_COLORS[tx.payment_method] : null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid #f3f4f6" }}>
      <div style={{ width: 42, height: 42, borderRadius: 14, background: (tx.categories?.color || "#6b7280") + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
        {tx.categories?.icon || "📦"}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: "#111", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tx.description}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
          <span style={{ fontSize: 12, color: "#9ca3af" }}>{tx.categories?.name || "Sem categoria"} · {fmtDate(tx.date)}</span>
          {card && (
            <span className="card-badge" style={{ background: card.bg, color: card.color }}>
              {tx.payment_method === "PICPAY" ? "PicPay" : tx.payment_method === "BRADESCO" ? "Bradesco" : "Pix"}
            </span>
          )}
        </div>
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
      <p style={{ fontSize: 12, color: "#d1d5db", marginTop: 4 }}>Clique em + para adicionar</p>
    </div>
  );
}

const inputStyle: React.CSSProperties = { width: "100%", padding: "13px 14px", borderRadius: 14, border: "1.5px solid #e5e7eb", fontSize: 14, outline: "none", background: "#f9fafb", color: "#111", fontFamily: "inherit" };
