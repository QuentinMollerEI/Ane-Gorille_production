import { useState, useEffect } from "react";
import { db } from "../services/firestore.service";
import { doc, updateDoc, arrayUnion, arrayRemove, collection, query, where, onSnapshot } from "firebase/firestore";

export function useProducerStore(producerId, user) {
  const [reviews, setReviews] = useState([]);
  const [isFavorite, setIsFavorite] = useState(false);

  // Synchronisation de l'état "Favori"
  useEffect(() => {
    if (user?.favoriteProducers && producerId) {
      setIsFavorite(user.favoriteProducers.includes(producerId));
    } else {
      setIsFavorite(false);
    }
  }, [user, producerId]);

  // Écoute des avis Firestore en temps réel
  useEffect(() => {
    if (!producerId) return;
    const q = query(collection(db, "producer_reviews"), where("producerId", "==", producerId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setReviews(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [producerId]);

  // Action d'ajout/retrait des favoris
  const toggleFavorite = async () => {
    if (!user?.uid) {
      alert("Veuillez vous connecter pour ajouter ce producteur à vos favoris.");
      return;
    }

    const userRef = doc(db, "users", user.uid);
    try {
      if (isFavorite) {
        await updateDoc(userRef, { favoriteProducers: arrayRemove(producerId) });
      } else {
        await updateDoc(userRef, { favoriteProducers: arrayUnion(producerId) });
      }
    } catch (err) {
      console.error("Erreur mise à jour favoris :", err);
    }
  };

  return { reviews, isFavorite, toggleFavorite };
}