const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/rating.controller');
const { verifyToken } = require('../middleware/auth.middleware');


// Ajouter une note
router.post('/rate', verifyToken, ratingController.createRating);


// Récupérer les notes d'une boutique
router.get('/shop/:shopId', ratingController.getRatingShop);

// Récupérer les notes d'un produit
router.get('/product/:productId', ratingController.getRatingProduct);

// Moyenne des notes d'une boutique
router.get('/shop/:shopId/average', ratingController.getAverageShop);

// Moyenne des notes d'un produit
router.get('/product/:productId/average', ratingController.getAverageProduct);

// Modifier une note (nécessite authentication)
router.put('/rate/:ratingId',verifyToken, ratingController.updateRating)

// Supprimer une note (nécessite authentication)
router.delete('/rate/:ratingId', verifyToken, ratingController.deleteRating);

module.exports = router;
