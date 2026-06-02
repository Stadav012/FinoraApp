// 1. Load environment variables first
require('dotenv').config();

// 2. Import Express and standard middleware
const express = require('express');
const cors = require('cors');

// 3. Initialize the Express app
const app = express();

// 4. Global Middleware
// Allow requests from other origins (like your Expo app)
app.use(cors()); 
// Automatically parse incoming JSON data from the phone
app.use(express.json()); 

// 5. Import your Routes
const testRoutes = require('./src/routes/test');

// 6. Mount your Routes
// This prefixes all routes in that file with '/api'
app.use('/api', testRoutes);

// 7. Basic Error Handler (Optional but recommended)
// Catches formatting errors so the server doesn't crash
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke on the server!' });
});

// 8. Start the Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running securely on port ${PORT}`);
});