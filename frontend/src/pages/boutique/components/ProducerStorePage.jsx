import React, { useState } from "react";
import { ArrowLeft, Store, BookOpen, MessageSquare } from "lucide-react";
import ProductGrid from "./ProductGrid";
import ProducerHeader from "./producer/ProducerHeader";
import ProducerStoryTab from "./producer/ProducerStoryTab";
import ProducerReviewsTab from "./producer/ProducerReviewsTab";
import { useProducerStore } from "../../../hooks/useProducerStore";
import { useAuth } from "../../../context/AuthContext";

export default function ProducerStorePage({ producerId, producerProfile, products = [], onBack, onAddToCart, onSelectProduct }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("catalog");
  const { reviews, isFavorite, toggleFavorite } = useProducerStore(producerId, user);

  const producerProducts = products.filter((p) => p.producerId === producerId);
  const name = producerProfile?.companyName || producerProfile?.displayName || "Exploitation";

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto pb-12 text-xs">
      {/* Retour */}
      <button
        onClick={onBack}
        className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold rounded-2xl flex items-center gap-2 cursor-pointer shadow-xs"
      >
        <ArrowLeft size={16} />
        <span>Retour à la boutique</span>
      </button>

      {/* En-tête Producteur */}
      <ProducerHeader producerProfile={producerProfile} isFavorite={isFavorite} onToggleFavorite={toggleFavorite} />

      {/* Navigation Onglets */}
      <div className="flex border-b border-gray-150 px-6 bg-white rounded-2xl border border-gray-200">
        <button
          onClick={() => setActiveTab("catalog")}
          className={`py-3.5 px-4 font-extrabold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === "catalog" ? "border-emerald-800 text-emerald-800" : "border-transparent text-gray-500"
          }`}
        >
          <Store size={16} />
          <span>Boutique ({producerProducts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("story")}
          className={`py-3.5 px-4 font-extrabold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === "story" ? "border-emerald-800 text-emerald-800" : "border-transparent text-gray-500"
          }`}
        >
          <BookOpen size={16} />
          <span>Histoire</span>
        </button>

        <button
          onClick={() => setActiveTab("reviews")}
          className={`py-3.5 px-4 font-extrabold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === "reviews" ? "border-emerald-800 text-emerald-800" : "border-transparent text-gray-500"
          }`}
        >
          <MessageSquare size={16} />
          <span>Avis ({reviews.length})</span>
        </button>
      </div>

      {/* Rendu des Onglets */}
      {activeTab === "catalog" && (
        <div className="space-y-4">
          <h2 className="text-sm font-black text-gray-900">Récoltes disponibles chez {name}</h2>
          <ProductGrid products={producerProducts} onSelectProduct={onSelectProduct} onAddToCart={onAddToCart} />
        </div>
      )}

      {activeTab === "story" && <ProducerStoryTab description={producerProfile?.description} />}

      {activeTab === "reviews" && <ProducerReviewsTab reviews={reviews} />}
    </div>
  );
}