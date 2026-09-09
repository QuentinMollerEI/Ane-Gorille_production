import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../services/firestore.service";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import {
  Store,
  PlusCircle,
  FileSpreadsheet,
  Package,
  RefreshCw,
} from "lucide-react";

import ManualAddCompartment from "./components/ManualAddCompartment";
import CsvImportCompartment from "./components/CsvImportCompartment";
import StockCompartment from "./components/StockCompartment";

/**
 * 🌾 PAGE PARENTE : MiseEnRayon.jsx
 * Responsabilité unique : Orchestrer l'ensemble des outils de mise en rayon pour l'exploitant local
 * (Ajout unitaire, Importation CSV en masse, et Gestion du stock en rayon).
 */
export default function MiseEnRayon() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("stock"); // 'stock' | 'manual' | 'csv'
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Écoute en direct des produits appartenant à cet émetteur connecté
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const q = query(
      collection(db, "products"),
      where("producerId", "==", user.uid),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProducts(list);
        setLoading(false);
      },
      (err) => {
        console.error("Erreur d'écoute des produits en rayon :", err);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [user?.uid]);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 animate-fade-in">
      {/* EN-TÊTE PRINCIPAL */}
      <div className="border-b border-gray-150 pb-5">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
          <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
            <Store size={28} />
          </span>
          Mise en Rayon & Gestion du Catalogue Exploitant
        </h1>
        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1.5">
          Ajoutez vos récoltes du jour, importez votre catalogue CSV et ajustez
          vos stocks disponibles en temps réel.
        </p>
      </div>

      {/* BARRE DE NAVIGATION PAR ONGLETS */}
      <div className="flex border-b border-gray-200 space-x-2">
        <button
          type="button"
          onClick={() => setActiveTab("stock")}
          className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 border-b-2 ${
            activeTab === "stock"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <Package size={16} />
          <span>Gestion des Stocks ({products.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("manual")}
          className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 border-b-2 ${
            activeTab === "manual"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <PlusCircle size={16} />
          <span>Ajout Simple (Unitaire)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("csv")}
          className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 border-b-2 ${
            activeTab === "csv"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <FileSpreadsheet size={16} />
          <span>Importation CSV en Masse</span>
        </button>
      </div>

      {/* RENDER DYNAMIQUE DES COMPARTIMENTS */}
      {loading ? (
        <div className="flex justify-center items-center py-20 min-h-[300px]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-700"></div>
        </div>
      ) : (
        <div>
          {activeTab === "stock" && <StockCompartment products={products} />}

          {activeTab === "manual" && (
            <ManualAddCompartment
              onProductAdded={() => setActiveTab("stock")}
            />
          )}

          {activeTab === "csv" && (
            <CsvImportCompartment
              onProductsImported={() => setActiveTab("stock")}
            />
          )}
        </div>
      )}
    </div>
  );
}
