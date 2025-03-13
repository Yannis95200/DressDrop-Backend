const jwt = require('jsonwebtoken');
const UserModel = require('../models/user.model');

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
