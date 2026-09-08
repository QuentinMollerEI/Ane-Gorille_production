import { collection, getDocs } from "firebase/firestore";
import { db } from "../config/firebase";

// 🔌 Ré-exportation directe du db configuré depuis firebase.js (centralisation)
export { db };

/**
 * 🌾 SERVICE : Récupération et normalisation des produits du catalogue (Clean Code & SRP)
 * Récupère les produits depuis Firestore et les harmonise pour correspondre au format attendu par la boutique.
 * Évite les crashs dus aux propriétés indéfinies (title vs name, priceHT vs price) [cite: 44].
 */
export const fetchActiveProducts = async () => {
  try {
    const productsRef = collection(db, "products");
    const querySnapshot = await getDocs(productsRef);

    // Normalisation robuste des données (Firestore <-> UI) [cite: 44]
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        // On fait correspondre les deux formats (Firestore <-> UI) [cite: 44]
        title: data.title || data.name || "Produit sans nom",
        priceHT: Number(data.priceHT ?? data.price ?? 0),
        vatRate: Number(data.vatRate ?? data.vat ?? 5.5),
        isAvailable: Number(data.stock ?? data.quantity ?? 0) > 0,
        isBio: Boolean(data.isBio ?? data.bio ?? false),
        producer: data.producer || data.producerName || "Producteur local",
        unit: data.unit || "kg",
        stock: Number(data.stock ?? 0),
        origin: data.origin || "France",
        batchNumber: data.batchNumber || "LOT-STANDARD",
        // 🎯 AJOUTS INDISPENSABLES POUR LA LOGISTIQUE ET LES SOUS-COMMANDES :
        // Transmet proprement l'identifiant et le nom du producteur au panier d'achat !
        producerId: data.producerId || data.userId || "PROD_INCONNU",
        producerName: data.producerName || data.producer || "Producteur local",
      };
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des produits :", error);
    return []; // Retourne un tableau vide en cas d'erreur pour éviter de faire planter l'interface [cite: 20]
  }
};
