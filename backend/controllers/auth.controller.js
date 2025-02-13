const UserModel = require('../models/user.model');
const jwt = require('jsonwebtoken');
const bcrypt = require("bcrypt");
const axios = require("axios");
const { signUpErrors, signInErrors } = require('../utils/errors.utils');
const geocoder = require('../utils/geocoding');


const maxAge = 3 * 24 * 60 * 60 * 1000;

// API de géolocalisation (OpenStreetMap)
const GEOCODE_API = "https://nominatim.openstreetmap.org/search";

// Fonction pour convertir une adresse en latitude/longitude
const getCoordinatesFromAddress = async (address) => {
    try {
        const formattedAddress = `${address.street}, ${address.city}, ${address.postalCode}, ${address.country}`;
        const response = await axios.get(GEOCODE_API, {
            params: {
                q: formattedAddress,
                format: "json",
                limit: 1
            }
        });

        if (response.data.length > 0) {
            return {
                type: "Point",
                coordinates: [
                    parseFloat(response.data[0].lon), // Longitude
                    parseFloat(response.data[0].lat)  // Latitude
                ]
            };
        }
        return null;
    } catch (error) {
        console.error("Erreur de géocodage:", error);
        return null;
    }
};

// Inscription de l'utilisateur
module.exports.signUp = async (req, res) => {
  const { pseudo, email, password, role, address, documents } = req.body;

  try {
    if (!role) return res.status(400).json({ message: "Le rôle est requis." });

    const validRoles = ["seller", "buyer", "delivery"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: "Rôle invalide." });
    }

    // Vérification des documents si l'utilisateur est un livreur
    if (!documents || !documents.drivingLicense || !documents.insurance) {
      return res.status(400).json({ message: "Les documents (permis et assurance) sont requis pour les livreurs." });
    }

    let userLocation = null;
    if (address) {
      const { street, city, postalCode, country } = address;
      if (!street || !city || !postalCode || !country) {
        return res.status(400).json({ message: "Adresse invalide." });
      }

      // Utiliser la fonction getCoordinatesFromAddress pour récupérer les coordonnées GPS
      userLocation = await getCoordinatesFromAddress(address);

      if (!userLocation) {
        return res.status(400).json({ message: "Adresse introuvable." });
      }
    }

    // Création de l'utilisateur
    const user = await UserModel.create({
      pseudo,
      email,
      password,
      role,
      address,
      documents: role === "delivery" ? documents : undefined,
      location: userLocation
    });

    res.status(201).json({ user: user._id, role: user.role, location: user.location });
  } catch (err) {
    console.error("Erreur lors de l'inscription:", err);
    res.status(400).json({ errors: err.message });
  }
};

// Connexion de l'utilisateur
module.exports.signIn = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await UserModel.findOne({ email });
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

    const auth = await bcrypt.compare(password, user.password);
    if (!auth) return res.status(401).json({ message: "Mot de passe incorrect" });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.TOKEN_SECRET, { expiresIn: "1d" });

    res.cookie("jwt", token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });

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
