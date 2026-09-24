const { buscarClimaTempoReal } = require('../services/climaService');
const { converterMoeda } = require('../services/moedaService');
const { adicionarXP } = require('../services/xpService');

/**
 * "Manual de instruções" (JSON Schema) que o Gemini lê
 * para decidir QUANDO e COMO usar cada ferramenta.
 */
const declaracaoClima = {
    name: 'buscarClimaTempoReal',
    description: 'Obtém a temperatura exata e o clima atual de uma cidade. ' +
        'Use sempre que o usuário perguntar sobre o tempo, temperatura, chuva, frio ou calor.',
    parameters: {
        type: 'OBJECT',
        properties: {
            cidade: {
                type: 'STRING',
                description: 'O nome da cidade. Ex: Assis Chateaubriand, Curitiba, Tokyo.'
            }
        },
        required: ['cidade']
    }
};

const declaracaoMoeda = {
    name: 'converterMoeda',
    description: 'Converte um valor de uma moeda para outra usando a cotação atual. ' +
        'Use sempre que o usuário perguntar sobre câmbio, cotação ou quanto vale um valor em outra moeda.',
    parameters: {
        type: 'OBJECT',
        properties: {
            valor: { type: 'NUMBER', description: 'O valor a ser convertido. Ex: 150' },
            moedaOrigem: { type: 'STRING', description: 'Código ISO da moeda de origem. Ex: USD, EUR, GBP.' },
            moedaDestino: { type: 'STRING', description: 'Código ISO da moeda de destino. Use BRL se o usuário não disser.' }
        },
        required: ['valor', 'moedaOrigem', 'moedaDestino']
    }
};

// O nickname NÃO é parâmetro para a IA: o servidor sabe quem está jogando.
// Assim ninguém consegue pedir "dá XP para o Fulano".
const declaracaoXP = {
    name: 'adicionarXP',
    description: 'Adiciona ou remove pontos de experiência (XP) do jogador atual. ' +
        'Use valor positivo para premiar (ex: 50 ao acertar uma charada) ' +
        'e negativo para penalizar (ex: -10 ao pedir a resposta).',
    parameters: {
        type: 'OBJECT',
        properties: {
            quantidade: {
                type: 'NUMBER',
                description: 'Quantidade de XP. Positivo para ganhar, negativo para perder. Ex: 50 ou -10.'
            }
        },
        required: ['quantidade']
    }
};

// Lista enviada ao Gemini
const declaracoes = [declaracaoClima, declaracaoMoeda, declaracaoXP];

// Mapa: nome que o Gemini pede -> função local.
// "contexto" traz dados do servidor (ex: nickname de quem está jogando).
const funcoesDisponiveis = {
    buscarClimaTempoReal: ({ cidade }) => buscarClimaTempoReal(cidade),
    converterMoeda: ({ valor, moedaOrigem, moedaDestino }) =>
        converterMoeda(valor, moedaOrigem, moedaDestino),
    adicionarXP: ({ quantidade }, contexto) => adicionarXP(contexto.nickname, quantidade)
};

module.exports = { declaracoes, funcoesDisponiveis };