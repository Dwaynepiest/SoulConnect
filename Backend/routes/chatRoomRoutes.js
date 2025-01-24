const express = require('express');
const router = express.Router();
const db = require('../db');

// Endpoint to create a chat room
router.post('/', (req, res) => {
    const { user1_id, user2_id } = req.body;
    const query = 'INSERT INTO chat_rooms (user1_id, user2_id) VALUES (?, ?)';
    
    db.query(query, [user1_id, user2_id], (err, results) => {
      if (err) return res.status(500).send(err);
      res.status(201).send({ room_id: results.insertId });
    });
  });

module.exports = router;