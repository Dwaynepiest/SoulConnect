const express = require('express');
const router = express.Router();
const db = require('../db');
const apiKeyMiddleware = require('../middlewares/apiKeyMiddleware');

router.post('/', apiKeyMiddleware, (req, res) => {
  const { userId, likedUserId } = req.body;

  // Check if the user has already liked the other user
  db.query('SELECT * FROM likes WHERE user_id = ? AND liked_user_id = ?', [userId, likedUserId], (err, results) => {
    if (err) return res.status(500).send(err);

    if (results.length > 0) {
      return res.status(400).json({ message: 'You already liked this user' });
    }

    // Insert like
    db.query('INSERT INTO likes (user_id, liked_user_id) VALUES (?, ?)', [userId, likedUserId], (err) => {
      if (err) return res.status(500).send(err);

      // Check for mutual like to create a match
      db.query('SELECT * FROM likes WHERE user_id = ? AND liked_user_id = ?', [likedUserId, userId], (err, mutualResults) => {
        if (err) return res.status(500).send(err);

        if (mutualResults.length > 0) {
          // Avoid duplicate matches
          db.query('SELECT * FROM matches WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)',
            [userId, likedUserId, likedUserId, userId], (err, matchResults) => {
              if (err) return res.status(500).send(err);

              if (matchResults.length === 0) {
                db.query('INSERT INTO matches (user1_id, user2_id) VALUES (?, ?)', 
                  [Math.min(userId, likedUserId), Math.max(userId, likedUserId)], (err) => {
                    if (err) return res.status(500).send(err);
                    return res.json({ message: 'It\'s a match!' });
                  });
              } else {
                return res.json({ message: 'User liked successfully. A match already exists.' });
              }
            });
        } else {
          res.json({ message: 'User liked successfully' });
        }
      });
    });
  });
});

router.delete('/', apiKeyMiddleware, (req, res) => {
  const { userId, likedUserId } = req.body;

  // Remove user's like from the 'likes' table
  db.query(
    'DELETE FROM likes WHERE user_id = ? AND liked_user_id = ?',
    [userId, likedUserId],
    (err, result) => {
      if (err) return res.status(500).send(err);

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Like not found' });
      }

      // Check if a match exists between the users
      db.query(
        'SELECT * FROM matches WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)',
        [userId, likedUserId, likedUserId, userId],
        (err, matchResults) => {
          if (err) return res.status(500).send(err);

          // If a match exists, remove it
          if (matchResults.length > 0) {
            db.query(
              'DELETE FROM matches WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)',
              [userId, likedUserId, likedUserId, userId],
              (err) => {
                if (err) return res.status(500).send(err);
                return res.json({ message: 'Like removed, match deleted' });
              }
            );
          } else {
            res.json({ message: 'Like removed, no match existed' });
          }
        }
      );
    }
  );
});

router.get('/:userId', apiKeyMiddleware, (req, res) => {
  const { userId } = req.params;

  // Query to get all users who liked the given userId
  db.query('SELECT user_id FROM likes WHERE liked_user_id = ?', [userId], (err, results) => {
    if (err) return res.status(500).send(err);

    if (results.length === 0) {
      return res.json({ message: 'No one has liked you yet' });
    }

    res.json({ likedBy: results });
  });
});


module.exports = router;
