import { db } from "../config/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

// Nettoyage des chaînes de caractères
const sanitizeString = (str) => {
  if (!str || typeof str !== "string") return "";
  return str.replace(/[<>]/g, "").trim();
};

// Validation des nombres positifs
const sanitizePositiveNumber = (num, fallback = 0) => {
  const parsed = Number(num);
  return isNaN(parsed) || parsed < 0 ? fallback : parsed;
};

export const ProductService = {
  /**
   * Enregistre un produit dans Firestore avec support multi-filières
   */
  async addProduct(rawProductData, producerProfile) {
    if (!producerProfile?.uid) {
      throw new Error("Accès refusé : Producteur non identifié.");
    }

    const title = sanitizeString(rawProductData.title);
    if (!title) {
      throw new Error("Veuillez saisir la désignation du produit.");
    }

    const priceHT = sanitizePositiveNumber(rawProductData.priceHT);
    if (priceHT <= 0) {
      throw new Error("Le prix HT doit être supérieur à 0.");
    }

    const stock = sanitizePositiveNumber(rawProductData.stock);

    // Génération automatique du numéro de lot si non renseigné
    const batchNumber =
      sanitizeString(rawProductData.batchNumber) ||
      `LOT-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(100 + Math.random() * 900)}`;

    const producerName = sanitizeString(
      producerProfile.companyName || producerProfile.displayName || producerProfile.name || "Exploitation Locale"
    );

    const producerDept = sanitizeString(
      producerProfile.department || producerProfile.departmentCode || producerProfile.city || "Dépt. Local"
    );

    const harvestLocation = sanitizeString(
      producerProfile.address || producerProfile.city || "Exploitation locale"
    );

    // Construction du document Firestore (Socle d'origine + Nouveaux champs)
    const productPayload = {
      // --- BASE D'ORIGINE STRICTEMENT CONSERVÉE ---
      title: title,
      name: title,
      category: sanitizeString(rawProductData.category) || "Légumes",
      priceHT: Number(priceHT.toFixed(2)),
      price: Number(priceHT.toFixed(2)),
      vatRate: sanitizePositiveNumber(rawProductData.vatRate, 5.5),
      unit: sanitizeString(rawProductData.unit) || "kg",
      stock: stock,
      quantity: stock,
      harvestDate: sanitizeString(rawProductData.harvestDate),
      batchNumber: batchNumber,
      isBio: Boolean(rawProductData.isBio),
      producerId: producerProfile.uid,
      producer: producerName,
      producerName: producerName,
      companyName: producerName,
      department: producerDept,
      origin: producerDept,
      harvestLocation: harvestLocation,
      packagingType:
        sanitizeString(rawProductData.packagingContainer) ||
        "Caisses & Cagettes Réutilisables (Consignées)",
      isReusableCrate: true,
      imageUrl: rawProductData.imagePreview || null,
      image: rawProductData.imagePreview || null,
      isAvailable: stock > 0,
      isHidden: false,

      // --- EXTENSIONS MULTI-FILIÈRES (AJOUTS DYNAMIQUES) ---
      // Miel & Apiculture
      floralOrigin: sanitizeString(rawProductData.floralOrigin),
      honeyNetWeight: sanitizeString(rawProductData.honeyNetWeight),

      // Œufs & Élevage
      eggRearingMode: sanitizeString(rawProductData.eggRearingMode),
      eggCaliber: sanitizeString(rawProductData.eggCaliber),
      dcrDate: sanitizeString(rawProductData.dcrDate),
      eggSanitaryApproval: sanitizeString(rawProductData.eggSanitaryApproval),

      // Produits Secs & Transformés (INCO)
      ingredients: sanitizeString(rawProductData.ingredients),
      allergens: sanitizeString(rawProductData.allergens),
      ddmDate: sanitizeString(rawProductData.ddmDate),
      dlcDate: sanitizeString(rawProductData.dlcDate),
      storageInstructions: sanitizeString(rawProductData.storageInstructions),

      // Labels EGAlim complémentaires
      isHve: Boolean(rawProductData.isHve),
      isAopIgp: Boolean(rawProductData.isAopIgp),
      isLabelRouge: Boolean(rawProductData.isLabelRouge),

      // Horodatages système
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      const docRef = await addDoc(collection(db, "products"), productPayload);
      return docRef.id;
    } catch (error) {
      console.error("[ProductService] Erreur lors de la création Firestore :", error);
      throw new Error("Impossible d'ajouter le produit dans la base de données Firestore.");
    }
  },
};