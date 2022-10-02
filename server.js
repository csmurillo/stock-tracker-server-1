// server name: stock tracker server
// description: Provides a stream of live stock prices to the frontend
// app stock tracker, on every connection to this server.
const http = require('http');
const express = require('express');
const app = express();
const server = http.createServer(app);
const mongoose=require('mongoose');

const io = require('socket.io')(server, {
    cors: {
        origin: process.env.ORGIN_URL,
    },
});

const socketConnection=require('./socketio');

socketConnection(io);

// connect to mongodb
mongoose.connect(process.env.MONGO_URL)
        .then(()=>{console.log('db connected');})
        .catch(()=>{console.log('error db');});

const port = process.env.PORT || 3004;

server.listen(port, ()=>{
    console.log(`port is ${port}`);
});

