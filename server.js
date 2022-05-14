const http = require('http');
const express = require('express');
const app = express();
const server = http.createServer(app);

const io = require('socket.io')(server, {
    cors: {
        origin: "http://localhost:3000",
    },
});

const socketConnection=require('./socketio');

socketConnection(io);

const port = process.env.PORT || 3004;

server.listen(port, ()=>{
    console.log(`port is ${port}`);
});