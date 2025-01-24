const express = require('express');
const router = express.Router();
const db = require('../db');
const socketIo = require('socket.io');
const http = require('http');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const crypto = require('crypto');


// Endpoint to send a message
router.post('/', (req, res) => {
    const { room_id, user_id, message_text } = req.body; // Changed sender_id to user_id
    const query = 'INSERT INTO chat_messages (room_id, user_id, message_text) VALUES (?, ?, ?)';
    
    db.query(query, [room_id, user_id, message_text], (err) => {
      if (err) return res.status(500).send(err);
      
      // Emit the new message to the room
      io.to(room_id).emit('new-message', { user_id, message_text });
      res.status(200).send('Message sent');
    });
  });
  
router.get('/:room_id', (req, res) => {
    const room_id = req.params.room_id;
    const query = `
      SELECT cm.message_id, cm.room_id, cm.message_text, cm.sent_at, u.nickname AS sender_name
      FROM chat_messages cm
      JOIN users u ON cm.user_id = u.user_id
      WHERE cm.room_id = ? ORDER BY cm.sent_at ASC
    `;
  
    db.query(query, [room_id], (err, results) => {
      if (err) return res.status(500).send(err);
      res.status(200).json(results);
    });
  });


   // Socket.io connection
   io.on('connection', (socket) => {
    console.log('A user connected');
  
    socket.on('join-room', (room_id) => {
      socket.join(room_id);
      console.log(`User  joined room: ${room_id}`);
    });
  
    socket.on('disconnect', () => {
      console.log('User  disconnected');
    });
  });

  module.exports = router;