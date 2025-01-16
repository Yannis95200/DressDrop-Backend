const UserModel = require('../models/user.model');
const jwt = require('jsonwebtoken');
const bcrypt = require("bcrypt");
const { signUpErrors, signInErrors } = require('../utils/errors.utils');



const maxAge = 3 * 24 * 60 * 60 * 1000;

// Inscription de l'utilisateur


module.exports.signUp = async (req, res) => {
  const { pseudo, email, password, role } = req.body; // Ajout du rôle dans la destructuration

  console.log('Requête reçue:', { pseudo, email, password, role });

  try {
    // Vérifier si le rôle est fourni
    if (!role) {
      return res.status(400).json({ message: "Le rôle est requis et ne peut pas être vide." });
    }

    // Validation du rôle pour éviter des valeurs non autorisées
    const validRoles = ["seller", "buyer"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: "Le rôle spécifié n'est pas valide." });
    }

    // Création de l'utilisateur avec le rôle
    const user = await UserModel.create({ pseudo, email, password, role });
    res.status(201).json({ user: user._id, role: user.role });
  } catch (err) {
    console.error('Erreur lors de l\'inscription:', err);
    const errors = signUpErrors(err);
    res.status(400).json({ errors });
  }
};

// Connexion de l'utilisateur
module.exports.signIn = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Vérification de l'utilisateur
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // Vérification du mot de passe
    const auth = await bcrypt.compare(password, user.password);
    if (!auth) {
      return res.status(401).json({ message: "Mot de passe incorrect" });
    }

    // Génération du token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.TOKEN_SECRET,
      { expiresIn: "1d" }
    );

    // Ajouter le token dans les cookies (HTTP-Only pour plus de sécurité)
    res.cookie("jwt", token, {
      httpOnly: true, // Empêche les scripts côté client d'accéder au cookie
      maxAge: 24 * 60 * 60 * 1000, // 1 jour en millisecondes
    });

    // Réponse avec un message de succès
    res.status(200).json({ message: "Connexion réussie !" });
  } catch (err) {
    console.error("Erreur lors de la connexion :", err.message);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// Déconnexion de l'utilisateur
module.exports.logout = (req, res) => {
  res.cookie('jwt', '', { maxAge: 1 });
  res.status(200).json({ message: 'Déconnexion réussie' });
};
