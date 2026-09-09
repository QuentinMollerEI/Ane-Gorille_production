import { collection, getDocs } from "firebase/firestore";
import { db } from "../config/firebase";

export { db };

/**
 * 🌾 SERVICE : Récupération et normalisation des produits du catalogue (Clean Code & SRP)
 * Récupère les produits depuis Firestore et harmonise la totalité des champs pour la boutique.
 */
export const fetchActiveProducts = async () => {
  try {
    const productsRef = collection(db, "products");
    const querySnapshot = await getDocs(productsRef);

    return querySnapshot.docs.map((doc) => {
      const data = doc.data();

      // 🔍 EXTRACTION DU NOM DU PRODUCTEUR AVEC TOUS LES FALLBACKS POSSIBLES
      const resolvedProducerName =
        data.producerName ||
        data.producer ||
        data.companyName ||
        data.entity ||
        data.farmName ||
        "Producteur local";

      return {
        id: doc.id,
        ...data, // Conserve tous les champs natifs

        // 🖼️ URL Image
        imageUrl:
          data.imageUrl ||
          data.image ||
          data.photo ||
          data.imgUrl ||
          data.url ||
          null,

        // 🏷️ Identités & Désignation
        title: data.title || data.name || "Produit sans nom",
        priceHT: Number(data.priceHT ?? data.price ?? 0),
        vatRate: Number(data.vatRate ?? data.vat ?? 5.5),
        isAvailable: Number(data.stock ?? data.quantity ?? 0) > 0,
        isBio: Boolean(data.isBio ?? data.bio ?? false),

        // 👨‍🌾 Producteur
        producer: resolvedProducerName,
        producerName: resolvedProducerName,
        companyName: resolvedProducerName,
        producerId: data.producerId || data.userId || "PROD_INCONNU",

        // 📦 Conditionnement & Logistique
        unit: data.unit || "kg",
        stock: Number(data.stock ?? 0),
        origin: data.origin || data.department || "France",
        batchNumber: data.batchNumber || "LOT-STANDARD",
      };
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des produits :", error);
    return [];
  }
};
