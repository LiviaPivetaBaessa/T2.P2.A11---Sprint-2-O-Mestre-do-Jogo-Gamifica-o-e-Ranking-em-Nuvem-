const mongoose = require('mongoose');

// Cada jogador tem um nome único e um total de XP
const JogadorSchema = new mongoose.Schema({
    nome: { type: String, required: true, unique: true, trim: true },
    xp: { type: Number, default: 0 }
}, { timestamps: true }); // cria createdAt e updatedAt automaticamente

// 3º parâmetro força o nome da collection como "jogadores"
// (sem ele, o Mongoose criaria "jogadors")
const Jogador = mongoose.model('Jogador', JogadorSchema, 'jogadores');

module.exports = Jogador;