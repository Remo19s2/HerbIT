const rateLimit = require('express-rate-limit');

/**
 * Middleware: Verify if user has an active session
 */
function isAuthenticated(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }

  // Handle API request vs HTML page navigation
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please log in to continue.'
    });
  }

  const redirectUrl = encodeURIComponent(req.originalUrl);
  return res.redirect(`/login.html?redirect=${redirectUrl}`);
}

/**
 * Middleware: Verify if authenticated user has 'admin' role
 */
function isAdmin(req, res, next) {
  if (!req.session || !req.session.userId) {
    if (req.originalUrl.startsWith('/api/')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please log in.'
      });
    }
    const redirectUrl = encodeURIComponent(req.originalUrl);
    return res.redirect(`/login.html?redirect=${redirectUrl}`);
  }

  if (req.session.role === 'admin') {
    return next();
  }

  if (req.originalUrl.startsWith('/api/')) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Administrator privileges required.'
    });
  }

  return res.status(403).send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>403 Forbidden | HerbIT</title>
      <link rel="stylesheet" href="/style.css">
      <style>
        body { display:flex; align-items:center; justify-content:center; min-height:100vh; text-align:center; padding:1.5rem; background:#f4f7f5; }
        .forbidden-card { background:#fff; padding:2.5rem; border-radius:16px; border:1px solid #e0e6e2; max-width:480px; box-shadow:0 10px 25px rgba(0,0,0,0.05); }
        .forbidden-card h1 { color:#b91c1c; margin-bottom:0.75rem; font-size:1.8rem; }
        .forbidden-card p { color:#4a5568; margin-bottom:1.5rem; line-height:1.5; }
      </style>
    </head>
    <body>
      <div class="forbidden-card">
        <h1><i class="fa-solid fa-shield-halved"></i> 403 - Access Denied</h1>
        <p>This administrative portal is restricted to authorized botanical administrators only. Your current account lacks administrative permissions.</p>
        <a href="/" class="btn btn-primary" style="display:inline-block; padding:0.6rem 1.4rem; background:#1e5128; color:#fff; text-decoration:none; border-radius:30px;">Return to Herbal Explorer</a>
      </div>
    </body>
    </html>
  `);
}

/**
 * Rate Limiter for Authentication endpoints to mitigate brute force
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'test' ? 1000 : 100, // 100 attempts per IP per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP address. Please try again after 15 minutes.'
  }
});

module.exports = {
  isAuthenticated,
  isAdmin,
  authLimiter
};
