const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const { initOllama } = require('./ollamaManager');
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const externalRoutes = require('./routes/external');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/external', externalRoutes);

// Serve Frontend (Fallback for SPA)
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initialize Ollama and start server
async function startServer() {
    try {
        console.log('Initializing Ollama...');
        // We run this in the background to not block server start
        initOllama().catch(err => console.error('Ollama Init Error:', err));
        
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
    }
}

startServer();
