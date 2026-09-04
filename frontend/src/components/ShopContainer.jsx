import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../services/firestore.service.js";
import FilterBar from "./FilterBar";
import ProductGrid from "./ProductGrid";
import ProductDetailModal from "./ProductDetailModal";

export default function ShopContainer() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [producersCache, setProducersCache] = useState({});

  // États de filtrage et de sélection
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProducer, setSelectedProducer] = useState("");
  const [onlyBio, setOnlyBio] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Synchronisation en temps réel de la boutique avec Firestore
  // Seuls les produits marqués comme "isPublished == true" s'affichent
  useEffect(() => {
    const q = query(
      collection(db, "products"),
      where("isPublished", "==", true),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            // Normalisation pour assurer la résilience de l'affichage
            title: data.name || data.title || "Produit sans nom",
            description:
              data.description ||
              "Aucune description disponible pour ce produit.",
            priceHT: Number(data.priceHT ?? data.price ?? 0),
            vatRate: Number(data.vatRate ?? data.vat ?? 5.5),
            isAvailable: Number(data.stock ?? 0) > 0,
            isBio: Boolean(data.isBio ?? false),
            producer: data.producerName || data.producer || "Producteur local",
            producerId: data.producerId || "ID_INCONNU",
            unit: data.unit || "kg",
            stock: Number(data.stock ?? 0),
            origin: data.origin || "France",
            department: data.department || "Non renseigné",
            batchNumber: data.batchNumber || "LOT-N/A",
            image: data.image || "",
          };
        });
        setProducts(items);
        setLoading(false);
      },
      (err) => {
        console.error("Erreur de synchronisation boutique:", err);
        setError("Erreur d'accès à la base de données.");
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  // Résolution réactive du nom des producteurs depuis la collection 'users' de Firestore
  useEffect(() => {
    if (products.length === 0) return;

    // Identifier les producerId uniques qui ont besoin de résolution (hors ID de test de base ou inconnu)
    const uniqueProducerIds = [
      ...new Set(
        products
          .map((p) => p.producerId)
          .filter(
            (id) => id && id !== "ID_INCONNU" && id !== "ID_PRODUCTEUR_TEST",
          ),
      ),
    ];

    uniqueProducerIds.forEach(async (id) => {
      if (producersCache[id]) return; // Déjà dans le cache
      try {
        const userDocRef = doc(db, "users", id);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          const name =
            userData.companyName ||
            userData.nomExploitation ||
            userData.displayName ||
            `${userData.firstName} ${userData.lastName}`.trim();
          if (name) {
            setProducersCache((prev) => ({ ...prev, [id]: name }));
          }
        }
      } catch (err) {
        console.error(
          "Erreur lors de la résolution du nom du producteur :",
          err,
        );
      }
    });
  }, [products, producersCache]);

  // Étal de produits enrichi avec les noms de producteurs réels résolus depuis Firestore
  const enrichedProducts = products.map((product) => {
    const cachedName = producersCache[product.producerId];
    return {
      ...product,
      producer: cachedName || product.producer, // Utilise le vrai nom si disponible, sinon fallback
    };
  });

  // Extraction dynamique des producteurs existants en ligne pour le filtre dropdown
  const uniqueProducers = [
    ...new Set(enrichedProducts.map((p) => p.producer).filter(Boolean)),
  ];

  // Filtrage combiné (Recherche textuelle + Producteur + Bio)
  const filteredProducts = enrichedProducts.filter((product) => {
    const matchesSearch =
      (product.title || "")
        .toLowerCase()
        .includes((searchQuery || "").toLowerCase()) ||
      (product.department || "")
        .toLowerCase()
        .includes((searchQuery || "").toLowerCase());
    const matchesProducer =
      !selectedProducer || product.producer === selectedProducer;
    const matchesBio = !onlyBio || product.isBio;
    return matchesSearch && matchesProducer && matchesBio;
  });

  // Synchronisation dynamique de la modale de détails ouverte avec le nom résolu du producteur
  const selectedProductWithResolvedProducer = selectedProduct
    ? {
        ...selectedProduct,
        producer:
          producersCache[selectedProduct.producerId] ||
          selectedProduct.producer,
      }
    : null;

  return (
    <section
      id="shop-section"
      className="max-w-7xl mx-auto px-6 py-12 animate-fade-in"
    >
      {/* En-tête de la boutique */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 border-b-2 border-brand-gold pb-4">
        <div>
          <h2 className="text-2xl font-black text-brand-green flex items-center gap-2">
            🛒 Notre Boutique — Le Marché de Proximité
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Produits frais en direct de nos producteurs locaux engagés dans
            l'alimentation saine
          </p>
        </div>
      </div>

      {/* Rendu de la barre de filtres */}
      {!loading && !error && (
        <FilterBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedProducer={selectedProducer}
          setSelectedProducer={setSelectedProducer}
          onlyBio={onlyBio}
          setOnlyBio={setOnlyBio}
          producers={uniqueProducers}
        />
      )}

      {/* États de chargement et d'erreur */}
      {loading && products.length === 0 && (
        <div className="flex flex-col justify-center items-center py-20 gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-brand-green"></div>
          <span className="text-brand-green font-semibold text-sm">
            Chargement des étals en direct...
          </span>
        </div>
      )}

      {error && products.length === 0 && (
        <div
          className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl text-center my-6 shadow-sm"
          role="alert"
        >
          <strong className="font-bold">Oups ! </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* Grille d'affichage des fiches produits */}
      {(!loading || products.length > 0) &&
        (filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <p className="text-gray-400 font-semibold text-lg">
              Aucun produit ne correspond à vos filtres.
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Essayez d'élargir vos critères ou de vider la barre de recherche.
            </p>
          </div>
        ) : (
          <ProductGrid
            products={filteredProducts}
            onOpenDetails={setSelectedProduct}
          />
        ))}

      {/* Modal d'affichage complet de la Fiche de Traçabilité */}
      {selectedProductWithResolvedProducer && (
        <ProductDetailModal
          product={selectedProductWithResolvedProducer}
          allProducts={enrichedProducts} // On passe les produits déjà enrichis pour afficher les vrais noms dans la section "Du même producteur" !
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </section>
  );
}
