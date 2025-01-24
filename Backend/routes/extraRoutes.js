const express = require('express');
const router = express.Router();
const db = require('../db');
const apiKeyMiddleware = require('../middlewares/apiKeyMiddleware');

router.get('/', apiKeyMiddleware, (req, res) => {
  db.query('SELECT * FROM extra', (err, results) => {
      if (err) return res.status(500).send(err);
      res.json(results);
  });
});

router.post('/:user_id', apiKeyMiddleware, async (req, res) => {
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

router.put('/:user_id', apiKeyMiddleware, async (req, res) => {
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

module.exports = router;
