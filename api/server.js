require('dotenv').config();

const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors()); 
app.use(express.json()); 

const testRoutes = require('./src/routes/test');
const transactionRoutes = require('./src/routes/transactions'); 

app.use('/api', testRoutes);
app.use('/api/transactions', transactionRoutes); 

// Catches formatting errors so the server doesn't crash
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke on the server!' });
});

const PORT = process.env.PORT || 3001; 
app.listen(PORT, () => {
  console.log(`🚀 Server is running securely on port ${PORT}`);
});