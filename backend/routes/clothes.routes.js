const express = require("express");
const router = express.Router();
const clothesController = require("../controllers/clothes.controller");
const { checkRole } = require("../middleware/auth.middleware");

// Routes réservées aux vendeurs
router.post("/add", checkRole(["seller"]), clothesController.addClothes);
router.put("/:id", checkRole(["seller"]), clothesController.updateClothes);
router.delete("/:id", checkRole(["seller"]), clothesController.deleteClothes);
// Routes accessibles à tous
router.get("/", clothesController.getAllClothes);
router.get("/:id", clothesController.getClothesById);

module.exports = router;
