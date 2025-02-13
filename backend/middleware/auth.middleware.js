const jwt = require('jsonwebtoken');
const UserModel = require('../models/user.model');

module.exports.checkUser = async (req, res, next) => {
  try {
    const token = req.cookies?.jwt;

    if (!token) {
      console.log('Aucun token trouvé dans les cookies');
      res.locals.user = null;
      return next();
    }

    jwt.verify(token, process.env.TOKEN_SECRET, async (err, decodedToken) => {
      if (err) {
        console.error('Erreur de vérification du token :', err.message);
        res.locals.user = null;
        res.cookie('jwt', '', { maxAge: 1 });
        return next();
      }

      try {
        const user = await UserModel.findById(decodedToken.id);
        res.locals.user = user || null;

        if (user) {
          console.log('Utilisateur authentifié :', user._id);
        } else {
          console.log('Utilisateur introuvable pour l\'ID :', decodedToken.id);
        }
      } catch (dbError) {
        console.error('Erreur lors de la recherche utilisateur :', dbError);
        res.locals.user = null;
      }

      return next();
    });
  } catch (error) {
    console.error('Erreur inattendue dans le middleware checkUser :', error);
    res.locals.user = null;
    return next();
  }
};

module.exports.requireAuth = (req, res, next) => {
  const token = req.cookies?.jwt;

  if (!token) {
    console.log('No token found');
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  jwt.verify(token, process.env.TOKEN_SECRET, (err, decodedToken) => {
    if (err) {
      console.error('Invalid token:', err.message);
      return res.status(401).json({ error: 'Invalid or expired token.' });
    }

    console.log('Authenticated user ID:', decodedToken.id);
    next();
  });
};

module.exports.checkRole = (roles) => {
  return (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    console.log("Token reçu :", token);
    if (!token) {
      console.log("Aucun token trouvé");
      return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    try {
      const decodedToken = jwt.verify(token, process.env.TOKEN_SECRET);
      console.log("Token décodé :", decodedToken);
      if (!roles.includes(decodedToken.role)) {
        return res.status(403).json({ message: "Forbidden: Access denied" });
      }
      req.user = decodedToken;
      next();
    } catch (err) {
      console.error("Erreur de validation du token :", err.message);
      res.status(401).json({ message: "Invalid token" });
    }
  };
};

module.exports.verifyToken = (req, res, next) => {
  try {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) return res.status(403).json({ message: "Accès refusé, token manquant !" });

      const decodedToken = jwt.verify(token, process.env.TOKEN_SECRET);
      req.user = { id: decodedToken.id, role: decodedToken.role };

      next();
  } catch (error) {
      res.status(401).json({ message: "Authentification échouée !" });
  }
};