// server name: stock tracker server
// description: Provides a stream of live stock prices to the frontend
// app stock tracker, on every connection to this server.
const http = require('http');
const express = require('express');
const app = express();
const server = http.createServer(app);
const mongoose=require('mongoose');
const dotenv = require("dotenv");

dotenv.config();

const io = require('socket.io')(server, {
    cors: {
        origin: "https://stock-tracker-demo.netlify.app",
    },
});

const socketConnection=require('./socketio');

socketConnection(io);

// connect to mongodb
mongoose.connect(process.env.MONGO_URL)
        .then(()=>{console.log('db connected');})
        .catch((err)=>{console.log('error db'+err);});


const port = process.env.PORT || 3004;

server.listen(port, ()=>{
    console.log(`port is ${port}`);
});

