const express = require('express');
const WebSocket = require('ws');
const path = require('path');

// Create Express app
const app = express();
const port = process.env.PORT || 8080;

// Serve static files from the current directory
// app.use(express.static(path.join(__dirname)));

// Serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'client.html'));
});

// Create HTTP server
const server = app.listen(port, () => {
    console.log(`HTTP server running on http://localhost:${port}`);
});

// Create WebSocket server attached to HTTP server
const wss = new WebSocket.Server({ server });
const users = new Set();

wss.on('connection', (ws) => {
    console.log('A new client connected!');
    let username = '';

    // Broadcast to all clients
    ws.on('message', (message) => {
        console.log(`Received: ${message}`);
        const data = JSON.parse(message);

        if (data.type === 'login') {
            if (users.has(data.username)) {
                ws.send(JSON.stringify({
                    type: 'login_error',
                    message: 'Username already exists'
                }));
            } else {
                username = data.username;
                users.add(username);
                ws.send(JSON.stringify({
                    type: 'login_success',
                    username: username
                }));
                broadcastMessage({
                    type: 'system',
                    message: `${username} has joined the chat`
                });
            }
        } else if (data.type === 'message') {
            broadcastMessage({
                type: 'message',
                username: username,
                message: data.message
            });
        }
    });

    ws.on('close', () => {
        if (username) {
            users.delete(username);
            broadcastMessage({
                type: 'system',
                message: `${username} has left the chat`
            });
        }
    });

    function broadcastMessage(message) {
        wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(message));
            }
        });
    }
});

console.log('WebSocket server is running on ws://localhost:8080');