const express = require("express");
const router = express.Router();
const clothesController = require("../controllers/clothes.controller");
const { checkRole } = require("../middleware/auth.middleware");

// Routes réservées aux vendeurs
router.post("/add-clothes", checkRole(["seller"]), clothesController.addClothes); // Ajouter un vêtement
router.patch("/:id", checkRole(["seller"]), clothesController.updateClothes);     // Modifier un vêtement
router.delete("/:id", checkRole(["seller"]), clothesController.deleteClothes);    // Supprimer un vêtement

// Routes accessibles à tous
router.get("/", clothesController.getAllClothes);   // Voir tous les vêtements
router.get("/:id", clothesController.getClothesById); // Voir un vêtement spécifique

module.exports = router;
