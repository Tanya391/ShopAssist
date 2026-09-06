export function adminAuth(req, res, next) {
  const providedKey = req.headers['x-admin-api-key'];
  const expectedKey = process.env.ADMIN_API_KEY;

  if (!expectedKey) {
    console.error('[Security] ADMIN_API_KEY is not configured in environment.');
    return res.status(500).json({ error: 'Server configuration error.' });
  }

  if (!providedKey || providedKey !== expectedKey) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or missing admin API key.' });
  }

  next();
}
