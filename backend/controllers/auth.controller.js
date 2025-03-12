const UserModel = require('../models/user.model');
const jwt = require('jsonwebtoken');
const bcrypt = require("bcrypt");
const axios = require("axios");
const { signUpErrors, signInErrors } = require('../utils/errors.utils');
const geocoder = require('../utils/geocoding');
const { getCoordinatesFromAddress } = require("../utils/geocoding");


const maxAge = 3 * 24 * 60 * 60 * 1000;

// Inscription de l'utilisateur
module.exports.signUp = async (req, res) => {
  const { pseudo, email, password, role, address } = req.body;

  try {
    console.log("Données reçues :", req.body); //

    if (!role) return res.status(400).json({ message: "Le rôle est requis." });

    const validRoles = ["seller", "buyer", "delivery"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: "Rôle invalide." });
    }

    let userLocation = null;
    if (address) {
      const { street, city, postalCode, country } = address;
      if (!street || !city || !postalCode || !country) {
        return res.status(400).json({ message: "Adresse incomplète." });
      }

      userLocation = await getCoordinatesFromAddress(address);

      if (!userLocation) {
        return res.status(400).json({ message: "Adresse introuvable. Veuillez vérifier les informations fournies." });
      }
    }

    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Cet email est déjà utilisé." });
    }

    // Création de l'utilisateur
    const user = await UserModel.create({
      pseudo,
      email,
      password,
      role,
      address,
      location: userLocation,
    });

    res.status(201).json({ user: user._id, role: user.role, location: user.location });
  } catch (err) {
    console.error(" Erreur lors de l'inscription :", err);
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

// Connexion de l'utilisateur
module.exports.signIn = async (req, res) => {
  try {
    console.log("🔍 Données reçues :", req.body);

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email et mot de passe requis." });
    }

    const user = await UserModel.findOne({ email });
    if (!user) {
      console.log(`Utilisateur non trouvé pour l'email : ${email}`);
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    const auth = await bcrypt.compare(password, user.password);
    if (!auth) return res.status(401).json({ message: "Mot de passe incorrect" });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.TOKEN_SECRET, { expiresIn: "1d" });

    res.cookie("jwt", token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });

    res.status(200).json({
      message: "Connexion réussie !",
      token,
      userId: user._id,
    });
  } catch (err) {
    console.error("Erreur lors de la connexion :", err.message);
    res.status(500).json({ message: "Erreur serveur" });
  }
};



module.exports.logout = (req, res) => {
  // Efface le cookie 'jwt'
  res.clearCookie('jwt', { httpOnly: true, secure: true });
  res.status(200).json({ message: 'Déconnexion réussie' });
};
