const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  name: { type: String },
  email: { type: String },
  password: { type: String },
  code: { type: String },
  date: { type: Date },
  active: { type: Boolean },
  photo: { type: String },
  role: { type: String, default: null }, // Attribut 'role' ajouté
  locked: { type: Boolean, default: false }, //propriété permettant de savoir si un user a été bloqué ou pas
  addUserId: { type: String, default: null }, //identifiant de l'administrateur ayant ajouter un autre
  appleId: {type: String},
  fcmToken: {type: Array, default: []},
  referralCode: { type: String, unique: true, sparse: true }, // Code de parrainage unique
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // Parrain
  deletionCode: { type: String, default: null }, // Code de confirmation de suppression de compte
  deletionCodeExpires: { type: Date, default: null },
  resetCode: { type: String, default: null }, // Code de reinitialisation du mot de passe
  resetCodeExpires: { type: Date, default: null },
  resetAttempts: { type: Number, default: 0 },
  deletionAttempts: { type: Number, default: 0 },
});

module.exports = mongoose.model("User", userSchema);