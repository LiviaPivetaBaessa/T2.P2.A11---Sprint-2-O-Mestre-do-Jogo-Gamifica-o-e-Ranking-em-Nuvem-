const express = require('express');
const { listarRanking } = require('../controllers/rankingController');

const router = express.Router();

// GET /api/ranking -> Top 10 jogadores por XP
router.get('/', listarRanking);

module.exports = router;