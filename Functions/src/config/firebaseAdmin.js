const admin = require("firebase-admin");
const { getFirestore } = require("firebase-admin/firestore");

if (admin.apps.length === 0) {
  admin.initializeApp();
}

// 🎯 Connexion explicite à l'instance Firestore "ane-et-gorille-v2"
// (Éradique définitivement l'erreur gRPC 5 NOT_FOUND)
const db = getFirestore("ane-et-gorille-v2");

module.exports = { admin, db };
