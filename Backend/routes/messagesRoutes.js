const express = require('express');
const router = express.Router();
const db = require('../db');
const socketIo = require('socket.io');
const http = require('http');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const crypto = require('crypto');

const key = process.env.ENCRYPTION_KEY;
const ENCRYPTION_KEY = Buffer.from(key.padEnd(44, '='), 'base64');
const IV_LENGTH = 16; // AES block size

function encrypt(text) {
    let iv = crypto.randomBytes(IV_LENGTH);
    let cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text) {
    if (!text) {
        throw new Error('Invalid text for decryption');
    }
    let textParts = text.split(':');
    if (textParts.length !== 2) {
        throw new Error('Invalid encrypted text format');
    }

    let iv = Buffer.from(textParts[0], 'hex');
    let encryptedText = Buffer.from(textParts[1], 'hex');

    let decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
}

// Endpoint to send a message
router.post('/', (req, res) => {
    const { room_id, user_id, message_text } = req.body;
    const encryptedMessage = encrypt(message_text);

    const query = 'INSERT INTO chat_messages (room_id, user_id, message_text) VALUES (?, ?, ?)';
    
    db.query(query, [room_id, user_id, encryptedMessage], (err) => {
        if (err) return res.status(500).send(err);
        
        // Emit the new message (unencrypted for the frontend)
        io.to(room_id).emit('new-message', { user_id, message_text });
        res.status(200).send('Message sent securely');
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

        const decryptedResults = results.map((message) => {
            // Check if message_text exists before decrypting
            if (!message.message_text) {
                console.warn(`Skipping decryption for message_id: ${message.message_id}, message_text is null/undefined`);
                return { ...message, message_text: null };
            }

            try {
                return {
                    ...message,
                    message_text: decrypt(message.message_text),
                };
            } catch (error) {
                console.error(`Error decrypting message_id: ${message.message_id}`, error);
                return { ...message, message_text: '[Decryption Failed]' };
            }
        });

        res.status(200).json(decryptedResults);
    });
});

// Socket.io connection
io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('join-room', (room_id) => {
        socket.join(room_id);
        console.log(`User joined room: ${room_id}`);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

module.exports = router;

// const express = require('express');
// const router = express.Router();
// const db = require('../db');
// const socketIo = require('socket.io');
// const http = require('http');
// const app = express();
// const server = http.createServer(app);
// const io = socketIo(server);
// const bcrypt = require('bcrypt');


// // Endpoint to send a message
// router.post('/', (req, res) => {
//     const { room_id, user_id, message_text } = req.body; // Changed sender_id to user_id
//     const query = 'INSERT INTO chat_messages (room_id, user_id, message_text) VALUES (?, ?, ?)';
    
//     db.query(query, [room_id, user_id, message_text], (err) => {
//       if (err) return res.status(500).send(err);
      
//       // Emit the new message to the room
//       io.to(room_id).emit('new-message', { user_id, message_text });
//       res.status(200).send('Message sent');
//     });
//   });
  
// router.get('/:room_id', (req, res) => {
//     const room_id = req.params.room_id;
//     const query = `
//       SELECT cm.message_id, cm.room_id, cm.message_text, cm.sent_at, u.nickname AS sender_name
//       FROM chat_messages cm
//       JOIN users u ON cm.user_id = u.user_id
//       WHERE cm.room_id = ? ORDER BY cm.sent_at ASC
//     `;
  
//     db.query(query, [room_id], (err, results) => {
//       if (err) return res.status(500).send(err);
//       res.status(200).json(results);
//     });
//   });


//    // Socket.io connection
//    io.on('connection', (socket) => {
//     console.log('A user connected');
  
//     socket.on('join-room', (room_id) => {
//       socket.join(room_id);
//       console.log(`User  joined room: ${room_id}`);
//     });
  
//     socket.on('disconnect', () => {
//       console.log('User  disconnected');
//     });
//   });

//   module.exports = router;