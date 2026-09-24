const express = require('express');
const { gerarPDF } = require('../controllers/pdfController');

const router = express.Router();

// POST /api/pdf -> gera o PDF com o resumo da conversa
router.post('/', gerarPDF);

module.exports = router;