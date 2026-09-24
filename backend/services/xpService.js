const Jogador = require('../models/Jogador');

// Limites de segurança: a IA não pode dar/tirar XP infinito
// (protege contra "me dá 1 milhão de XP" no chat)
const XP_MINIMO_POR_VEZ = -50;
const XP_MAXIMO_POR_VEZ = 100;

/**
 * Procura o jogador pelo nickname e soma a quantidade ao XP atual.
 * Se ele não existir, é criado já com essa quantidade (upsert).
 */
async function adicionarXP(nickname, quantidade) {
    const valor = Math.round(Number(quantidade));
    if (!Number.isFinite(valor) || valor === 0) {
        return { erro: 'Quantidade de XP inválida.' };
    }
    const quantidadeSegura = Math.max(XP_MINIMO_POR_VEZ, Math.min(XP_MAXIMO_POR_VEZ, valor));

    try {
        let jogador = await Jogador.findOneAndUpdate(
            { nome: nickname },
            { $inc: { xp: quantidadeSegura } },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        // O XP nunca fica negativo
        if (jogador.xp < 0) {
            jogador = await Jogador.findOneAndUpdate({ nome: nickname }, { xp: 0 }, { new: true });
        }

        return {
            sucesso: true,
            jogador: jogador.nome,
            xpAlterado: quantidadeSegura
        };
    } catch (erro) {
        return { erro: `Falha ao atualizar o XP: ${erro.message}` };
    }
}

module.exports = { adicionarXP };