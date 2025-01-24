const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const db = require('../db');
const apiKeyMiddleware = require('../middlewares/apiKeyMiddleware');
const validatePassword = require('../utils/validatePassword');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.USER,
    pass: process.env.PASS, // Gebruik een app-specifiek wachtwoord in plaats van je echte wachtwoord
  },
  tls: {
    rejectUnauthorized: false // Voeg deze regel toe om zelfondertekende certificaten toe te staan
  }
});

router.get('/', apiKeyMiddleware, (req, res) => {
  db.query('SELECT * FROM users', (err, results) => {
      if (err) return res.status(500).send(err);
      res.json(results);
  });
});

router.post('/', async (req, res) => {
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

  console.log('Request body:', req.body); // Log the request body for debugging

  // Validate password strength
  if (!validatePassword(password)) {
    return res.status(400).send('Wachtwoord voldoet niet aan de vereisten. Minimaal 16 tekens, inclusief hoofdletter, kleine letter, nummer en speciaal teken.');
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
        'INSERT INTO users (nickname, email, password, birth_date, zip_code, gender, accept_service, foto, is_verified, verification_token) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)',
        [nickname, email, hashedPassword, birth_date, zip_code, gender, accept_service, foto, verificationToken],
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
              message: 'Account succesvol geregistreerd. Controleer je e-mail om je account te verifiëren.',
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



router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
      if (err) return res.status(500).send('Er is een fout opgetreden.');
      
      if (results.length === 0) return res.status(400).send('Account niet gevonden.');

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

router.put('/:id', async (req, res) => {
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
      return res.status(404).send('Account niet gevonden.');
    }

    const user = results[0];

    // Controleer of het e-mailadres wordt bijgewerkt en of het al bestaat
    if (email && email !== user.email) {
      db.query('SELECT * FROM users WHERE email = ?', [email], (err, emailResults) => {
        if (err) {
          return res.status(500).send('Databasefout bij het controleren van e-mail.');
        }

        if (emailResults.length > 0) {
          return res.status(400).send('Een account met dit e-mailadres bestaat al.');
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
            message: 'Account succesvol bijgewerkt',
            id,
            ...updatedUser,
          });
        }
      );
    }
  });
});

router.delete('/:user_id', async (req, res) => {
  const { user_id } = req.params; // Haal user_id uit de URL-parameter

  console.log('Request params:', req.params); // Log de request parameters voor debugging

  if (!user_id) {
    return res.status(400).send('User ID is vereist om een gebruiker te verwijderen.');
  }

  try {
    // Controleer of de gebruiker bestaat
    db.query('SELECT * FROM users WHERE user_id = ?', [user_id], (err, results) => {
      if (err) {
        return res.status(500).send('Databasefout bij het zoeken naar gebruiker.');
      }

      if (results.length === 0) {
        return res.status(404).send('Geen account gevonden');
      }

      // Verwijder de gebruiker uit de database
      db.query('DELETE FROM users WHERE user_id = ?', [user_id], (err, results) => {
        if (err) {
          return res.status(500).send('Fout bij het verwijderen van je account, contacteer een beheerder!.');
        }

        res.json({
          message: 'Account succesvol verwijderd.',
          user_id,
        });
      });
    });
  } catch (err) {
    console.error('Error during user deletion:', err);
    res.status(501).send('Er is een fout opgetreden tijdens het verwijderen van je account, contacteer een beheerder!.');
  }
});

module.exports = router;
