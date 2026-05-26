# Quiz de Personalidade de Café — Requirements

## Visão Geral

Quiz interativo "Qual é a sua personalidade de café?" para o programa de fidelidade da Basecamp Coffee. O usuário responde 7 perguntas e descobre qual bebida combina com sua personalidade.

---

## 1. Pares Personalidade → Café (6 resultados)

| Personalidade | Bebida | Tagline |
|--------------|--------|---------|
| **Bold Adventurer** | Double Espresso | "Você vive pela intensidade" |
| **Cozy Classic** | Medium Roast Drip | "Conforto em cada xícara" |
| **Sweet Enthusiast** | Caramel Latte | "A vida é curta demais pro amargo" |
| **Zen Minimalist** | Black Coffee, Single Origin | "Simples. Limpo. Perfeito." |
| **Social Butterfly** | Cappuccino | "Café é melhor em companhia" |
| **Night Owl** | Red Eye (café + espresso) | "Dormir é opcional" |

---

## 2. Lógica de Resultado

**Opção B — Mostrar percentuais**

Ao final, o usuário vê sua distribuição completa de personalidades com porcentagens e todas as recomendações de café. Exemplo:
> "Você é 50% Bold Adventurer, 33% Night Owl, 17% Social Butterfly"

Cada pergunta tem 6 respostas, cada uma mapeada para uma personalidade. O resultado final mostra o percentual de cada personalidade com base nas respostas escolhidas.

---

## 3. Estilo Visual

**Estilo 1 — Divertido & Colorido**

- Fundo: gradiente vibrante (vermelho → amarelo → teal)
- Card: branco com cantos arredondados (32px), sombra colorida dupla
- Fonte: Nunito (arredondada, amigável, peso bold/900)
- Cores primárias: `#FF6B6B` (vermelho coral), `#FFE66D` (amarelo), `#4ECDC4` (teal)
- Opções de resposta: borda colorida ao selecionar, animação de translate no hover
- Botão: vermelho coral, cantos arredondados, fonte bold
- Barra de progresso: dots coloridos (ativo = coral, feito = teal)
- Referência: `style-preview-1.html`

---

## 4. Imagens

**Sim — imagens para cada resultado**

Imagens já baixadas em `public/`:

| Arquivo | Personalidade |
|---------|--------------|
| `espresso.jpg` | Bold Adventurer |
| `drip-coffee.jpg` | Cozy Classic |
| `caramel-latte.jpg` | Sweet Enthusiast |
| `black-coffee.jpg` | Zen Minimalist |
| `cappuccino.jpg` | Social Butterfly |
| `red-eye.jpg` | Night Owl |

---

## 5. Ícones

**Sim — ícones emoji ao lado de cada opção de resposta**

Cada opção de resposta deve ter um emoji relevante antes do texto.

---

## 6. Perguntas do Quiz (7 perguntas)

### Q1 — Pop culture
**Se você fosse um personagem de série, qual seria?**
- 🔥 Joel Miller (The Last of Us) — sobrevivente, intenso → Bold Adventurer
- 🧣 Lorelai Gilmore — café na veia, confortável em casa → Cozy Classic
- 🍭 Alexis Rose (Schitt's Creek) — extravagante, adora uma indulgência → Sweet Enthusiast
- 🧘 Mr. Spock — lógico, minimalista, direto → Zen Minimalist
- 🦋 Ted Lasso — otimista, ama as pessoas → Social Butterfly
- 🌙 BoJack Horseman — noturno, pensativo, funciona de madrugada → Night Owl

### Q2 — Estilo de vida
**Como é o seu fim de semana ideal?**
- 🏔️ Trilha ou esporte radical → Bold Adventurer
- 🛋️ Pijama, cobertor e série → Cozy Classic
- 🛍️ Brunch com amigos e sobremesa obrigatória → Sweet Enthusiast
- 📖 Leitura em silêncio ou meditação → Zen Minimalist
- 🎉 Evento, reunião, quanto mais gente melhor → Social Butterfly
- 🌃 Acorda depois do meio-dia e tá ótimo → Night Owl

### Q3 — Abstrato
**Você é uma cor. Qual?**
- 🔴 Vermelho intenso → Bold Adventurer
- 🟤 Marrom quente → Cozy Classic
- 🌸 Rosa pastel → Sweet Enthusiast
- ⬜ Branco clean → Zen Minimalist
- 🟡 Amarelo vibrante → Social Butterfly
- 🟣 Azul meia-noite → Night Owl

### Q4 — Estilo de vida
**Qual é sua relação com horários?**
- ⚡ Chego cedo, já estou planejando o próximo passo → Bold Adventurer
- ☕ Chego no horário, com meu café na mão → Cozy Classic
- 🎀 Chego animado(a), uns 10 min depois — mas compenso com energia → Sweet Enthusiast
- 🎯 Chego exatamente no horário, não um minuto antes ou depois → Zen Minimalist
- 💬 Chego cedo pra bater papo antes de começar → Social Butterfly
- 😴 "Horário" é um conceito interessante → Night Owl

### Q5 — Pop culture
**Qual gênero de filme você sempre escolhe?**
- 💥 Ação e aventura — quanto mais explosão, melhor → Bold Adventurer
- 🎄 Comédia romântica ou drama aconchegante → Cozy Classic
- 🍿 Animação ou musical — tem que ser divertido → Sweet Enthusiast
- 🎬 Documentário ou ficção científica minimalista → Zen Minimalist
- 😂 Comédia com elenco enorme — quer rir junto → Social Butterfly
- 🌑 Terror ou thriller psicológico às 2h da manhã → Night Owl

### Q6 — Abstrato
**Uma ilha deserta. Você leva UMA coisa além de comida e água:**
- 🔪 Faca de sobrevivência → Bold Adventurer
- 📚 Livro favorito → Cozy Classic
- 🍫 Chocolate ou doce → Sweet Enthusiast
- 🧘 Nada — o silêncio já basta → Zen Minimalist
- 📱 Telefone com sinal → Social Butterfly
- 🎧 Fone com playlist completa → Night Owl

### Q7 — Estilo de vida
**Como você toma decisões importantes?**
- ⚡ Na hora — confia no instinto → Bold Adventurer
- 🤔 Pensa bastante, consulta quem confia → Cozy Classic
- 💖 Vai pelo que o coração mandar → Sweet Enthusiast
- 📊 Pesquisa, analisa, decide com dados → Zen Minimalist
- 🗣️ Pede opinião de todo mundo → Social Butterfly
- 🌙 Dorme, decide de manhã (ou de tarde) → Night Owl

---

## 7. Estrutura de Arquivos

```
quiz-project/
├── REQUIREMENTS.md       ← este arquivo
├── public/
│   ├── espresso.jpg
│   ├── drip-coffee.jpg
│   ├── caramel-latte.jpg
│   ├── black-coffee.jpg
│   ├── cappuccino.jpg
│   └── red-eye.jpg
├── style-preview-1.html  ← estilo escolhido
├── style-preview-2.html
├── style-preview-3.html
└── style-preview-4.html
```

---

## 8. Stack Técnica

- **Framework**: Next.js (React)
- **Linguagem**: JavaScript/TypeScript
- **Estilo**: Tailwind CSS ou CSS modules
- **Deploy**: Vercel
