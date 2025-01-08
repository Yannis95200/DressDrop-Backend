const multer = require("multer");
const storage = multer.memoryStorage(); // Utilisation de la mémoire au lieu du disque

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 },  // Limite de taille de fichier à 50 Mo
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"), false);
    }
  }
});

module.exports = upload;

