# Quiz de Personalidade de Café — Requirements

## Visão Geral

Quiz interativo "Qual é a sua personalidade de café?" para o programa de fidelidade da Basecamp Coffee. O usuário responde 5 perguntas de estilo de vida e descobre qual bebida combina com sua personalidade.

---

## 1. Pares Personalidade → Café (5 resultados)

| Personalidade | Bebida | Tagline |
|--------------|--------|---------|
| **Bold Adventurer** | Espresso Duplo | "Você vive pela intensidade" |
| **Sweet Enthusiast** | Latte de Caramelo | "A vida é curta demais para o amargo" |
| **Zen Minimalist** | Café Preto, Single Origin | "Simples. Limpo. Perfeito." |
| **Social Butterfly** | Cappuccino | "Café é melhor acompanhado" |
| **Indulgent Treat** | Mocha com Chantilly | "Café é sobremesa" |

---

## 2. Lógica de Resultado

**Opção B — Mostrar percentuais**

Ao final, o usuário vê o breakdown completo de todas as personalidades com porcentagens e todas as recomendações de café correspondentes. Exemplo:
> "Você é 50% Bold Adventurer, 30% Zen Minimalist, 20% Social Butterfly"

Cada pergunta tem 5 respostas, cada uma mapeada para uma personalidade. O resultado final mostra o percentual de cada personalidade com base nas respostas escolhidas.

---

## 3. Estilo Visual

**Estilo 4 (Quente & Aconchegante) com layout de opções em grade 2x2 do Estilo 1**

- Paleta: tons terrosos — marrons, bege, laranja suave — sensação de cafeteria aconchegante
- Fundo: gradiente suave (`#f5ebe0` → `#e8d5b7`)
- Card: `#fffbf5`, bordas arredondadas, sombra suave marrom
- Botão: `#c8824a` (laranja terroso)
- Opções: grade 2x2 com emojis, bordas suaves, hover em laranja
- Tom geral: caloroso, acolhedor, autêntico — como uma cafeteria de verdade
- Referência: `style-preview-4.html` (estética) + `style-preview-1.html` (grid de opções)

---

## 4. Imagens

**Sim — imagens para cada resultado**

Imagens baixadas do Unsplash em `public/`:

| Arquivo | Personalidade |
|---------|--------------|
| `bold-adventurer.jpg` | Bold Adventurer — Espresso Duplo |
| `sweet-enthusiast.jpg` | Sweet Enthusiast — Latte de Caramelo |
| `zen-minimalist.jpg` | Zen Minimalist — Café Preto |
| `social-butterfly.jpg` | Social Butterfly — Cappuccino |
| `indulgent-treat.jpg` | Indulgent Treat — Mocha com Chantilly |

---

## 5. Ícones

**Sim — ícones emoji ao lado de cada opção de resposta**

Cada opção de resposta deve ter um emoji relevante antes do texto.

---

## 6. Perguntas do Quiz (5 perguntas — estilo de vida)

### Q1 — Como você começa a sua manhã?
- 🏃 Academia ou corrida antes de tudo → Bold Adventurer
- 🛁 Banho longo e calma total → Zen Minimalist
- 📱 Redes sociais na cama → Social Butterfly
- ☕ Café na mão, série ligada → Indulgent Treat
- 🎵 Música alta e bom humor → Sweet Enthusiast

### Q2 — Seu fim de semana ideal é:
- 🏔️ Trilha, praia ou aventura ao ar livre → Bold Adventurer
- 🏡 Em casa, sem compromisso → Zen Minimalist
- 🎉 Sair com amigos e família → Social Butterfly
- 🍕 Delivery, sofá e conforto total → Indulgent Treat
- 🛍️ Compras, cafés e passeios → Sweet Enthusiast

### Q3 — Na hora de escolher um restaurante, você:
- 🗣️ Vai no que todo mundo indica → Social Butterfly
- 🔍 Pesquisa muito antes de decidir → Zen Minimalist
- 📸 Escolhe o mais instagramável → Sweet Enthusiast
- 🌶️ Quer o cardápio mais ousado → Bold Adventurer
- 🛋️ Prioriza o mais confortável e gostoso → Indulgent Treat

### Q4 — Sua mochila ou bolsa geralmente tem:
- 🎧 Fone, celular carregado e nada mais → Zen Minimalist
- 🎒 Mil coisas "por precaução" → Indulgent Treat
- 💄 Maquiagem, perfume, o essencial bonito → Sweet Enthusiast
- 💧 Garrafa de água e lanche → Bold Adventurer
- 📅 Agenda cheia de encontros com amigos → Social Butterfly

### Q5 — Quando você está estressado, você:
- 🏋️ Sai para se exercitar → Bold Adventurer
- 🧘 Faz silêncio e respira → Zen Minimalist
- 📞 Liga para um amigo → Social Butterfly
- 🍫 Come algo gostoso → Indulgent Treat
- 📺 Assiste algo divertido → Sweet Enthusiast

---

## 7. Estrutura de Arquivos

```
quiz-project/
├── REQUIREMENTS.md
├── public/
│   ├── bold-adventurer.jpg
│   ├── sweet-enthusiast.jpg
│   ├── zen-minimalist.jpg
│   ├── social-butterfly.jpg
│   └── indulgent-treat.jpg
├── style-preview-1.html
├── style-preview-2.html
├── style-preview-3.html
└── style-preview-4.html
```

---

## 8. Stack Técnica

- **Framework**: Next.js (React)
- **Linguagem**: TypeScript
- **Estilo**: Tailwind CSS
- **Deploy**: Vercel
