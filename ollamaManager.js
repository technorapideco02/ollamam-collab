const { exec, spawn } = require('child_process');
const axios = require('axios');
require('dotenv').config();

const MODEL = process.env.OLLAMA_MODEL || 'qwen3.5:9b';

async function checkOllamaInstalled() {
    return new Promise((resolve) => {
        exec('ollama --version', (error) => {
            if (error) {
                console.log('Ollama not found. Attempting to install via brew...');
                resolve(false);
            } else {
                resolve(true);
            }
        });
    });
}

async function installOllama() {
    return new Promise((resolve, reject) => {
        console.log('Installing Ollama...');
        exec('brew install ollama', (error, stdout, stderr) => {
            if (error) {
                console.error(`Error installing Ollama: ${stderr}`);
                reject(error);
            } else {
                console.log('Ollama installed successfully.');
                resolve(true);
            }
        });
    });
}

async function isOllamaRunning() {
    try {
        await axios.get('http://localhost:11434/api/tags');
        return true;
    } catch (error) {
        return false;
    }
}

async function startOllama() {
    console.log('Starting Ollama service...');
    const ollamaProcess = spawn('ollama', ['serve'], {
        detached: true,
        stdio: 'ignore'
    });
    ollamaProcess.unref();
    
    // Wait for it to start
    for (let i = 0; i < 10; i++) {
        if (await isOllamaRunning()) {
            console.log('Ollama is now running.');
            return true;
        }
        await new Promise(r => setTimeout(r, 2000));
    }
    throw new Error('Failed to start Ollama after multiple attempts.');
}

async function checkAndPullModel() {
    try {
        console.log(`Checking for model ${MODEL}...`);
        const response = await axios.get('http://localhost:11434/api/tags');
        const models = response.data.models || [];
        const exists = models.some(m => m.name === MODEL || m.name.startsWith(MODEL));
        
        if (!exists) {
            console.log(`Model ${MODEL} not found. Pulling... (This may take a while)`);
            // Pulling can take a long time, we'll use a promise-wrapped exec or spawn
            return new Promise((resolve, reject) => {
                const pull = spawn('ollama', ['pull', MODEL]);
                pull.stdout.on('data', (data) => console.log(`Pulling ${MODEL}: ${data}`));
                pull.stderr.on('data', (data) => console.error(`Pull Error: ${data}`));
                pull.on('close', (code) => {
                    if (code === 0) {
                        console.log(`Model ${MODEL} pulled successfully.`);
                        resolve(true);
                    } else {
                        reject(new Error(`Failed to pull model ${MODEL}. Exit code: ${code}`));
                    }
                });
            });
        } else {
            console.log(`Model ${MODEL} is already installed.`);
            return true;
        }
    } catch (error) {
        console.error('Error checking models:', error.message);
        throw error;
    }
}

async function initOllama() {
    const installed = await checkOllamaInstalled();
    if (!installed) {
        await installOllama();
    }

    const running = await isOllamaRunning();
    if (!running) {
        await startOllama();
    }

    await checkAndPullModel();
    console.log('Ollama initialization complete.');
}

module.exports = { initOllama };
