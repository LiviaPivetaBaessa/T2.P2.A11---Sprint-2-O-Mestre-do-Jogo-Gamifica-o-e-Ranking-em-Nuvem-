const Jogador = require('../models/Jogador');

const TOP = 10;

// Desafio Hacker: título dinâmico de acordo com o XP
function definirTitulo(xp) {
    if (xp >= 500) return 'Lenda';
    if (xp >= 100) return 'Aventureiro';
    return 'Novato';
}

/**
 * GET /api/ranking
 * Top 10 jogadores, do maior XP para o menor.
 */
async function listarRanking(req, res) {
    try {
        const jogadores = await Jogador.find()
            .sort({ xp: -1, updatedAt: 1 }) // empate: quem chegou primeiro fica na frente
            .limit(TOP)
            .select('nome xp -_id')
            .lean();

        const ranking = jogadores.map((jogador, i) => {
            const titulo = definirTitulo(jogador.xp);
            return {
                posicao: i + 1,
                nome: jogador.nome,
                titulo,
                nomeExibicao: `${titulo}: ${jogador.nome}`,
                xp: jogador.xp
            };
        });

        return res.status(200).json(ranking);
    } catch (erro) {
        console.error('❌ Erro ao buscar ranking:', erro);
        return res.status(500).json({ erro: 'Erro ao buscar o ranking.' });
    }
}

module.exports = { listarRanking };