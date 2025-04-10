const mongoose = require('mongoose');
const UserModel = require('../models/user.model');
const axios = require("axios");


// API de géolocalisation OpenStreetMap
const GEOCODE_API = "https://nominatim.openstreetmap.org/search";

// Fonction pour convertir une adresse en latitude/longitude
const getCoordinatesFromAddress = async (address) => {
    try {
        const formattedAddress = `${address.street}, ${address.city}, ${address.postalCode}, ${address.country}`;
        const response = await axios.get(GEOCODE_API, {
            params: { q: formattedAddress, format: "json", limit: 1 }
        });

        if (response.data.length > 0) {
            return {
                type: "Point",
                coordinates: [
                    parseFloat(response.data[0].lon),
                    parseFloat(response.data[0].lat)
                ]
            };
        }
        return null;
    } catch (error) {
        console.error("Erreur de géocodage:", error);
        return null;
    }
};

// Récupérer tous les utilisateurs
module.exports.getAllUsers = async (req, res) => {
    try {
        const users = await UserModel.find().select('-password');
        res.status(200).json(users);
    } catch (err) {
        res.status(500).json({ message: 'Erreur lors de la récupération des utilisateurs', error: err.message });
    }
};

// Récupérer les informations d'un utilisateur spécifique
module.exports.userInfo = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'ID utilisateur invalide : ' + id });
    }

    try {
        const user = await UserModel.findById(id).select("pseudo email picture");
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur introuvable' });
        }

        console.log("Données utilisateur envoyées :", user);
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
};
// Mettre à jour un utilisateur
module.exports.updateUser = async (req, res) => {
    const { id } = req.params;
    console.log("Requête de mise à jour reçue pour l'utilisateur :", id);
    console.log("Données reçues :", req.body);

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "ID utilisateur invalide : " + id });
    }

    const { pseudo, address } = req.body;
    if (!pseudo && !address) {
        return res.status(400).json({ message: "Aucune donnée à mettre à jour" });
    }

    try {
        const updateFields = {};
        if (pseudo) updateFields.pseudo = pseudo;

        // Géolocalisation si l'adresse est modifiée
        if (address) {
            console.log("Adresse avant traitement :", address);
            const newLocation = await getCoordinatesFromAddress(address);

            if (!newLocation) {
                console.error("Échec de géocodage pour :", address);
                return res.status(400).json({ message: "Impossible de localiser cette adresse." });
            }

            updateFields.address = address;
            updateFields.location = newLocation;
            console.log("Nouvelle localisation obtenue :", newLocation);
        }

        // Mise à jour dans la base de données
        const updatedUser = await UserModel.findOneAndUpdate(
            { _id: id },
            { $set: updateFields },
            { new: true, upsert: false, setDefaultsOnInsert: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ message: "Utilisateur introuvable" });
        }

        console.log("Mise à jour réussie :", updatedUser);
        res.status(200).json(updatedUser);
    } catch (err) {
        console.error("Erreur serveur lors de la mise à jour :", err);
        res.status(500).json({ message: "Erreur lors de la mise à jour de l'utilisateur", error: err.message });
    }
};



// Supprimer un utilisateur
module.exports.deleteUser = async (req, res) => {
    const { id } = req.params;

    // Vérifier si l'ID est valide
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'ID utilisateur invalide : ' + id });
    }

    try {
        // Suppression de l'utilisateur
        const deletedUser = await UserModel.findByIdAndDelete(id);

        if (!deletedUser) {
            return res.status(404).json({ message: 'Utilisateur introuvable' });
        }

        res.status(200).json({ message: 'Utilisateur supprimé avec succès' });
    } catch (err) {
        res.status(500).json({ message: 'Erreur lors de la suppression de l\'utilisateur', error: err.message });
    }
}