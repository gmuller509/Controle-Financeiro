"use client";

import { useState } from "react";
import Image from "next/image";

const personalities = [
  {
    id: "bold",
    name: "Bold Adventurer",
    drink: "Espresso Duplo",
    tagline: "Você vive pela intensidade",
    image: "/bold-adventurer.jpg",
    color: "#c8824a",
    emoji: "🔥",
  },
  {
    id: "sweet",
    name: "Sweet Enthusiast",
    drink: "Latte de Caramelo",
    tagline: "A vida é curta demais para o amargo",
    image: "/sweet-enthusiast.jpg",
    color: "#d4956a",
    emoji: "🍭",
  },
  {
    id: "zen",
    name: "Zen Minimalist",
    drink: "Café Preto, Single Origin",
    tagline: "Simples. Limpo. Perfeito.",
    image: "/zen-minimalist.jpg",
    color: "#7a6652",
    emoji: "🧘",
  },
  {
    id: "social",
    name: "Social Butterfly",
    drink: "Cappuccino",
    tagline: "Café é melhor acompanhado",
    image: "/social-butterfly.jpg",
    color: "#b87333",
    emoji: "🦋",
  },
  {
    id: "indulgent",
    name: "Indulgent Treat",
    drink: "Mocha com Chantilly",
    tagline: "Café é sobremesa",
    image: "/indulgent-treat.jpg",
    color: "#a0522d",
    emoji: "🍫",
  },
];

const questions = [
  {
    text: "Como você começa a sua manhã?",
    options: [
      { emoji: "🏃", text: "Academia ou corrida antes de tudo", personality: "bold" },
      { emoji: "🎵", text: "Música alta e bom humor", personality: "sweet" },
      { emoji: "🛁", text: "Banho longo e calma total", personality: "zen" },
      { emoji: "📱", text: "Redes sociais na cama", personality: "social" },
      { emoji: "☕", text: "Café na mão, série ligada", personality: "indulgent" },
    ],
  },
  {
    text: "Seu fim de semana ideal é:",
    options: [
      { emoji: "🏔️", text: "Trilha, praia ou aventura ao ar livre", personality: "bold" },
      { emoji: "🛍️", text: "Compras, cafés e passeios", personality: "sweet" },
      { emoji: "🏡", text: "Em casa, sem compromisso", personality: "zen" },
      { emoji: "🎉", text: "Sair com amigos e família", personality: "social" },
      { emoji: "🍕", text: "Delivery, sofá e conforto total", personality: "indulgent" },
    ],
  },
  {
    text: "Na hora de escolher um restaurante, você:",
    options: [
      { emoji: "🌶️", text: "Quer o cardápio mais ousado", personality: "bold" },
      { emoji: "📸", text: "Escolhe o mais instagramável", personality: "sweet" },
      { emoji: "🔍", text: "Pesquisa muito antes de decidir", personality: "zen" },
      { emoji: "🗣️", text: "Vai no que todo mundo indica", personality: "social" },
      { emoji: "🛋️", text: "Prioriza o mais confortável e gostoso", personality: "indulgent" },
    ],
  },
  {
    text: "Sua mochila ou bolsa geralmente tem:",
    options: [
      { emoji: "💧", text: "Garrafa de água e lanche", personality: "bold" },
      { emoji: "💄", text: "Maquiagem, perfume, o essencial bonito", personality: "sweet" },
      { emoji: "🎧", text: "Fone, celular carregado e nada mais", personality: "zen" },
      { emoji: "📅", text: "Agenda cheia de encontros com amigos", personality: "social" },
      { emoji: "🎒", text: "Mil coisas \"por precaução\"", personality: "indulgent" },
    ],
  },
  {
    text: "Quando você está estressado, você:",
    options: [
      { emoji: "🏋️", text: "Sai para se exercitar", personality: "bold" },
      { emoji: "📺", text: "Assiste algo divertido", personality: "sweet" },
      { emoji: "🧘", text: "Faz silêncio e respira", personality: "zen" },
      { emoji: "📞", text: "Liga para um amigo", personality: "social" },
      { emoji: "🍫", text: "Come algo gostoso", personality: "indulgent" },
    ],
  },
];

type Phase = "intro" | "quiz" | "results";

