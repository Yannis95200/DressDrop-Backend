const ClothesModel = require("../models/clothes.model");

module.exports.addClothes = async (req, res) => {
  try {
    const newClothes = new ClothesModel({ ...req.body, ownerId: req.user.id });
    const savedClothes = await newClothes.save();
    res.status(201).json(savedClothes);
  } catch (err) {
    res.status(400).json({ message: "Error adding clothes", error: err.message });
  }
};
 module.exports.getAllClothes = async (req, res) => {

 }
 module.exports.getClothesById = async (req, res) => {

 }
 module.exports.updateClothes = async (req, res) => {

 }
 module.exports.deleteClothes = async (req, res) => {
    
 }



