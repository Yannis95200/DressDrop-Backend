const express = require("express");
const router = express.Router();
const shopController = require("../controllers/shop.controller");
const { checkRole } = require("../middleware/auth.middleware");
const uploadController = require('../controllers/upload.controller');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

router.post("/shop", checkRole(["seller"]), shopController.createShop);
router.get("/", shopController.getAllShops);
router.put("/:id", checkRole(["seller"]), shopController.updateShop);
router.get("/:shopId/clothes", shopController.getClothesByShop);
router.delete("/:id", checkRole(["seller"]), shopController.deleteShop);
router.get("/nearby/:userId", shopController.getNearbyShopsForUser);
router.post('/upload-shop-image', upload.single('image'), uploadController.uploadShopImage);
router.get("/:id", shopController.getShopById);

module.exports = router;