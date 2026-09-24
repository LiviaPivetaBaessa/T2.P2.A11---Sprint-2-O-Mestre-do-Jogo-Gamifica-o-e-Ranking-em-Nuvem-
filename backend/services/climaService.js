/**
 * Consulta o clima atual de uma cidade na OpenWeatherMap.
 * Retorna um objeto JSON simples (ou { erro } se algo falhar),
 * para a IA sempre ter algo para responder ao usuário.
 */
async function buscarClimaTempoReal(cidade) {
    const apiKey = process.env.WEATHER_API_KEY;
    if (!apiKey) return { erro: 'WEATHER_API_KEY não configurada no servidor.' };

    const url = 'https://api.openweathermap.org/data/2.5/weather' +
        `?q=${encodeURIComponent(cidade)}&appid=${apiKey}&units=metric&lang=pt_br`;

    try {
        const resposta = await fetch(url);
        const dados = await resposta.json();

        if (!resposta.ok) {
            return { erro: `Não foi possível obter o clima de "${cidade}": ${dados.message}` };
        }

        return {
            cidade: dados.name,
            pais: dados.sys.country,
            temperatura: Math.round(dados.main.temp),
            sensacaoTermica: Math.round(dados.main.feels_like),
            minima: Math.round(dados.main.temp_min),
            maxima: Math.round(dados.main.temp_max),
            umidade: dados.main.humidity,
            descricao: dados.weather[0].description,
            unidade: '°C'
        };
    } catch (erro) {
        return { erro: `Falha ao consultar a API de clima: ${erro.message}` };
    }
}

module.exports = { buscarClimaTempoReal };