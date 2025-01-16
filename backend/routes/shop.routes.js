const express = require("express");
const router = express.Router();
const shopController = require("../controllers/shop.controller"); // Assurez-vous que ce chemin est correct
const { checkRole } = require("../middleware/auth.middleware");

router.post("/shop", checkRole(["seller"]), shopController.createShop);
router.get("/shops", shopController.getAllShops);
router.get("/shops/nearby", shopController.getNearbyShops); // ?latitude=48.8566&longitude=2.3522&radius=10
router.put("/shop/:id", shopController.updateShop);
router.get("/shop/:shopId/clothes", shopController.getClothesByShop);
router.delete("/shop/:id", checkRole(["seller"]), shopController.deleteShop);

module.exports = router;




