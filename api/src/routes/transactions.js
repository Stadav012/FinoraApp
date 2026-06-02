const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { processTransaction } = require('../controllers/transactionController');

const router = express.Router();

// POST /api/transactions/parse
router.post('/parse', requireAuth, processTransaction);

module.exports = router;