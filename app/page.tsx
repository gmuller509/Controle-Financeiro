"use client";

import { useState } from "react";
import Image from "next/image";

const personalities = [
  {
    id: "bold",
    name: "Bold Adventurer",
    drink: "Double Espresso",
    tagline: "Você vive pela intensidade",
    image: "/espresso.jpg",
    color: "#FF6B6B",
    emoji: "🔥",
  },
  {
    id: "cozy",
    name: "Cozy Classic",
    drink: "Medium Roast Drip",
    tagline: "Conforto em cada xícara",
    image: "/drip-coffee.jpg",
    color: "#C8A96E",
    emoji: "🧣",
  },
  {
    id: "sweet",
    name: "Sweet Enthusiast",
    drink: "Caramel Latte",
    tagline: "A vida é curta demais pro amargo",
    image: "/caramel-latte.jpg",
    color: "#FF9FD8",
    emoji: "🍭",
  },
  {
    id: "zen",
    name: "Zen Minimalist",
    drink: "Black Coffee, Single Origin",
    tagline: "Simples. Limpo. Perfeito.",
    image: "/black-coffee.jpg",
    color: "#4ECDC4",
    emoji: "🧘",
  },
  {
    id: "social",
    name: "Social Butterfly",
    drink: "Cappuccino",
    tagline: "Café é melhor em companhia",
    image: "/cappuccino.jpg",
    color: "#FFE66D",
    emoji: "🦋",
  },
  {
    id: "night",
    name: "Night Owl",
    drink: "Red Eye",
    tagline: "Dormir é opcional",
    image: "/red-eye.jpg",
    color: "#A78BFA",
    emoji: "🌙",
  },
];

