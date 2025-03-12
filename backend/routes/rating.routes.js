const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/rating.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.post('/rate', verifyToken, ratingController.createRating);
router.get('/shop/:shopId', ratingController.getRatingShop);
router.get('/product/:productId', ratingController.getRatingProduct);
router.get('/shop/:shopId/average', ratingController.getAverageShop);
router.get('/product/:productId/average', ratingController.getAverageProduct);
router.put('/rate/:ratingId',verifyToken, ratingController.updateRating)
router.delete('/rate/:ratingId', verifyToken, ratingController.deleteRating);

module.exports = router;
