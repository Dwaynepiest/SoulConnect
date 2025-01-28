const express = require('express');
const router = express.Router();
const db = require('../db');
const apiKeyMiddleware = require('../middlewares/apiKeyMiddleware');


  router.get('/', apiKeyMiddleware, (req, res) => {
    db.query('SELECT * FROM gallery_images', (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
  });

  router.post('/', apiKeyMiddleware, async (req, res) => {
    const { image_url } = req.body;
  
    console.log('Request body:', req.body); // Log de request body voor debugging
  
    // Controleer of het image_url veld aanwezig is
    if (!image_url) {
      return res.status(400).send('Afbeelding is verplicht.');
    }
  
    try {
      // Voeg de nieuwe post met image_url toe aan de database
      db.query(
        'INSERT INTO gallery_images (image_url) VALUES (?)',
        [image_url],
        (err, results) => {
          if (err) {
            return res.status(500).send('Fout bij het toevoegen van de afbeelding aan de database.');
          }
  
          res.json({
            message: 'Afbeelding succesvol toegevoegd.',
            id: results.insertId,
            image_url,
          });
        }
      );
    } catch (err) {
      console.error('Fout bij het verwerken van de aanvraag:', err);
      res.status(500).send('Er is een fout opgetreden bij het toevoegen van de afbeelding.');
    }
  });

  router.delete('/:image_id', apiKeyMiddleware, async (req, res) => {
    const { image_id } = req.params;
  
    console.log('Request parameters:', req.params); // Log de parameters voor debugging
  
    // Controleer of image_id aanwezig is
    if (!image_id) {
      return res.status(400).send('Image ID is verplicht.');
    }
  
    try {
      // Verwijder de post met de bijbehorende image_id uit de database
      db.query(
        'DELETE FROM gallery_images WHERE image_id = ?',
        [image_id],
        (err, results) => {
          if (err) {
            return res.status(500).send('Fout bij het verwijderen van de afbeelding uit de database.');
          }
  
          // Controleer of de post daadwerkelijk is verwijderd
          if (results.affectedRows === 0) {
            return res.status(404).send('Post met het opgegeven image_id niet gevonden.');
          }
  
          res.json({
            message: 'Afbeelding succesvol verwijderd.',
            image_id,
          });
        }
      );
    } catch (err) {
      console.error('Fout bij het verwerken van de aanvraag:', err);
      res.status(500).send('Er is een fout opgetreden bij het verwijderen van de afbeelding.');
    }
  });
  

  module.exports = router;