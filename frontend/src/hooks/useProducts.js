import { useState, useEffect } from "react";
import { fetchActiveProducts } from "../services/firestore.service";

export default function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true; // Prévient les fuites de mémoire en cas de démontage rapide

    async function loadProducts() {
      try {
        setLoading(true);
        const data = await fetchActiveProducts();
        if (isMounted) {
          setProducts(data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      isMounted = false; // Nettoyage lors du démontage du composant
    };
  }, []);

  return { products, loading, error };
}
