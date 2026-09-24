const { GoogleGenerativeAI } = require('@google/generative-ai');
const Mensagem = require('../models/Mensagem');
const { declaracoes, funcoesDisponiveis } = require('../tools/ferramentas');

// A Regra do Jogo (Engenharia de Prompt)
const REGRAS_DO_JOGO = `
Você é o Guardião do Cofre do Conhecimento, um Mestre de Jogo divertido que fala português do Brasil.

O JOGO:
- Proponha charadas e desafios de tecnologia e programação, um de cada vez.
- Varie a dificuldade e o tema (lógica, redes, banco de dados, web, história da computação).

REGRAS DE PONTUAÇÃO (obrigatórias):
- Se o jogador ACERTAR a charada, você DEVE chamar a função adicionarXP com quantidade 50.
- Se o jogador PEDIR A RESPOSTA ou desistir, você DEVE chamar adicionarXP com quantidade -10 e depois revelar a resposta.
- Se o jogador errar, não mude o XP: dê uma dica e deixe ele tentar de novo.
- Se o jogador for educado e gentil de forma especial, você PODE dar um bônus de 10 XP.
- Nunca dê XP porque o jogador pediu, mandou ou insistiu. XP só se ganha jogando.
- Nunca diga quantos pontos ele tem no total. Apenas avise que ganhou ou perdeu XP e continue o jogo.
- Quando ele acertar, comece a resposta com "Parabéns!" ou "Acertou!".

OUTRAS FERRAMENTAS:
- Se o jogador perguntar sobre clima ou câmbio, use as ferramentas de clima e moeda em vez de inventar dados,
  e depois convide ele a voltar para o jogo.
`.trim();

// Configuração da IA + caixa de ferramentas
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: REGRAS_DO_JOGO,
    tools: [{ functionDeclarations: declaracoes }]
});

const LIMITE_HISTORICO = 20;
const MAX_RODADAS_FERRAMENTAS = 5; // evita loop infinito
const TAMANHO_MAX_NICK = 20;

/**
 * Limpa e valida o nickname vindo do Front-end.
 */
function validarNickname(nickname) {
    if (typeof nickname !== 'string') return null;
    const limpo = nickname.trim();
    if (limpo.length < 2 || limpo.length > TAMANHO_MAX_NICK) return null;
    return limpo;
}

/**
 * Busca as últimas mensagens DESTE jogador e monta no formato do Gemini.
 */
async function buscarHistorico(nickname) {
    const mensagens = await Mensagem.find({ nickname })
        .sort({ dataHora: -1 })
        .limit(LIMITE_HISTORICO);
    mensagens.reverse();

    const historico = mensagens.map((msg) => ({
        role: msg.role,
        parts: msg.parts.map((p) => ({ text: p.text }))
    }));

    // O Gemini exige que o histórico comece com 'user'
    while (historico.length > 0 && historico[0].role !== 'user') {
        historico.shift();
    }

    return historico;
}

/**
 * Executa as funções que o Gemini pediu e monta as functionResponses.
 */
async function executarFerramentas(chamadas, contexto) {
    return Promise.all(chamadas.map(async ({ name, args }) => {
        console.log(`🛠️ [${contexto.nickname}] Gemini chamou: ${name}(${JSON.stringify(args)})`);

        const funcao = funcoesDisponiveis[name];
        const resultado = funcao
            ? await funcao(args || {}, contexto)
            : { erro: `Ferramenta "${name}" não existe.` };

        return { name, resultado, parte: { functionResponse: { name, response: resultado } } };
    }));
}

/**
 * POST /api/chat
 * Body: { pergunta, nickname }
 */
async function processarMensagem(req, res) {
    try {
        const { pergunta } = req.body;
        const nickname = validarNickname(req.body.nickname);

        if (!nickname) {
            return res.status(400).json({ erro: `Informe um apelido de 2 a ${TAMANHO_MAX_NICK} caracteres.` });
        }
        if (!pergunta) return res.status(400).json({ erro: 'Envie uma pergunta.' });

        const contexto = { nickname };
        let xpGanho = 0;

        // 1. Histórico do jogador (antes de salvar a nova pergunta)
        const historico = await buscarHistorico(nickname);
        const chat = model.startChat({ history: historico });

        // 2. Envia a pergunta
        let result = await chat.sendMessage(pergunta);

        // 3. Loop: enquanto o Gemini pedir ferramentas, executa e devolve
        for (let rodada = 0; rodada < MAX_RODADAS_FERRAMENTAS; rodada++) {
            const chamadas = result.response.functionCalls();
            if (!chamadas || chamadas.length === 0) break;

            const execucoes = await executarFerramentas(chamadas, contexto);

            // Soma o XP alterado nesta mensagem (para o Front mostrar +50 XP)
            execucoes
                .filter((e) => e.name === 'adicionarXP' && e.resultado.sucesso)
                .forEach((e) => { xpGanho += e.resultado.xpAlterado; });

            result = await chat.sendMessage(execucoes.map((e) => e.parte));
        }

        const respostaDaIA = result.response.text();

        // 4. Salva pergunta + resposta final no histórico do jogador
        await Mensagem.create([
            { nickname, role: 'user', parts: [{ text: pergunta }] },
            { nickname, role: 'model', parts: [{ text: respostaDaIA }], dataHora: new Date(Date.now() + 1) }
        ]);

        // 5. Devolve a resposta para o Front-end
        return res.status(200).json({ sucesso: true, resposta: respostaDaIA, xpGanho });

    } catch (erro) {
        console.error('❌ Erro:', erro);
        return res.status(500).json({ erro: 'Amnésia do servidor. Erro interno.' });
    }
}

/**
 * DELETE /api/chat/limpar?nickname=Fulano
 * Apaga o histórico de conversa do jogador (o XP continua!).
 */
async function limparHistorico(req, res) {
    try {
        const nickname = validarNickname(req.query.nickname);
        if (!nickname) return res.status(400).json({ erro: 'Informe o apelido.' });

        await Mensagem.deleteMany({ nickname });
        return res.status(200).json({ sucesso: true, mensagem: 'Histórico apagado com sucesso.' });
    } catch (erro) {
        console.error('❌ Erro ao limpar histórico:', erro);
        return res.status(500).json({ erro: 'Erro ao limpar o histórico.' });
    }
}

module.exports = { processarMensagem, limparHistorico };