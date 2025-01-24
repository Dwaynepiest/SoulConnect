const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const db = require('../db');

router.get('/', (req, res) => {
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
          return res.status(500).send('Fout bij het verifiëren van je account, contacteer een beheerder');
        }
  
        res.send('E-mailadres succesvol geverifieerd. Je kunt nu inloggen.');
      });
    });
  });

  module.exports = router;