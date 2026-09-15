const admin = require("firebase-admin");
const { getFirestore } = require("firebase-admin/firestore");

// Initialisation sécurisée V14+
if (!admin.apps || !admin.apps.length) {
  admin.initializeApp();
}

// Récupération de l'instance Firestore sur la base dédiée "ane-et-gorille-v2"
const db = getFirestore("ane-et-gorille-v2");

module.exports = {
  admin,
  db,
};