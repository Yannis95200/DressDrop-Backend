const UserModel = require("../models/user.model");
const fs = require("fs");
const path = require("path");

module.exports.uploadProfil = async (req, res) => {
  try {
    // Vérifiez si un fichier est attaché
    if (!req.file) {
      return res.status(400).json({ error: "Aucun fichier fourni" });
    }

    console.log("Type de fichier détecté :", req.file.mimetype);

    // Vérifiez le type MIME du fichier
    const allowedMimeTypes = ["image/jpg", "image/png", "image/jpeg"];
    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      throw new Error("Invalid file type");
    }

    // Vérifiez la taille du fichier
    if (req.file.size > 500000) {
      throw new Error("File too large");
    }

    // Générer un nom unique pour le fichier
    const filename = `${req.body.name}.jpg`;

    // Assurez-vous que le dossier d'upload existe
    const uploadDir = path.join(__dirname, "../client/public/uploads/profil");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Utilisez le chemin du fichier (sur le disque) et renvoyez-le à l'utilisateur
    const filePath = path.join(uploadDir, filename);
    
    // Déplacer le fichier du répertoire temporaire vers le répertoire cible
    fs.promises.rename(req.file.path, filePath);

    // Mise à jour de l'utilisateur dans la base de données avec le chemin du fichier
    await UserModel.findByIdAndUpdate(
      req.body.userId,
      { $set: { picture: `/uploads/profil/${filename}` } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    // Réponse de succès
    res.status(201).json({
      message: "Fichier téléchargé avec succès !",
      file: filename,
    });
  } catch (err) {
    console.error("Erreur lors du téléchargement :", err.message);
    if (err.message === "Invalid file type") {
      return res.status(400).json({ error: "Type de fichier non autorisé. Seuls les formats JPEG et PNG sont acceptés." });
    }
    if (err.message === "File too large") {
      return res.status(400).json({ error: "Le fichier dépasse la taille maximale autorisée de 500 Ko." });
    }
    return res.status(500).json({ error: "Erreur serveur lors du téléchargement." });
  }
};
