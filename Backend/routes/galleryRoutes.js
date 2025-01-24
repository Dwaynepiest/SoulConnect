const express = require('express');
const router = express.Router();
const db = require('../db');
const apiKeyMiddleware = require('../middlewares/apiKeyMiddleware');

router.get('/', apiKeyMiddleware, (req, res) => {
    db.query('SELECT * FROM gallery', (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
  });

router.post('/', apiKeyMiddleware, async (req, res) => {
    const { title, description } = req.body;
  
    console.log('Request body:', req.body); // Log de request body voor debugging
  
    // Controleer of beide velden aanwezig zijn
    if (!title || !description) {
      return res.status(400).send('Titel en beschrijving zijn verplicht.');
    }
  
    try {
      // Voeg de nieuwe post toe aan de database
      db.query(
        'INSERT INTO gallery title, description) VALUES (?, ?)',
        [title, description],
        (err, results) => {
          if (err) {
            return res.status(500).send('Fout bij het toevoegen van de post aan de database.');
          }
  
          res.json({
            message: 'gallery succesvol aangemaakt.',
            id: results.insertId,
            title,
            description,
          });
        }
      );
    } catch (err) {
      console.error('Fout bij het verwerken van de aanvraag:', err);
      res.status(500).send('Er is een fout opgetreden bij het aanmaken van de gallery.');
    }
  });
  



  module.exports = router;