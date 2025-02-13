const Rating = require('../models/rating.model');

// Créer une note pour un shop ou un produit
module.exports.createRating = async (req, res) => {
    try {

        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: "Utilisateur non authentifié." });
        }

        const { shopId, productId, rating } = req.body;

        if (!shopId && !productId) {
            return res.status(400).json({ message: "Vous devez spécifier un shopId ou un productId." });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ message: "La note doit être entre 1 et 5." });
        }

        const newRating = new Rating({
            userId: req.user.id,
            shopId,
            productId,
            rating,
        });

        await newRating.save();
        res.status(201).json({ message: "Note ajoutée avec succès.", rating: newRating });
    } catch (error) {
        console.error("Erreur lors de l'ajout de la note:", error);
        res.status(500).json({ message: "Erreur serveur", error });
    }
};


// Récupérer les notes d'une boutique
module.exports.getRatingShop = async (req, res) => {
    try {
        const ratings = await Rating.find({ shopId: req.params.shopId }).populate('userId', 'pseudo');
        res.status(200).json(ratings);
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error });
    }
};

// Récupérer les notes d'un produit (vêtement)
module.exports.getRatingProduct = async (req, res) => {
    try {
        const ratings = await Rating.find({ productId: req.params.productId }).populate('userId', 'pseudo');
        res.status(200).json(ratings);
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error });
    }
};

// Calculer la moyenne des notes pour une boutique
module.exports.getAverageShop = async (req, res) => {
    try {
        const ratings = await Rating.find({ shopId: req.params.shopId });
        if (ratings.length === 0) {
            return res.status(200).json({ averageRating: 0 });
        }
        const average = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
        res.status(200).json({ averageRating: average.toFixed(1) });
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error });
    }
};

// Calculer la moyenne des notes pour un produit
module.exports.getAverageProduct = async (req, res) => {
    try {
        const ratings = await Rating.find({ productId: req.params.productId });
        if (ratings.length === 0) {
            return res.status(200).json({ averageRating: 0 });
        }
        const average = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
        res.status(200).json({ averageRating: average.toFixed(1) });
    } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error });
    }
};

// Modifier les rating des utlisateur
module.exports.updateRating = async (req, res) => {
    try {
        console.log("Requête de modification reçue:", req.params, req.body);
        console.log("Utilisateur connecté:", req.user);

        const { ratingId } = req.params;
        const { rating } = req.body;

        // Vérifier si la nouvelle note est valide
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ message: "La note doit être entre 1 et 5." });
        }

        // Trouver la note et vérifier si l'utilisateur en est le propriétaire
        const existingRating = await Rating.findById(ratingId);
        if (!existingRating) {
            return res.status(404).json({ message: "Note non trouvée." });
        }

        if (existingRating.userId.toString() !== req.user.id) {
            return res.status(403).json({ message: "Vous ne pouvez modifier que vos propres notes." });
        }

        // Mettre à jour la note
        existingRating.rating = rating;
        await existingRating.save();

        res.status(200).json({ message: "Note mise à jour avec succès.", rating: existingRating });
    } catch (error) {
        console.error("Erreur lors de la modification de la note:", error);
        res.status(500).json({ message: "Erreur serveur", error });
    }
};

module.exports.deleteRating = async (req, res) => {
    try {
        console.log("Requête de suppression reçue:", req.params);
        console.log("Utilisateur connecté:", req.user);

        const { ratingId } = req.params;

        // Trouver la note et vérifier si l'utilisateur en est le propriétaire
        const existingRating = await Rating.findById(ratingId);
        if (!existingRating) {
            return res.status(404).json({ message: "Note non trouvée." });
        }

        if (existingRating.userId.toString() !== req.user.id) {
            return res.status(403).json({ message: "Vous ne pouvez supprimer que vos propres notes." });
        }

        // Supprimer la note
        await Rating.findByIdAndDelete(ratingId);

        res.status(200).json({ message: "Note supprimée avec succès." });
    } catch (error) {
        console.error("Erreur lors de la suppression de la note:", error);
        res.status(500).json({ message: "Erreur serveur", error });
    }
};
