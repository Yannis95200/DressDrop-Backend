const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    posterId: {
      type: String,
      required: true
    },
    message: {
      type: String,
      trim: true,
      maxlength: 500
    },
    picture: {
      type: String
    },
    likers: {
      type: [String],
      required:true
    },
    comments: {
      type: [
        {
          commenterId:String,
          commenterPseudo: String,
          text: String,
          timestamp: { type: Number, default: Date.now } // Ajout du timestamp
        }
      ], // Utilise le sous-schéma des commentaires
      require: true,
    }
  },
  { timestamps: true } // Ajoute createdAt et updatedAt pour les posts
);

module.exports = mongoose.model('Post', postSchema);
