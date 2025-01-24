const express = require('express');
const cors = require('cors');
const db = require('./db'); // Import the database connection
const port = 3001;
require('dotenv').config();
const apiKeyMiddleware = require('./middlewares/apiKeyMiddleware');
const corsOptions = require('./config/corsOptions');
const userRoutes = require('./routes/userRoutes');
const extraRoutes = require('./routes/extraRoutes');
const relationshipRoutes = require('./routes/relationshipRoutes');
const likeRoutes = require('./routes/likeRoutes');
const matchRoutes = require('./routes/matchRoutes');

// Create an Express app
const app = express();

app.use(express.json()); // To parse JSON bodies
app.use(cors(corsOptions));

// Use routes
app.use('/users', userRoutes);
app.use('/extra', extraRoutes);
app.use('/relatieschap', relationshipRoutes);
app.use('/like', likeRoutes);
app.use('/matches', matchRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});