// 1. Carrega as variáveis do .env ANTES de qualquer outro require
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// 2. Confere se o .env está completo (evita erros misteriosos depois)
const variaveisObrigatorias = ['GEMINI_API_KEY', 'MONGO_URI'];
const faltando = variaveisObrigatorias.filter((nome) => !process.env[nome]);
if (faltando.length > 0) {
    console.error(`❌ Faltam variáveis no .env: ${faltando.join(', ')}`);
    console.error('👉 Copie o .env.example para .env e preencha os valores.');
    process.exit(1);
}
if (!process.env.WEATHER_API_KEY) {
    console.warn('⚠️ WEATHER_API_KEY não definida: a ferramenta de clima vai retornar erro.');
}

const chatRoutes = require('./routes/chatRoutes');
const pdfRoutes = require('./routes/pdfRoutes');
const rankingRoutes = require('./routes/rankingRoutes');

// 3. Conexão com o Banco de Dados
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('📦 Conectado ao MongoDB Atlas!'))
    .catch((err) => console.error('❌ Erro no banco:', err.message));

// 4. Configurações do servidor
const app = express();
app.use(express.json());
app.use(cors());

// 5. Rotas
app.get('/', (req, res) => res.send('API do Mestre do Jogo no ar 🎲'));
app.use('/api/chat', chatRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/ranking', rankingRoutes);

// 6. Inicialização
const PORTA = process.env.PORT || 3000;
app.listen(PORTA, () => {
    console.log(`🚀 Servidor rodando na porta ${PORTA}`);
});