const corsOptions = {
  origin: 'http://localhost:3000', // Vervang dit door je frontend-URL
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Voeg hier de methoden toe die je wilt toestaan
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'], // Voeg hier de headers toe die je wilt toestaan
  optionsSuccessStatus: 200, // Voor IE11 en oudere browsers
};

module.exports = corsOptions;
