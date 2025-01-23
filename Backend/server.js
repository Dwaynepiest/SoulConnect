const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const db = require('./db'); // Import the database connection
const port = 3001;
const crypto = require('crypto');
const nodemailer = require('nodemailer');
require('dotenv').config();


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
    foto
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

app.get('/verify-email', apiKeyMiddleware, (req, res) => {
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


app.post('/users/login', apiKeyMiddleware, async (req, res) => {
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

app.put('/users/:id', apiKeyMiddleware, async (req, res) => {
  const { id } = req.params;
  const { 
    email, 
    nickname, 
    old_password, 
    new_password, 
    confirm_password, 
    zip_code, 
    gender, 
    foto 
  } = req.body;

  // Haal de bestaande gebruikergegevens op
  db.query('SELECT * FROM users WHERE user_id = ?', [id], async (err, results) => {
    if (err) {
      return res.status(500).send(err);
    }
    if (results.length === 0) {
      return res.status(404).send('Gebruiker niet gevonden.');
    }

    const user = results[0];

    // Controleer of het e-mailadres wordt bijgewerkt en of het al bestaat
    if (email && email !== user.email) {
      db.query('SELECT * FROM users WHERE email = ?', [email], (err, emailResults) => {
        if (err) {
          return res.status(500).send('Databasefout bij het controleren van e-mail.');
        }

        if (emailResults.length > 0) {
          return res.status(400).send('Een gebruiker met dit e-mailadres bestaat al.');
        }

        // Als het e-mailadres geldig is, ga door met bijwerken
        updateUserData();
      });
    } else {
      // Als het e-mailadres niet wordt bijgewerkt of het is geldig, ga door met bijwerken
      updateUserData();
    }

    // Functie om de gebruiker bij te werken
    async function updateUserData() {
      // Als het wachtwoord wordt bijgewerkt, controleren of het oude wachtwoord correct is en het nieuwe wachtwoord is bevestigd
      let updatedPassword = user.password;
      if (new_password) {
        if (old_password) {
          // Vergelijk het oude wachtwoord met het opgeslagen wachtwoord
          const isMatch = await bcrypt.compare(old_password, user.password);
          if (!isMatch) {
            return res.status(400).send('Het oude wachtwoord is incorrect.');
          }
        } else {
          return res.status(400).send('Je moet je oude wachtwoord invoeren.');
        }

        // Controleer of de nieuwe wachtwoorden overeenkomen
        if (new_password !== confirm_password) {
          return res.status(400).send('De nieuwe wachtwoorden komen niet overeen.');
        }

        // Valideer wachtwoordsterkte
        if (!validatePassword(new_password)) {
          return res.status(400).send('Wachtwoord voldoet niet aan de vereisten.');
        }

        // Hash het nieuwe wachtwoord
        updatedPassword = await bcrypt.hash(new_password, 10);
      }

      // Update alleen de velden die zijn meegegeven
      const updatedUser = {
        email: email || user.email,
        nickname: nickname || user.nickname,
        zip_code: zip_code || user.zip_code,
        gender: gender || user.gender,
        foto: foto || user.foto,
        password: updatedPassword, // Zet het gehashte wachtwoord als het is bijgewerkt
      };

      // Bijwerken van de gebruiker in de database
      db.query(
        'UPDATE users SET email = ?, nickname = ?, zip_code = ?, gender = ?, foto = ?, password = ? WHERE user_id = ?',
        [updatedUser.email, updatedUser.nickname, updatedUser.zip_code, updatedUser.gender, updatedUser.foto, updatedUser.password, id],
        (err, updateResults) => {
          if (err) {
            return res.status(500).send(err);
          }

          res.json({
            message: 'Gebruiker succesvol bijgewerkt',
            id,
            ...updatedUser,
          });
        }
      );
    }
  });
});




app.get('/extra', apiKeyMiddleware, (req, res) => {
  db.query('SELECT * FROM extra', (err, results) => {
      if (err) return res.status(500).send(err);
      res.json(results);
  });
});

app.post('/extra/:user_id', apiKeyMiddleware, async (req, res) => {
  const { user_id } = req.params;
  const { education, hobby, about_you, job } = req.body;

  if (!user_id) {
    return res.status(400).send('user_id is verplicht.');
  }

  // Haal bestaande gegevens op voor de opgegeven user_id
  db.query('SELECT * FROM extra WHERE user_id = ?', [user_id], (err, results) => {
    if (err) {
      return res.status(500).send('Databasefout bij het ophalen van gegevens.');
    }

    if (results.length > 0) {
      // Update de gegevens als ze al bestaan
      db.query(
        'UPDATE extra SET education = ?, hobby = ?, about_you = ?, job = ? WHERE user_id = ?',
        [
          education || results[0].education,
          hobby || results[0].hobby,
          about_you || results[0].about_you,
          job || results[0].job,
          user_id,
        ],
        (err) => {
          if (err) {
            return res.status(500).send('Fout bij het bijwerken van de gegevens.');
          }

          res.status(200).json({
            message: 'Gegevens succesvol bijgewerkt.',
            user_id,
            education: education || results[0].education,
            hobby: hobby || results[0].hobby,
            about_you: about_you || results[0].about_you,
            job: job || results[0].job,
          });
        }
      );
    } else {
      // Voeg nieuwe gegevens toe als ze nog niet bestaan
      db.query(
        'INSERT INTO extra (user_id, education, hobby, about_you, job) VALUES (?, ?, ?, ?, ?)',
        [user_id, education, hobby, about_you, job],
        (err, results) => {
          if (err) {
            return res.status(500).send('Fout bij het toevoegen van de gegevens.');
          }

          res.status(201).json({
            message: 'Gegevens succesvol toegevoegd.',
            id: results.insertId,
            user_id,
            education,
            hobby,
            about_you,
            job,
          });
        }
      );
    }
  });
});


app.put('/extra/:user_id', apiKeyMiddleware, async (req, res) => {
  const { user_id } = req.params;
  const { education, hobby, about_you, job } = req.body;

  // Haal de bestaande gebruikersgegevens op
  db.query('SELECT * FROM extra WHERE user_id = ?', [user_id], (err, results) => {
    if (err) {
      return res.status(500).send('Databasefout bij het ophalen van gegevens.');
    }
    if (results.length === 0) {
      return res.status(404).send('Geen gegevens gevonden voor deze gebruiker.');
    }

    const userDetails = results[0];

    // Update alleen de velden die zijn meegegeven in de request body
    const updatedDetails = {
      education: education || userDetails.education,
      hobby: hobby || userDetails.hobby,
      about_you: about_you || userDetails.about_you,
      job: job || userDetails.job
    };

    // Bijwerken van de gegevens in de database
    db.query(
      'UPDATE extra SET education = ?, hobby = ?, about_you = ?, job = ? WHERE user_id = ?',
      [updatedDetails.education, updatedDetails.hobby, updatedDetails.about_you, updatedDetails.job, user_id],
      (err) => {
        if (err) {
          return res.status(500).send('Fout bij het bijwerken van de gegevens.');
        }

        res.json({
          message: 'Gegevens succesvol bijgewerkt.',
          user_id,
          ...updatedDetails,
        });
      }
    );
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


app.post('/relatieschap/:user_id', apiKeyMiddleware, async (req, res) => {
  const { user_id } = req.params;
  const { preference, one_liner, relation, location } = req.body;

  if (!user_id) {
    return res.status(400).send('user_id is verplicht.');
  }

  // Haal bestaande gegevens op voor de opgegeven user_id
  db.query('SELECT * FROM relationship WHERE user_id = ?', [user_id], (err, results) => {
    if (err) {
      return res.status(500).send('Databasefout bij het ophalen van gegevens.');
    }

    if (results.length > 0) {
      // Update de gegevens als ze al bestaan
      db.query(
        'UPDATE relationship SET preference = ?, one_liner = ?, relation = ?, location = ? WHERE user_id = ?',
        [
          preference || results[0].preference,
          one_liner || results[0].one_liner,
          relation || results[0].relation,
          location || results[0].location,
          user_id,
        ],
        (err) => {
          if (err) {
            return res.status(500).send('Fout bij het bijwerken van de gegevens.');
          }

          res.status(200).json({
            message: 'Gegevens succesvol bijgewerkt.',
            user_id,
            preference: preference || results[0].preference,
            one_liner: one_liner || results[0].one_liner,
            relation: relation || results[0].relation,
            location: location || results[0].location,
          });
        }
      );
    } else {
      // Voeg nieuwe gegevens toe als ze nog niet bestaan
      db.query(
        'INSERT INTO relationship (user_id, preference, one_liner, relation, location) VALUES (?, ?, ?, ?, ?)',
        [user_id, preference, one_liner, relation, location],
        (err, results) => {
          if (err) {
            return res.status(500).send('Fout bij het toevoegen van de gegevens.');
          }

          res.status(201).json({
            message: 'Gegevens succesvol toegevoegd.',
            id: results.insertId,
            user_id,
            preference,
            one_liner,
            relation,
            location,
          });
        }
      );
    }
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

// Start the serverx
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});

