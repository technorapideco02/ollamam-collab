const express = require('express');
const router = express.Router();
const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const MODEL = process.env.OLLAMA_MODEL || 'qwen3.5:9b';

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Date/Time Interceptor
const checkDateTimeQuery = (text) => {
    const lowerText = text.toLowerCase();
    const now = new Date();
    
    if (lowerText.includes('what time') || lowerText.includes('current time')) {
        return `The current system time is ${now.toLocaleTimeString()}.`;
    }
    if (lowerText.includes('what date') || lowerText.includes('today\'s date') || lowerText.includes('what is the date')) {
        return `Today's date is ${now.toLocaleDateString()}.`;
    }
    if (lowerText.includes('what day') || lowerText.includes('which day')) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return `Today is ${days[now.getDay()]}.`;
    }
    return null;
};

router.post('/', authenticateToken, async (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ message: 'Message is required' });

    // Check for date/time queries first
    const interceptResponse = checkDateTimeQuery(message);
    if (interceptResponse) {
        return res.json({ response: interceptResponse, thinking: '.......' });
    }

    try {
        const response = await axios.post('http://localhost:11434/api/generate', {
            model: MODEL,
            prompt: message,
            stream: false
        });

        res.json({ 
            response: response.data.response, 
            thinking: '.......' // Thinking is shown as requested
        });
    } catch (error) {
        console.error('Error from Ollama:', error.message);
        res.status(500).json({ message: 'Error communicating with Ollama', error: error.message });
    }
});

module.exports = router;
