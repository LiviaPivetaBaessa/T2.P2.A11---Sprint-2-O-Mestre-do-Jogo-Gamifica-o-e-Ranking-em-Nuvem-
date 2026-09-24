# 🎲 Mestre do Jogo — Gamificação e Ranking em Nuvem

API de um **Mestre de Jogo** com **Google Gemini**: a IA propõe charadas de tecnologia e, sozinha, chama a função `adicionarXP` para premiar ou penalizar o jogador. O XP fica salvo no **MongoDB Atlas** e aparece num **Ranking Global (Top 10)**. O agente também mantém as ferramentas de **clima** (OpenWeatherMap) e **moedas** (AwesomeAPI).

Projeto da disciplina **Serviços em Nuvem** — IFPR Campus Assis Chateaubriand.

## 🧠 Como funciona o Function Calling

```
Usuário pergunta
      ↓
Gemini decide: responder direto OU pedir uma ferramenta (functionCall)
      ↓                                   ↓
Resposta em texto          Servidor executa a função local (clima / moeda)
                                          ↓
                           Servidor devolve o resultado (functionResponse)
                                          ↓
                           Gemini formula a resposta final
```

## 🛠️ Ferramentas do Agente

| Ferramenta | O que faz | API |
|---|---|---|
| `buscarClimaTempoReal(cidade)` | Temperatura, sensação térmica e descrição do clima atual | OpenWeatherMap |
| `converterMoeda(valor, moedaOrigem, moedaDestino)` | Converte valores com a cotação atual | AwesomeAPI |
| `adicionarXP(quantidade)` | Soma ou tira XP do jogador atual (limite de -50 a +100 por vez) | MongoDB (`$inc` + upsert) |

> 🔒 O nickname **não** é parâmetro da IA: o servidor injeta o jogador atual, então ninguém consegue pedir "dá XP para o Fulano".

## 🎮 Regras do Jogo

| Ação do jogador | XP |
|---|---|
| Acertou a charada | **+50** |
| Pediu a resposta / desistiu | **-10** |
| Foi especialmente educado | **+10** (bônus) |

**Títulos no ranking:** Novato (< 100 XP) · Aventureiro (100–499) · Lenda (≥ 500)

## 📁 Estrutura

```
├── controllers/
│   ├── chatController.js   # Regras do jogo + loop de ferramentas
│   ├── rankingController.js# Top 10 + títulos dinâmicos
│   └── pdfController.js    # Gera o PDF com o resumo da conversa
├── models/
│   ├── Jogador.js          # nome (único) + xp → collection "jogadores"
│   └── Mensagem.js         # Histórico por nickname
├── routes/
│   ├── chatRoutes.js       # /api/chat
│   ├── pdfRoutes.js        # /api/pdf
│   └── rankingRoutes.js    # /api/ranking
├── services/
│   ├── climaService.js     # Chamada à OpenWeatherMap
│   ├── moedaService.js     # Chamada à AwesomeAPI
│   └── xpService.js        # adicionarXP (MongoDB)
├── tools/
│   └── ferramentas.js      # Declarações (JSON Schema) + mapa de funções
├── .env.example
├── package.json
└── server.js
```

## 🔌 Rotas

| Método | Rota               | Descrição |
|--------|--------------------|-----------|
| POST   | `/api/chat`        | Envia `{ "pergunta": "...", "nickname": "..." }` e recebe `{ resposta, xpGanho }` |
| DELETE | `/api/chat/limpar?nickname=...` | Apaga o histórico do jogador (o XP continua) |
| GET    | `/api/ranking`     | Top 10 jogadores por XP, com título |
| POST   | `/api/pdf`         | Envia `{ "historico": "..." }` e recebe um PDF com o resumo |

## ▶️ Como rodar

1. `npm install`
2. Copie `.env.example` para `.env` e preencha:
   - `GEMINI_API_KEY` → https://aistudio.google.com/apikey
   - `MONGO_URI` → MongoDB Atlas (Connect → Drivers)
   - `WEATHER_API_KEY` → https://home.openweathermap.org/api_keys
3. `npm start` → `http://localhost:3000`

## 🧪 Testes de aceite

| Teste | Comportamento esperado |
|---|---|
| Abrir o site sem apelido | O chat fica bloqueado até informar o nickname |
| Acertar uma charada | A IA chama `adicionarXP(50)`, aparece "+50 XP" e confetes 🎉 |
| Pedir a resposta | A IA chama `adicionarXP(-10)` |
| MongoDB Atlas | Collection `jogadores` criada e XP mudando |
| Botão "🏆 Ver Ranking" | Top 10 ordenado, com 🥇🥈🥉, sem recarregar a página |

## 🛠️ Tecnologias

Node.js · Express · Mongoose · MongoDB Atlas · Google Gemini (Function Calling) · canvas-confetti · OpenWeatherMap · AwesomeAPI · PDFKit