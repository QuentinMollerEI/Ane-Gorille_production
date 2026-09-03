import { db } from '../config/firebase'; // Votre configuration Firebase initiale
import { collection, getDocs, query, where } from 'firebase/firestore';

/**
 * Récupère la liste des produits actifs du Marché de la Rosée depuis Firestore.
 * @returns {Promise<Array>} Liste des produits formatés
 */
export async function fetchActiveProducts() {
  try {
    const productsRef = collection(db, 'products');
    // On ne récupère que les produits à afficher (évite de charger des données inutiles)
    const q = query(productsRef, where('active', '==', true));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Erreur lors de la récupération des produits :", error);
    throw new Error("Impossible de charger les produits du marché.");
  }
}
