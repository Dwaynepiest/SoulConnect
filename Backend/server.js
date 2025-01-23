const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const db = require('./db'); // Import the database connection
const port = 3001;
const crypto = require('crypto');
const nodemailer = require('nodemailer');
require('dotenv').config();

// const likesRoutes = require('./controllers/Likes');


const apiKeyMiddleware = (req, res, next) => {
  const apiKey = req.headers['api-key']; // API key is sent in the 'x-api-key' header

  if (!apiKey || apiKey !== process.env.API_KEY) {
      return res.status(403).send('Forbidden: Geen geldige API Key');
  }
  next(); // Proceed to the next middleware/route handler
};

const validatePassword = (password) => {
  const minLength = 16;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[@$!%*?&#]/.test(password);

  return password.length >= minLength && hasUppercase && hasLowercase && hasNumber && hasSpecialChar;
};

const corsOptions = {
    origin: 'http://localhost:3001', // Specifieke origin
    credentials: true 
  }
// Create an Express app
const app = express();
app.use(cors(corsOptions)); // To allow cross-origin requests
app.use(express.json()); // To parse JSON bodies

// app.use('/api', apiKeyMiddleware, likesRoutes);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'dwaynepiest@gmail.com',
    pass: 'xigf bflc yymj olqm', // Gebruik een app-specifiek wachtwoord in plaats van je echte wachtwoord
  },
});

app.post('/users', apiKeyMiddleware, async (req, res) => {
  const { 
    nickname, 
    email, 
    password, 
    birth_date, 
    zip_code, 
    gender, 
    accept_service, 
    payment, 
    foto, 
    admin 
  } = req.body;

  // Validate password strength
  if (!validatePassword(password)) {
    return res.status(400).send('Wachtwoord voldoet niet aan de vereisten. Minimaal 8 tekens, inclusief hoofdletter, kleine letter, nummer en speciaal teken.');
  }

  // Validate accept_service (must be true)
  if (!accept_service) {
    return res.status(400).send('Je moet akkoord gaan met de servicevoorwaarden.');
  }

  try {
    // Check if the email already exists
    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
      if (err) {
        return res.status(500).send('Databasefout bij het controleren van e-mail.');
      }

      if (results.length > 0) {
        return res.status(400).send('Een gebruiker met dit e-mailadres bestaat al.');
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Generate a verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationLink = `http://localhost:3001/verify-email?token=${verificationToken}`;

      // Insert the new user with is_verified set to 0
      db.query(
        'INSERT INTO users (nickname, email, password, birth_date, zip_code, gender, accept_service, payment, foto, admin, is_verified, verification_token) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)',
        [nickname, email, hashedPassword, birth_date, zip_code, gender, accept_service, payment, foto, admin, verificationToken],
        async (err, results) => {
          if (err) {
            return res.status(500).send(err);
          }

          // Send verification email
          const mailOptions = {
            from: 'info@soulconnect.com',
            to: email,
            subject: 'Verifieer je e-mailadres',
            html: `
              <p>Hallo ${nickname},</p>
              <p>Bedankt voor je registratie. Klik op de onderstaande link om je e-mailadres te verifiëren:</p>
              <a href="${verificationLink}">${verificationLink}</a>
              <p>Als je je niet hebt geregistreerd, kun je deze e-mail negeren.</p>
            `,
          };

          transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
              console.error('Error sending email:', err); // Log de exacte foutmelding
              return res.status(500).send(err);
            }

            res.json({
              message: 'Gebruiker succesvol geregistreerd. Controleer je e-mail om je account te verifiëren.',
              id: results.insertId,
              nickname,
              email,
            });
          });
        }
      );
    });
  } catch (err) {
    console.error('Error hashing password: ', err);
    res.status(500).send('Error occurred during registration.');
  }
});

app.get('/verify-email', (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).send('Geen verificatietoken opgegeven.');
  }

  // Zoek de gebruiker op basis van de verificatietoken
  db.query('SELECT * FROM users WHERE verification_token = ?', [token], (err, results) => {
    if (err) {
      return res.status(500).send('Databasefout bij het controleren van de token.');
    }

    if (results.length === 0) {
      return res.status(400).send('Ongeldige of verlopen verificatietoken.');
    }

    // De gebruiker is gevonden, dus werk de verificatie bij naar 1
    db.query('UPDATE users SET is_verified = 1, verification_token = NULL WHERE verification_token = ?', [token], (err) => {
      if (err) {
        return res.status(500).send('Fout bij het verifiëren van de gebruiker.');
      }

      res.send('E-mailadres succesvol geverifieerd. Je kunt nu inloggen.');
    });
  });
});


app.post('/users/login', async (req, res) => {
  const { email, password } = req.body;

  db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
      if (err) return res.status(500).send('Er is een fout opgetreden.');
      
      if (results.length === 0) return res.status(400).send('Gebruiker niet gevonden.');

      const klant = results[0];

      try {
          const isMatch = await bcrypt.compare(password, klant.password);
          if (!isMatch) return res.status(400).send('Onjuist wachtwoord.');

          delete klant.password; // Remove the password from the response
          res.json(klant);
      } catch (compareError) {
          return res.status(500).send('Er is een fout opgetreden tijdens het vergelijken van wachtwoorden.');
      }
  });
});

app.get('/extra', apiKeyMiddleware, (req, res) => {
  db.query('SELECT * FROM extra', (err, results) => {
      if (err) return res.status(500).send(err);
      res.json(results);
  });
});

app.get('/admin', apiKeyMiddleware, (req, res) => {
  db.query('SELECT * FROM admin', (err, results) => {
      if (err) return res.status(500).send(err);
      res.json(results);
  });
});

app.get('/relatieschap', apiKeyMiddleware, (req, res) => {
  db.query('SELECT * FROM relatieschap', (err, results) => {
      if (err) return res.status(500).send(err);
      res.json(results);
  });
});


app.post('/like', apiKeyMiddleware, (req, res) => {
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

app.get('/matches/:userId', apiKeyMiddleware, (req, res) => {
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

app.get('/match/:userId/:likedUserId', apiKeyMiddleware, (req, res) => {
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

app.delete('/unlike', apiKeyMiddleware, (req, res) => {
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




// Start the serverx
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});