export default function Home() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (personalityId: string) => {
    setSelected(personalityId);
  };

  const handleNext = () => {
    if (!selected) return;
    const newAnswers = [...answers, selected];
    if (currentQ < questions.length - 1) {
      setAnswers(newAnswers);
      setCurrentQ(currentQ + 1);
      setSelected(null);
    } else {
      setAnswers(newAnswers);
      setPhase("results");
    }
  };

  const calculateResults = () => {
    const counts: Record<string, number> = {};
    answers.forEach((a) => {
      counts[a] = (counts[a] || 0) + 1;
    });
    return personalities
      .map((p) => ({
        ...p,
        count: counts[p.id] || 0,
        percent: Math.round(((counts[p.id] || 0) / answers.length) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  };

  const restart = () => {
    setPhase("intro");
    setCurrentQ(0);
    setAnswers([]);
    setSelected(null);
  };

  if (phase === "intro") {
    return (
      <div style={styles.bg}>
        <div style={styles.card}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>☕</div>
          <div style={styles.brand}>BASECAMP COFFEE</div>
          <h1 style={styles.introTitle}>Qual é a sua personalidade de café?</h1>
          <p style={styles.introSub}>
            Responda 5 perguntas rápidas e descubra qual bebida combina com o seu jeito de ser.
          </p>
          <button style={styles.btnPrimary} onClick={() => setPhase("quiz")}>
            Começar o quiz →
          </button>
          <p style={styles.introHint}>5 perguntas · menos de 2 minutos</p>
        </div>
      </div>
    );
  }

  if (phase === "quiz") {
    const q = questions[currentQ];

    return (
      <div style={styles.bg}>
        <div style={styles.card}>
          <div style={styles.progressRow}>
            {questions.map((_, i) => (
              <div
                key={i}
                style={{
                  ...styles.dot,
                  background:
                    i < currentQ ? "#a0724a" : i === currentQ ? "#c8824a" : "#e8d5b7",
                }}
              />
            ))}
          </div>
          <div style={styles.qNum}>Pergunta {currentQ + 1} de {questions.length}</div>
          <h2 style={styles.qText}>{q.text}</h2>
          <div style={styles.options}>
            {q.options.map((opt) => (
              <button
                key={opt.personality}
                style={{
                  ...styles.option,
                  ...(selected === opt.personality ? styles.optionSelected : {}),
                }}
                onClick={() => handleSelect(opt.personality)}
              >
                <span style={styles.optEmoji}>{opt.emoji}</span>
                <span>{opt.text}</span>
              </button>
            ))}
          </div>
          <div style={styles.footer}>
            {currentQ > 0 ? (
              <button
                style={styles.btnBack}
                onClick={() => {
                  setAnswers(answers.slice(0, currentQ - 1));
                  setCurrentQ(currentQ - 1);
                  setSelected(answers[currentQ - 1] || null);
                }}
              >
                ← Anterior
              </button>
            ) : (
              <span />
            )}
            <button
              style={{
                ...styles.btnPrimary,
                opacity: selected ? 1 : 0.4,
                cursor: selected ? "pointer" : "not-allowed",
                margin: 0,
              }}
              onClick={handleNext}
              disabled={!selected}
            >
              {currentQ < questions.length - 1 ? "Próxima →" : "Ver resultado →"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const results = calculateResults();
  const top = results[0];
  const secondary = results.slice(1).filter((p) => p.percent > 0);

  return (
    <div style={styles.bg}>
      <div className="result-enter" style={{ ...styles.card, maxWidth: 580, padding: 0, overflow: "hidden" }}>

        <div style={{ position: "relative", height: 260, width: "100%" }}>
          <Image src={top.image} alt={top.drink} fill style={{ objectFit: "cover" }} priority />
          <div style={styles.heroOverlay} />
          <div style={styles.heroContent}>
            <div style={styles.brand}>SEU RESULTADO</div>
            <div style={{ fontSize: 40, margin: "4px 0" }}>{top.emoji}</div>
            <h1 style={styles.heroTitle}>{top.name}</h1>
            <div style={styles.heroDrink}>☕ {top.drink}</div>
          </div>
        </div>

        <div style={styles.taglineBanner}>
          <span style={{ color: top.color, fontWeight: 900 }}>"</span>
          {top.tagline}
          <span style={{ color: top.color, fontWeight: 900 }}>"</span>
        </div>

        <div style={styles.topPercentRow}>
          <span style={styles.topPercentLabel}>Sua personalidade dominante</span>
          <span style={{ ...styles.resultPct, color: top.color, fontSize: 18 }}>{top.percent}%</span>
        </div>
        <div style={{ ...styles.barWrap, margin: "0 28px 24px", height: 12 }}>
          <div className="bar-animated" style={{ ...styles.barFill, width: `${top.percent}%`, background: top.color }} />
        </div>

        {secondary.length > 0 && (
          <div style={styles.secondarySection}>
            <div style={styles.sectionTitle}>Também tem um pouco de...</div>
            <div style={styles.secondaryGrid}>
              {secondary.map((p) => (
                <div key={p.id} style={styles.secondaryCard}>
                  <div style={styles.secondaryImgWrap}>
                    <Image src={p.image} alt={p.drink} fill style={{ objectFit: "cover" }} />
                    <div style={{ ...styles.secondaryOverlay, background: p.color + "99" }} />
                    <span style={styles.secondaryEmoji}>{p.emoji}</span>
                  </div>
                  <div style={styles.secondaryName}>{p.name}</div>
                  <div style={{ ...styles.resultPct, color: p.color, fontSize: 13 }}>{p.percent}%</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ padding: "0 28px 32px" }}>
          <button style={{ ...styles.btnPrimary, width: "100%", margin: 0 }} onClick={restart}>
            Refazer o quiz
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  bg: {
    minHeight: "100vh",
    background: "linear-gradient(160deg, #f5ebe0 0%, #e8d5b7 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 16px",
    fontFamily: "'Nunito', sans-serif",
  },
  card: {
    background: "#fffbf5",
    borderRadius: 24,
    padding: "44px 40px",
    maxWidth: 560,
    width: "100%",
    boxShadow: "0 8px 40px rgba(139,90,43,0.14)",
    border: "1px solid #f0e0c8",
  },
  brand: {
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: 3,
    color: "#a0724a",
    textTransform: "uppercase" as const,
    marginBottom: 8,
  },
  introTitle: {
    fontSize: 28,
    fontWeight: 900,
    color: "#3d2b1f",
    lineHeight: 1.3,
    margin: "12px 0 16px",
  },
  introSub: {
    fontSize: 16,
    color: "#a08060",
    lineHeight: 1.6,
    marginBottom: 32,
  },
  introHint: {
    fontSize: 13,
    color: "#c4a882",
    marginTop: 12,
    textAlign: "center" as const,
  },
  btnPrimary: {
    background: "#c8824a",
    color: "white",
    border: "none",
    borderRadius: 12,
    padding: "16px 36px",
    fontSize: 16,
    fontWeight: 900,
    cursor: "pointer",
    fontFamily: "'Nunito', sans-serif",
    display: "block",
    margin: "0 auto",
    transition: "opacity 0.15s",
  },
  progressRow: {
    display: "flex",
    gap: 8,
    marginBottom: 28,
  },
  dot: {
    height: 8,
    flex: 1,
    borderRadius: 8,
    transition: "background 0.3s",
  },
  qNum: {
    fontSize: 12,
    fontWeight: 900,
    color: "#a0724a",
    textTransform: "uppercase" as const,
    letterSpacing: 2,
    marginBottom: 10,
  },
  qText: {
    fontSize: 22,
    fontWeight: 900,
    color: "#3d2b1f",
    lineHeight: 1.3,
    marginBottom: 24,
  },
  options: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  },
  option: {
    background: "#fdf6ed",
    border: "1.5px solid #e8d5b7",
    borderRadius: 14,
    padding: "16px 14px",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 700,
    color: "#5a3e2b",
    transition: "all 0.15s",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: 8,
    textAlign: "center" as const,
    fontFamily: "'Nunito', sans-serif",
    lineHeight: 1.3,
  },
  optionSelected: {
    borderColor: "#c8824a",
    background: "#c8824a",
    color: "white",
  },
  optEmoji: {
    fontSize: 26,
  },
  footer: {
    marginTop: 28,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  btnBack: {
    background: "none",
    border: "none",
    color: "#c4a882",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "'Nunito', sans-serif",
  },
  heroOverlay: {
    position: "absolute" as const,
    inset: 0,
    background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.1) 60%)",
  },
  heroContent: {
    position: "absolute" as const,
    bottom: 20,
    left: 28,
    right: 28,
    color: "white",
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: 900,
    color: "white",
    lineHeight: 1.2,
    margin: "4px 0",
  },
  heroDrink: {
    fontSize: 15,
    fontWeight: 700,
    color: "rgba(255,255,255,0.85)",
  },
  taglineBanner: {
    padding: "16px 28px",
    fontSize: 16,
    color: "#5a3e2b",
    fontStyle: "italic",
    borderBottom: "1px solid #f0e0c8",
    lineHeight: 1.5,
    background: "#fffbf5",
  },
  topPercentRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 28px 8px",
    background: "#fffbf5",
  },
  topPercentLabel: {
    fontSize: 12,
    fontWeight: 900,
    color: "#c4a882",
    textTransform: "uppercase" as const,
    letterSpacing: 1,
  },
  secondarySection: {
    padding: "0 28px 24px",
    background: "#fffbf5",
  },
  secondaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))",
    gap: 12,
    marginTop: 12,
  },
  secondaryCard: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: 6,
  },
  secondaryImgWrap: {
    position: "relative" as const,
    width: "100%",
    aspectRatio: "1",
    borderRadius: 14,
    overflow: "hidden",
  },
  secondaryOverlay: {
    position: "absolute" as const,
    inset: 0,
  },
  secondaryEmoji: {
    position: "absolute" as const,
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    fontSize: 28,
  },
  secondaryName: {
    fontSize: 11,
    fontWeight: 900,
    color: "#5a3e2b",
    textAlign: "center" as const,
    lineHeight: 1.3,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 900,
    color: "#c4a882",
    textTransform: "uppercase" as const,
    letterSpacing: 1,
    marginBottom: 16,
  },
  barWrap: {
    height: 8,
    background: "#f0e0c8",
    borderRadius: 8,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 8,
    transition: "width 0.8s ease",
  },
  resultPct: {
    fontSize: 14,
    fontWeight: 900,
    width: 36,
    textAlign: "right" as const,
  },
};
