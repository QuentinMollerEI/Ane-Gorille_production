// src/services/ProductService.js
import { db } from "../config/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

// Utilitaires de sécurité pour assainir les données (anti-XSS et cohérence comptable)
const sanitizeString = (str) => {
  if (!str || typeof str !== "string") return "";
  return str.replace(/[<>]/g, "").trim();
};

const sanitizePositiveNumber = (num, fallback = 0) => {
  const parsed = Number(num);
  return isNaN(parsed) || parsed < 0 ? fallback : parsed;
};

export const ProductService = {
  async addProduct(rawProductData, producerProfile) {
    if (!producerProfile?.uid) {
      throw new Error("Accès refusé : Producteur non identifié.");
    }

    const title = sanitizeString(rawProductData.title);
    if (!title) throw new Error("Veuillez saisir la désignation du produit.");

    const priceHT = sanitizePositiveNumber(rawProductData.priceHT);
    if (priceHT <= 0) throw new Error("Le prix HT doit être supérieur à 0.");

    const stock = sanitizePositiveNumber(rawProductData.stock);
    const batchNumber = sanitizeString(rawProductData.batchNumber) || 
      `LOT-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(100 + Math.random() * 900)}`;

    const producerName = sanitizeString(producerProfile.companyName || producerProfile.displayName || "Maraîcher Exploitant");
    const producerDept = sanitizeString(producerProfile.department || producerProfile.departmentCode || producerProfile.city || "Dépt. Local");
    const harvestLocation = sanitizeString(producerProfile.address || producerProfile.city || "Exploitation locale");

    const productPayload = {
      title,
      name: title,
      category: sanitizeString(rawProductData.category) || "Légumes",
      priceHT: Number(priceHT.toFixed(2)),
      price: Number(priceHT.toFixed(2)),
      vatRate: sanitizePositiveNumber(rawProductData.vatRate, 5.5),
      unit: sanitizeString(rawProductData.unit) || "kg",
      stock: stock,
      quantity: stock, // Cohérence des champs historiques
      harvestDate: sanitizeString(rawProductData.harvestDate),
      batchNumber,
      isBio: Boolean(rawProductData.isBio),
      producerId: producerProfile.uid,
      producer: producerName,
      producerName: producerName,
      companyName: producerName,
      department: producerDept,
      origin: producerDept,
      harvestLocation: harvestLocation,
      packagingType: "Caisses & Cagettes Réutilisables (Consignées)",
      isReusableCrate: true,
      imageUrl: rawProductData.imagePreview || null,
      image: rawProductData.imagePreview || null,
      isAvailable: stock > 0,
      isHidden: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      const docRef = await addDoc(collection(db, "products"), productPayload);
      return docRef.id;
    } catch (error) {
      console.error("[ProductService] Erreur :", error);
      throw new Error("Impossible d'ajouter le produit dans la base de données Firestore.");
    }
  }
};