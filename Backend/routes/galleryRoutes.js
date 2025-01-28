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
  
  router.delete('/:gallery_id', apiKeyMiddleware, async (req, res) => {
    const { gallery_id } = req.params;
  
    console.log('Request parameters:', req.params); // Log de parameters voor debugging
  
    // Controleer of gallery_id aanwezig is
    if (!gallery_id) {
      return res.status(400).send('Gallery ID is verplicht.');
    }
  
    try {
      // Start met het verwijderen van gekoppelde records uit gallery_images
      db.query(
        'DELETE FROM gallery_images WHERE gallery_id = ?',
        [gallery_id],
        (err, results) => {
          if (err) {
            console.error('Fout bij het verwijderen van records uit gallery_images:', err);
            return res.status(500).send('Fout bij het verwijderen van gekoppelde afbeeldingen.');
          }
  
          // Ga verder met het verwijderen van de gallery zelf
          db.query(
            'DELETE FROM gallery WHERE gallery_id = ?',
            [gallery_id],
            (err, results) => {
              if (err) {
                console.error('Fout bij het verwijderen van de gallery:', err);
                return res.status(500).send('Fout bij het verwijderen van de gallery uit de database.');
              }
  
              // Controleer of er iets is verwijderd
              if (results.affectedRows === 0) {
                return res.status(404).send('Gallery met het opgegeven gallery_id niet gevonden.');
              }
  
              res.json({
                message: 'Gallery en gekoppelde afbeeldingen succesvol verwijderd.',
                gallery_id,
              });
            }
          );
        }
      );
    } catch (err) {
      console.error('Fout bij het verwerken van de aanvraag:', err);
      res.status(500).send('Er is een fout opgetreden bij het verwijderen van de gallery.');
    }
  });


  module.exports = router;