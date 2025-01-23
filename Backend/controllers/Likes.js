// const express = require('express');
// const router = express.Router();
// const db = require('../db'); // Database connection

// router.post('/like', async (req, res) => {
//     const { liker_id, liked_id } = req.body;

//     try {
//         // Insert like
//         await db.query('INSERT INTO likes (liker_id, liked_id) VALUES (?, ?)', [liker_id, liked_id]);

//         // Check if the liked user has already liked back (mutual like)
//         const [mutualLike] = await db.query(
//             'SELECT * FROM likes WHERE liker_id = ? AND liked_id = ?',
//             [liked_id, liker_id]
//         );

//         let isMatch = false;
//         if (mutualLike.length > 0) {
//             // Mutual like exists, create a match
//             await db.query(
//                 'INSERT INTO matches (user1_id, user2_id) VALUES (?, ?)',
//                 [liker_id, liked_id]
//             );
//             isMatch = true;
//         }

//         res.status(200).json({
//             message: "Like registered",
//             match: isMatch
//         });

//     } catch (error) {
//         if (error.code === 'ER_DUP_ENTRY') {
//             return res.status(400).json({ message: 'You already liked this user.' });
//         }
//         console.error('Error liking user:', error);
//         res.status(500).json({ message: 'Internal server error' });
//     }
// });

// // Get user likes
// router.get('/likes/:userId', async (req, res) => {
//     const { userId } = req.params;

//     try {
//         const [likes] = await db.query(
//             'SELECT liked_id FROM likes WHERE liker_id = ?',
//             [userId]
//         );

//         res.status(200).json({ likes });
//     } catch (error) {
//         console.error('Error fetching likes:', error);
//         res.status(500).json({ message: 'Internal server error' });
//     }
// });

// // Get user matches
// router.get('/matches/:userId', async (req, res) => {
//     const { userId } = req.params;

//     try {
//         const [matches] = await db.query(
//             `SELECT user1_id, user2_id 
//              FROM matches 
//              WHERE user1_id = ? OR user2_id = ?`,
//             [userId, userId]
//         );

//         res.status(200).json({ matches });
//     } catch (error) {
//         console.error('Error fetching matches:', error);
//         res.status(500).json({ message: 'Internal server error' });
//     }
// });

// module.exports = router;