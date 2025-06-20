import { verifyToken } from "../utils/jwt.js";

const verifyTokenMiddleware = (req, res, next) => {

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token mancante o malformato' });
  }
  
  const token = authHeader.split(' ')[1];

  try {
    // Verifica il token usando la funzione utility
    const decoded = verifyToken(token);

    if (!decoded || !decoded.id) {
      return res.status(401).json({ error: 'Token non valido o scaduto' });
    }

    // Salva le info dell'utente in req.user per usarle dopo
    req.user = decoded;
    
    // Passa al prossimo middleware/handler
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token non valido o scaduto' });
  }
};

export default  verifyTokenMiddleware ;