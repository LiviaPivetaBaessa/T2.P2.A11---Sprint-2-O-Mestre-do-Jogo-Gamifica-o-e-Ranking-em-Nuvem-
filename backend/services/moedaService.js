/**
 * Converte um valor entre moedas usando a cotação atual da AwesomeAPI
 * (gratuita, não precisa de chave).
 * Ex: converterMoeda(150, 'EUR', 'BRL')
 */
async function converterMoeda(valor, moedaOrigem, moedaDestino = 'BRL') {
    const de = String(moedaOrigem).toUpperCase().trim();
    const para = String(moedaDestino).toUpperCase().trim();
    const url = `https://economia.awesomeapi.com.br/json/last/${de}-${para}`;

    try {
        const resposta = await fetch(url);
        const dados = await resposta.json();
        const cotacao = dados[`${de}${para}`];

        if (!resposta.ok || !cotacao) {
            return { erro: `Não foi possível obter a cotação ${de} → ${para}.` };
        }

        const taxa = Number(cotacao.bid);
        return {
            valorOriginal: Number(valor),
            moedaOrigem: de,
            moedaDestino: para,
            cotacao: taxa,
            valorConvertido: Number((Number(valor) * taxa).toFixed(2)),
            atualizadoEm: cotacao.create_date
        };
    } catch (erro) {
        return { erro: `Falha ao consultar a API de moedas: ${erro.message}` };
    }
}

module.exports = { converterMoeda };