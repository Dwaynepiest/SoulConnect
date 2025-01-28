const express = require('express');
const router = express.Router();
const db = require('../db');
const apiKeyMiddleware = require('../middlewares/apiKeyMiddleware');

router.get('/:userId', apiKeyMiddleware, (req, res) => {
  const { userId } = req.params;

  // Get matches where the user is involved
  db.query(
    'SELECT m.match_id, u1.user_id AS user1_id, u1.nickname AS user1_nickname, u2.user_id AS user2_id, u2.nickname AS user2_nickname ' +
    'FROM matches m ' +
    'JOIN users u1 ON m.user1_id = u1.user_id ' +
    'JOIN users u2 ON m.user2_id = u2.user_id ' +
    'WHERE m.user1_id = ? OR m.user2_id = ?',
    [userId, userId],
    (err, results) => {
      if (err) return res.status(500).send(err);

      if (results.length === 0) {
        return res.status(404).json({ message: 'No matches found' });
      }

      res.json({ matches: results });
    }
  );
});

router.get('/:userId/:likedUserId', apiKeyMiddleware, (req, res) => {
  const { userId, likedUserId } = req.params;

  // Check for a match between userId and likedUserId
  db.query(
    'SELECT * FROM matches WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)',
    [userId, likedUserId, likedUserId, userId],
    (err, results) => {
      if (err) return res.status(500).send(err);

      if (results.length === 0) {
        return res.status(404).json({ message: 'No match found between these users' });
      }

      res.json({ match: results[0] });
    }
  );
});

module.exports = router;