const questions = [
  {
    text: "Se você fosse um personagem de série, qual seria?",
    options: [
      { emoji: "🔥", text: "Joel Miller — sobrevivente, intenso, age primeiro", personality: "bold" },
      { emoji: "🧣", text: "Lorelai Gilmore — café na veia, confortável em casa", personality: "cozy" },
      { emoji: "🍭", text: "Alexis Rose — extravagante, adora uma indulgência", personality: "sweet" },
      { emoji: "🧘", text: "Mr. Spock — lógico, minimalista, direto", personality: "zen" },
      { emoji: "🦋", text: "Ted Lasso — otimista, ama as pessoas", personality: "social" },
      { emoji: "🌙", text: "BoJack Horseman — noturno, pensativo, madrugada", personality: "night" },
    ],
  },
  {
    text: "Como é o seu fim de semana ideal?",
    options: [
      { emoji: "🏔️", text: "Trilha ou esporte radical", personality: "bold" },
      { emoji: "🛋️", text: "Pijama, cobertor e série", personality: "cozy" },
      { emoji: "🛍️", text: "Brunch com amigos e sobremesa obrigatória", personality: "sweet" },
      { emoji: "📖", text: "Leitura em silêncio ou meditação", personality: "zen" },
      { emoji: "🎉", text: "Evento, reunião, quanto mais gente melhor", personality: "social" },
      { emoji: "🌃", text: "Acorda depois do meio-dia e tá ótimo", personality: "night" },
    ],
  },
  {
    text: "Você é uma cor. Qual?",
    options: [
      { emoji: "🔴", text: "Vermelho intenso", personality: "bold" },
      { emoji: "🟤", text: "Marrom quente", personality: "cozy" },
      { emoji: "🌸", text: "Rosa pastel", personality: "sweet" },
      { emoji: "⬜", text: "Branco clean", personality: "zen" },
      { emoji: "🟡", text: "Amarelo vibrante", personality: "social" },
      { emoji: "🟣", text: "Azul meia-noite", personality: "night" },
    ],
  },
  {
    text: "Qual é sua relação com horários?",
    options: [
      { emoji: "⚡", text: "Chego cedo, já planejando o próximo passo", personality: "bold" },
      { emoji: "☕", text: "Chego no horário, com meu café na mão", personality: "cozy" },
      { emoji: "🎀", text: "Chego uns 10 min depois — mas compenso com energia", personality: "sweet" },
      { emoji: "🎯", text: "Exatamente no horário, não um minuto antes ou depois", personality: "zen" },
      { emoji: "💬", text: "Chego cedo pra bater papo antes de começar", personality: "social" },
      { emoji: "😴", text: '"Horário" é um conceito interessante', personality: "night" },
    ],
  },
  {
    text: "Qual gênero de filme você sempre escolhe?",
    options: [
      { emoji: "💥", text: "Ação e aventura — quanto mais explosão, melhor", personality: "bold" },
      { emoji: "🎄", text: "Comédia romântica ou drama aconchegante", personality: "cozy" },
      { emoji: "🍿", text: "Animação ou musical — tem que ser divertido", personality: "sweet" },
      { emoji: "🎬", text: "Documentário ou ficção científica minimalista", personality: "zen" },
      { emoji: "😂", text: "Comédia com elenco enorme — quer rir junto", personality: "social" },
      { emoji: "🌑", text: "Terror ou thriller psicológico às 2h da manhã", personality: "night" },
    ],
  },
  {
    text: "Ilha deserta. Você leva UMA coisa além de comida e água:",
    options: [
      { emoji: "🔪", text: "Faca de sobrevivência", personality: "bold" },
      { emoji: "📚", text: "Livro favorito", personality: "cozy" },
      { emoji: "🍫", text: "Chocolate ou doce", personality: "sweet" },
      { emoji: "🧘", text: "Nada — o silêncio já basta", personality: "zen" },
      { emoji: "📱", text: "Telefone com sinal", personality: "social" },
      { emoji: "🎧", text: "Fone com playlist completa", personality: "night" },
    ],
  },
  {
    text: "Como você toma decisões importantes?",
    options: [
      { emoji: "⚡", text: "Na hora — confia no instinto", personality: "bold" },
      { emoji: "🤔", text: "Pensa bastante, consulta quem confia", personality: "cozy" },
      { emoji: "💖", text: "Vai pelo que o coração mandar", personality: "sweet" },
      { emoji: "📊", text: "Pesquisa, analisa, decide com dados", personality: "zen" },
      { emoji: "🗣️", text: "Pede opinião de todo mundo", personality: "social" },
      { emoji: "🌙", text: "Dorme, decide de manhã (ou de tarde)", personality: "night" },
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
          <div style={{ fontSize: 56, marginBottom: 16 }}>☕</div>
          <div style={styles.brand}>BASECAMP COFFEE</div>
          <h1 style={styles.introTitle}>Qual é a sua personalidade de café?</h1>
          <p style={styles.introSub}>
            Responda 7 perguntas rápidas e descubra qual bebida combina com o seu jeito de ser.
          </p>
          <button style={styles.btnPrimary} onClick={() => setPhase("quiz")}>
            Começar o quiz →
          </button>
          <p style={styles.introHint}>7 perguntas · menos de 2 minutos</p>
        </div>
      </div>
    );
  }

  if (phase === "quiz") {
    const q = questions[currentQ];
    const progress = ((currentQ) / questions.length) * 100;

    return (
      <div style={styles.bg}>
        <div style={styles.card}>
          <div style={styles.progressRow}>
            {questions.map((_, i) => (
              <div
                key={i}
                style={{
                  ...styles.dot,
                  background: i < currentQ ? "#4ECDC4" : i === currentQ ? "#FF6B6B" : "#eee",
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
                  const prev = answers.slice(0, -1);
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
      <div style={{ ...styles.card, maxWidth: 580, padding: 0, overflow: "hidden" }}>

        {/* Hero section */}
        <div style={{ position: "relative", height: 260, width: "100%" }}>
          <Image
            src={top.image}
            alt={top.drink}
            fill
            style={{ objectFit: "cover" }}
            priority
          />
          <div style={styles.heroOverlay} />
          <div style={styles.heroContent}>
            <div style={styles.brand}>SEU RESULTADO</div>
            <div style={{ fontSize: 40, margin: "4px 0" }}>{top.emoji}</div>
            <h1 style={styles.heroTitle}>{top.name}</h1>
            <div style={styles.heroDrink}>☕ {top.drink}</div>
          </div>
        </div>

        {/* Tagline */}
        <div style={styles.taglineBanner}>
          <span style={{ color: top.color, fontWeight: 900 }}>"</span>
          {top.tagline}
          <span style={{ color: top.color, fontWeight: 900 }}>"</span>
        </div>

        {/* Percentage bar for top result */}
        <div style={styles.topPercentRow}>
          <span style={styles.topPercentLabel}>Sua personalidade dominante</span>
          <span style={{ ...styles.resultPct, color: top.color, fontSize: 18 }}>{top.percent}%</span>
        </div>
        <div style={{ ...styles.barWrap, margin: "0 28px 24px", height: 12 }}>
          <div style={{ ...styles.barFill, width: `${top.percent}%`, background: top.color }} />
        </div>

        {/* Secondary personalities grid */}
        {secondary.length > 0 && (
          <div style={styles.secondarySection}>
            <div style={styles.sectionTitle}>Também tem um pouco de...</div>
            <div style={styles.secondaryGrid}>
              {secondary.map((p) => (
                <div key={p.id} style={styles.secondaryCard}>
                  <div style={styles.secondaryImgWrap}>
                    <Image
                      src={p.image}
                      alt={p.drink}
                      fill
                      style={{ objectFit: "cover" }}
                    />
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
          <button style={{ ...styles.btnPrimary, background: "#4ECDC4", width: "100%" }} onClick={restart}>
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
    background: "linear-gradient(135deg, #FF6B6B 0%, #FFE66D 50%, #4ECDC4 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 16px",
    fontFamily: "'Nunito', sans-serif",
  },
  card: {
    background: "white",
    borderRadius: 32,
    padding: "48px 40px",
    maxWidth: 560,
    width: "100%",
    boxShadow: "8px 8px 0px #FF6B6B, 16px 16px 0px #FFE66D",
  },
  brand: {
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: 3,
    color: "#FF6B6B",
    textTransform: "uppercase" as const,
    marginBottom: 8,
  },
  introTitle: {
    fontSize: 28,
    fontWeight: 900,
    color: "#2D2D2D",
    lineHeight: 1.3,
    margin: "12px 0 16px",
  },
  introSub: {
    fontSize: 16,
    color: "#666",
    lineHeight: 1.6,
    marginBottom: 32,
  },
  introHint: {
    fontSize: 13,
    color: "#aaa",
    marginTop: 12,
    textAlign: "center" as const,
  },
  btnPrimary: {
    background: "#FF6B6B",
    color: "white",
    border: "none",
    borderRadius: 16,
    padding: "16px 36px",
    fontSize: 16,
    fontWeight: 900,
    cursor: "pointer",
    fontFamily: "'Nunito', sans-serif",
    display: "block",
    margin: "0 auto",
    transition: "transform 0.1s",
  },
  progressRow: {
    display: "flex",
    gap: 8,
    marginBottom: 28,
  },
  dot: {
    height: 10,
    flex: 1,
    borderRadius: 10,
    transition: "background 0.3s",
  },
  qNum: {
    fontSize: 12,
    fontWeight: 900,
    color: "#FF6B6B",
    textTransform: "uppercase" as const,
    letterSpacing: 2,
    marginBottom: 10,
  },
  qText: {
    fontSize: 22,
    fontWeight: 900,
    color: "#2D2D2D",
    lineHeight: 1.3,
    marginBottom: 28,
  },
  options: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 12,
  },
  option: {
    border: "2.5px solid #eee",
    borderRadius: 16,
    padding: "14px 18px",
    cursor: "pointer",
    fontSize: 15,
    fontWeight: 700,
    color: "#2D2D2D",
    transition: "all 0.15s",
    display: "flex",
    alignItems: "center",
    gap: 12,
    textAlign: "left" as const,
    background: "white",
    fontFamily: "'Nunito', sans-serif",
  },
  optionSelected: {
    borderColor: "#FF6B6B",
    background: "#FF6B6B",
    color: "white",
    transform: "translateX(6px)",
  },
  optEmoji: {
    fontSize: 22,
    flexShrink: 0,
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
    color: "#aaa",
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
    color: "#444",
    fontStyle: "italic",
    borderBottom: "1px solid #f0f0f0",
    lineHeight: 1.5,
  },
  topPercentRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 28px 8px",
  },
  topPercentLabel: {
    fontSize: 12,
    fontWeight: 900,
    color: "#999",
    textTransform: "uppercase" as const,
    letterSpacing: 1,
  },
  secondarySection: {
    padding: "0 28px 24px",
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
    color: "#444",
    textAlign: "center" as const,
    lineHeight: 1.3,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 900,
    color: "#999",
    textTransform: "uppercase" as const,
    letterSpacing: 1,
    marginBottom: 16,
  },
  resultRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  resultEmoji: {
    fontSize: 20,
    width: 28,
    textAlign: "center" as const,
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    fontSize: 13,
    fontWeight: 700,
    color: "#2D2D2D",
    marginBottom: 4,
  },
  barWrap: {
    height: 8,
    background: "#eee",
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
