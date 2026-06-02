const express = require('express');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// if requireAuth fails, it sends an error and the code below NEVER runs.
router.get('/test-auth', requireAuth, (req, res) => {
  res.json({
    message: 'Success! You have passed the security checkpoint.',
    //2 auth.js attached the user to the request, we can see who it is!
    userEmail: req.user.email,
    userId: req.user.id
  });
});

module.exports = router;