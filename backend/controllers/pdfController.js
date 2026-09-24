const { GoogleGenerativeAI } = require('@google/generative-ai');
const PDFDocument = require('pdfkit');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

/**
 * POST /api/pdf
 * Recebe o histórico em texto, pede um resumo à IA e devolve um PDF.
 */
async function gerarPDF(req, res) {
    try {
        const { historico } = req.body;
        if (!historico) return res.status(400).json({ erro: 'Histórico vazio.' });

        const prompt = `Resuma os pontos principais desta conversa para um relatório. ` +
            `Responda em texto simples, sem Markdown:\n\n${historico}`;
        const result = await model.generateContent(prompt);
        const resumoIA = result.response.text();

        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=resumo-conversa.pdf');

        doc.pipe(res);
        doc.fontSize(22).fillColor('#007bff').text('Relatório da Conversa', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).fillColor('black').text(resumoIA);
        doc.end();

    } catch (erro) {
        console.error('❌ Erro ao gerar PDF:', erro);
        res.status(500).json({ erro: 'Erro ao gerar PDF.' });
    }
}

module.exports = { gerarPDF };