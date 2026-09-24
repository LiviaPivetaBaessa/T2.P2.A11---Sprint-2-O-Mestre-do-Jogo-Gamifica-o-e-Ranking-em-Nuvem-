const express = require('express');
const { processarMensagem, limparHistorico } = require('../controllers/chatController');

const router = express.Router();

// POST   /api/chat         -> conversa com a IA
router.post('/', processarMensagem);

// DELETE /api/chat/limpar  -> apaga o histórico do MongoDB
router.delete('/limpar', limparHistorico);

module.exports = router;