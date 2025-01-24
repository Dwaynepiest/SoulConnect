const express = require('express');
const router = express.Router();
const db = require('../db');
const apiKeyMiddleware = require('../middlewares/apiKeyMiddleware');

router.get('/', apiKeyMiddleware, (req, res) => {
  db.query('SELECT * FROM relatieschap', (err, results) => {
      if (err) return res.status(500).send(err);
      res.json(results);
  });
});

router.post('/:user_id', apiKeyMiddleware, async (req, res) => {
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

router.put('/:user_id', apiKeyMiddleware, async (req, res) => {
  const { user_id } = req.params;
  const { preference, one_liner, relation, location } = req.body;

  if (!user_id) {
    return res.status(400).send('user_id is verplicht.');
  }

  // Controleer of de gebruiker bestaat in de `relationship`-tabel
  db.query('SELECT * FROM relationship WHERE user_id = ?', [user_id], (err, results) => {
    if (err) {
      return res.status(500).send('Databasefout bij het ophalen van gegevens.');
    }

    if (results.length === 0) {
      // Stuur een foutmelding als er geen record bestaat
      return res.status(404).send('Geen gegevens gevonden voor het opgegeven user_id.');
    }

    // Update de bestaande gegevens
    db.query(
      'UPDATE relationship SET preference = ?, one_liner = ?, relation = ?, location = ? WHERE user_id = ?',
      [
        preference || results[0].preference, // Gebruik de bestaande waarde als de nieuwe ontbreekt
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
  });
});

module.exports = router;
