const { supabaseClient } = require('../config/supabase');

const requireAuth = async (req, res, next) => {
  try {
    // extracting the token from the headers
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Missing or malformed Authorization header' 
      });
    }

    const token = authHeader.split(' ')[1];

    // verifying the token and return the user
    const { data: { user }, error } = await supabaseClient.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Invalid or expired token' 
      });
    }

    req.user = user;

    next();
  } catch (err) {
    console.error('Auth Middleware Error:', err);
    res.status(500).json({ error: 'Internal server error during authentication' });
  }
};

module.exports = { requireAuth };