const express = require("express");
const { createServer } = require("http");
const { Server } = require('socket.io');
const { initEvent } = require("./socker-io");

const app = express();
const server = createServer(app);
const io = new Server(server);

io.on('connection', (socket) => {
    console.log('got a connection');

    initEvent(socket);
});

app.use('/', express.static('static'));

server.listen(9632, () => {
    console.log('server running at http://127.0.0.1:9632');
});