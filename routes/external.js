const express = require('express');
const router = express.Router();
const axios = require('axios');
require('dotenv').config();

const MODEL = process.env.OLLAMA_MODEL || 'qwen3.5:9b';
const API_TOKEN = process.env.EXTERNAL_API_TOKEN || 'technorapide@310424';

// Middleware to verify external API token
const verifyApiToken = (req, res, next) => {
    const token = req.headers['x-api-token'] || req.headers['authorization'];
    if (token === API_TOKEN || token === `Bearer ${API_TOKEN}`) {
        next();
    } else {
        res.status(401).json({ message: 'Invalid API Token' });
    }
};

/**
 * @api {post} /api/external/chat Post a message
 * @apiHeader {String} x-api-token Token as: technorapide@310424
 * @apiParam {String} message The message to send to the model
 */
router.post('/chat', verifyApiToken, async (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ message: 'Message is required' });

    try {
        const response = await axios.post('http://localhost:11434/api/generate', {
            model: MODEL,
            prompt: message,
            stream: false
        });

        res.json({ response: response.data.response });
    } catch (error) {
        console.error('Error from Ollama:', error.message);
        res.status(500).json({ message: 'Error communicating with Ollama' });
    }
});

// Documentation Route
router.get('/docs', (req, res) => {
    res.json({
        title: "Technorapide External API Documentation",
        base_url: "/api/external",
        endpoints: [
            {
                method: "POST",
                path: "/chat",
                headers: {
                    "x-api-token": "technorapide@310424"
                },
                body: {
                    "message": "string"
                },
                description: "Post a message to the AI model and get a response."
            }
        ]
    });
});

module.exports = router;
