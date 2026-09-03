import React, { useState } from 'react';
import useProducts from '../hooks/useProducts';
import FilterBar from './FilterBar';
import ProductGrid from './ProductGrid';
import ProductDetailModal from './ProductDetailModal';

export default function ShopContainer() {
  const { products, loading, error } = useProducts();

  // États de filtrage et de sélection
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProducer, setSelectedProducer] = useState('');
  const [onlyBio, setOnlyBio] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Jeu de données fictives agnostiques (sans Toulouse/Ramonville) et sécurisées
  const displayProducts = products.length > 0 ? products : [
    {
      id: 1,
      title: "Pommes de terre de conservation",
      priceHT: 2.37,
      vatRate: 5.5,
      isAvailable: true,
      isBio: true,
      producer: "Producteur de la Rosée",
      batchNumber: "LOT-PDT-001",
      harvestDate: "02/09/2026",
      iduAdeme: "FR384920_01ECOR",
      distanceKm: "12"
    },
    {
      id: 2,
      title: "Carottes fanes de saison",
      priceHT: 3.03,
      vatRate: 5.5,
      isAvailable: true,
      isBio: false,
      producer: "Producteur de la Rosée",
      batchNumber: "LOT-CAR-042",
      harvestDate: "01/09/2026",
      iduAdeme: "FR384920_01ECOR",
      distanceKm: "12"
    },
    {
      id: 3,
      title: "Tomates anciennes charnues",
      priceHT: 4.55,
      vatRate: 5.5,
      isAvailable: false,
      isBio: true,
      producer: "Ferme des Écureuils",
      batchNumber: "LOT-TOM-089",
      harvestDate: "31/08/2026",
      iduAdeme: "FR908123_01ECOR",
      distanceKm: "18"
    },
    {
      id: 4,
      title: "Poireaux d'automne robustes",
      priceHT: 1.80,
      vatRate: 5.5,
      isAvailable: true,
      isBio: false,
      producer: "Le Jardin d'Émile",
      batchNumber: "LOT-POI-011",
      harvestDate: "02/09/2026",
      iduAdeme: "FR456789_01ECOR",
      distanceKm: "25"
    },
    {
      id: 5,
      title: "Pommes Gala croquantes",
      priceHT: 3.32,
      vatRate: 5.5,
      isAvailable: true,
      isBio: true,
      producer: "Vergers de la Plaine",
      batchNumber: "LOT-PML-102",
      harvestDate: "30/08/2026",
      iduAdeme: "FR123456_01ECOR",
      distanceKm: "8"
    },
  ];

  // Extraction dynamique des producteurs existants pour les filtres
  const uniqueProducers = [...new Set(displayProducts.map(p => p.producer).filter(Boolean))];

  // Filtrage combiné (Recherche + Producteur + Bio)
  const filteredProducts = displayProducts.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProducer = !selectedProducer || product.producer === selectedProducer;
    const matchesBio = !onlyBio || product.isBio;
    return matchesSearch && matchesProducer && matchesBio;
  });

  return (
    <section id="shop-section" className="max-w-7xl mx-auto px-6 py-12">
      {/* En-tête de la boutique */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 border-b-2 border-brand-gold pb-4">
        <h2 className="text-2xl font-bold text-brand-green">
          {"Notre Boutique — Le Marché de Proximité"}
        </h2>
        <p className="text-sm text-gray-500 mt-2 md:mt-0">
          {"Des produits frais récoltés pour votre énergie alimentaire"}
        </p>
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
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-green"></div>
          <span className="ml-3 text-brand-green font-medium">{"Chargement du marché..."}</span>
        </div>
      )}

      {error && products.length === 0 && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-center my-6" role="alert">
          <strong className="font-bold">{"Oups ! "}</strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* Grille d'affichage avec action d'ouverture de fiche */}
      {(!loading || products.length > 0) && (
        <ProductGrid
          products={filteredProducts}
          onOpenDetails={setSelectedProduct}
        />
      )}

      {/* Modal d'affichage complet de la Fiche de Traçabilité */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </section>
  );
}
