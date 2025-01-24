const apiKeyMiddleware = (req, res, next) => {
  const apiKey = req.headers['x-api-key']; // API key is sent in the 'x-api-key' header

  if (!apiKey || apiKey !== process.env.API_KEY) {
      return res.status(403).send('Forbidden: Geen geldige API Key');
  }
  next(); // Proceed to the next middleware/route handler
};

module.exports = apiKeyMiddleware;
