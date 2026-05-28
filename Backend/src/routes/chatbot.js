const express = require('express');
const router = express.Router();
const { getKnowledge, addKnowledge, updateKnowledge, deleteKnowledge } = require('../controllers/chatbotController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Public route for the chatbot itself
router.get('/knowledge', getKnowledge);

// Admin-only routes for training/managing knowledge
router.post('/knowledge', authMiddleware, adminMiddleware, addKnowledge);
router.put('/knowledge/:id', authMiddleware, adminMiddleware, updateKnowledge);
router.delete('/knowledge/:id', authMiddleware, adminMiddleware, deleteKnowledge);

module.exports = router;
