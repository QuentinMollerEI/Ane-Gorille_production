import React, { useState } from "react";
import { ArrowLeft, Store, BookOpen, MessageSquare } from "lucide-react";
import ProductGrid from "./ProductGrid";
import ProducerHeader from "./producer/ProducerHeader";
import ProducerStoryTab from "./producer/ProducerStoryTab";
import ProducerReviewsTab from "./producer/ProducerReviewsTab";
import { useProducerStore } from "../../../hooks/useProducerStore";
import { useAuth } from "../../../context/AuthContext";

export default function ProducerStorePage({
  producerId,
  producerProfile,
  products = [],
  onBack,
  onAddToCart,
  onSelectProduct,
}) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("catalog"); // 'catalog' | 'story' | 'reviews'

  // Hook personnalisé pour les avis et favoris
  const { reviews, isFavorite, toggleFavorite } = useProducerStore(producerId, user);

  // Filtrage des récoltes du producteur sélectionné
  const producerProducts = products.filter(
    (p) => p.producerId === producerId || p.userId === producerId
  );

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto pb-12 text-xs">
      {/* Bouton de retour vers le catalogue général */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold rounded-2xl transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
        >
          <ArrowLeft size={16} />
          <span>Retour au catalogue général</span>
        </button>
        <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          Vitrine du Producteur
        </span>
      </div>

      {/* 1. Composant En-tête (Bannière, Nom, Adresse, Bouton Favoris) */}
      <ProducerHeader
        producerProfile={producerProfile}
        isFavorite={isFavorite}
        onToggleFavorite={toggleFavorite}
      />

      {/* 2. Barre d'onglets de la vitrine */}
      <div className="flex border-b border-gray-200 space-x-2 bg-white p-2 rounded-2xl border">
        <button
          type="button"
          onClick={() => setActiveTab("catalog")}
          className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === "catalog"
              ? "bg-emerald-700 text-white shadow-sm"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <Store size={16} />
          <span>Catalogue ({producerProducts.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("story")}
          className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === "story"
              ? "bg-emerald-700 text-white shadow-sm"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <BookOpen size={16} />
          <span>Récit & Présentation</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("reviews")}
          className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === "reviews"
              ? "bg-emerald-700 text-white shadow-sm"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <MessageSquare size={16} />
          <span>Avis des acheteurs ({reviews?.length || 0})</span>
        </button>
      </div>

      {/* 3. Affichage dynamique selon l'onglet sélectionné */}
      {activeTab === "catalog" && (
        <ProductGrid
          products={producerProducts}
          onSelectProduct={onSelectProduct}
          onAddToCart={onAddToCart}
        />
      )}

      {activeTab === "story" && (
        <ProducerStoryTab description={producerProfile?.description || producerProfile?.bio} />
      )}

      {activeTab === "reviews" && (
        <ProducerReviewsTab reviews={reviews || []} />
      )}
    </div>
  );
}