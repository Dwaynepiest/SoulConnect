const express = require('express');
const router = express.Router();
const db = require('../db');

// Endpoint to create a chat room
router.post('/', (req, res) => {
    const { user1_id, user2_id } = req.body;

    if (!user1_id || !user2_id) {
        return res.status(400).send({ message: 'Both user IDs are required.' });
    }

    // Ensure user1_id is less than user2_id to avoid duplicates
    const sortedUserIds = [user1_id, user2_id].sort((a, b) => a - b);

    const queryCheck = `
        SELECT * FROM chat_rooms 
        WHERE (user1_id = ? AND user2_id = ?)
    `;

    db.query(queryCheck, [sortedUserIds[0], sortedUserIds[1]], (err, results) => {
        if (err) {
            return res.status(500).send({ message: 'Database error.', error: err });
        }

        // Check if the chat room already exists
        if (results.length > 0) {
            return res.status(409).send({ message: 'Chat room already exists.' });
        }

        // If it doesn't exist, create a new chat room
        const queryInsert = `
            INSERT INTO chat_rooms (user1_id, user2_id) 
            VALUES (?, ?)
        `;

        db.query(queryInsert, [sortedUserIds[0], sortedUserIds[1]], (err, results) => {
            if (err) {
                return res.status(500).send({ message: 'Failed to create chat room.', error: err });
            }
            res.status(201).send({ message: 'Chat room created successfully.', room_id: results.insertId });
        });
    });
});

module.exports = router;