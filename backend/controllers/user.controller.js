const mongoose = require('mongoose');
const UserModel = require('../models/user.model');

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
      const user = await UserModel.findById(id);
      if (!user) {
        return res.status(404).json({ message: 'Utilisateur introuvable' });
      }
      res.status(200).json(user);
    } catch (err) {
      res.status(500).json({ message: 'Erreur serveur', error: err.message });
    }
  };

// Mettre à jour un utilisateur
module.exports.updateUser = async (req, res) => {
    const { id } = req.params; // Récupérer l'ID utilisateur depuis les paramètres

    // Vérifier si l'ID est valide
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'ID utilisateur invalide : ' + id });
    }

    const { pseudo } = req.body;  // Supposer que le pseudo vient du corps de la requête

    // Vérifier si le pseudo est fourni
    if (!pseudo) {
        return res.status(400).json({ message: 'Le pseudo est requis' });
    }

    try {
        // Mettre à jour l'utilisateur en utilisant findOneAndUpdate
        const updatedUser = await UserModel.findOneAndUpdate(
            { _id: id },  // Recherche par ID
            { $set: { pseudo: pseudo } },  // Mettre à jour le pseudo
            { new: true, upsert: false, setDefaultsOnInsert: true }  // Renvoie le document mis à jour
        );

        if (!updatedUser) {
            return res.status(404).json({ message: 'Utilisateur introuvable' });
        }

        res.status(200).json(updatedUser);  // Retourne l'utilisateur mis à jour
    } catch (err) {
        res.status(500).json({ message: 'Erreur lors de la mise à jour de l\'utilisateur', error: err.message });
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
};