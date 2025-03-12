const mongoose = require('mongoose');
const { isEmail } = require('validator');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
  {
    pseudo: {
      type: String,
      required: true,
      minLength: 3,
      maxLength: 55,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      validate: [isEmail],
      lowercase: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      max: 1024,
      minlength: 6,
    },
    picture: {
      type: String,
      default: './uploads/profil/random-user.png',
    },
    bio: {
      type: String,
      max: 1024,
    },
    role: {
      type: String,
      enum: ['seller', 'buyer', "delivery"],
      default: 'buyer',
    },
    address: {
      street: { type: String, required: false, trim: true },
      city: { type: String, required: false, trim: true },
      postalCode: { type: String, required: false, trim: true },
      country: { type: String, required: false, trim: true },
    },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [0, 0] }
    },
  }, { timestamps: true });
  
  // Index géospatial pour permettre la recherche par localisation
  userSchema.index({ location: "2dsphere" });
// Avant d'enregistrer, hachez le mot de passe
userSchema.pre('save', async function (next) {
  const salt = await bcrypt.genSalt();
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Méthode statique pour le login
userSchema.statics.login = async function (email, password) {
  const user = await this.findOne({ email });
  if (user) {
    const auth = await bcrypt.compare(password, user.password);
    if (auth) {
      return user;
    }
    throw Error('incorrect password');
  }
  throw Error('incorrect email');
};

const UserModel = mongoose.model('User', userSchema);

module.exports = UserModel;
