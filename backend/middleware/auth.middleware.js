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
    console.log('Aucun token trouvé');
    return res.status(401).json({ erreur: 'Accès refusé. Aucun token fourni.' });
  }

  jwt.verify(token, process.env.TOKEN_SECRET, (err, decodedToken) => {
    if (err) {
      console.error('Token invalide :', err.message);
      return res.status(401).json({ erreur: 'Token invalide ou expiré.' });
    }

    console.log('ID utilisateur authentifié :', decodedToken.id);
    next();
  });
};
