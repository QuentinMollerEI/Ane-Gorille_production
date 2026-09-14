import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../services/firestore.service";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { Store, PlusCircle, Package } from "lucide-react";
import ManualAddCompartment from "./components/ManualAddCompartment";
import CsvImportCompartment from "./components/CsvImportCompartment"; // Conservé pour réactivation future
import StockCompartment from "./components/StockCompartment";

export default function MiseEnRayon() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("stock"); // 'stock' | 'manual'
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sécurité : si l'état bascule sur "csv", redirection automatique vers le stock
  useEffect(() => {
    if (activeTab === "csv") {
      setActiveTab("stock");
    }
  }, [activeTab]);

  useEffect(() => {
    if (!user?.uid) return;
    const q = query(collection(db, "products"), where("producerId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user?.uid]);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 animate-fade-in">
      {/* En-tête de la page */}
      <div className="border-b border-gray-150 pb-5">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
          <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
            <Store size={28} />
          </span>
          Mise en Rayon & Gestion du Catalogue
        </h1>
        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1.5">
          Gérez vos récoltes et vos stocks en temps réel.
        </p>
      </div>

      {/* Onglets de navigation visibles pour les producteurs */}
      <div className="flex border-b border-gray-200 space-x-2">
        <button
          onClick={() => setActiveTab("stock")}
          className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
            activeTab === "stock"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <Package size={16} />
          <span>Gestion des Stocks ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("manual")}
          className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
            activeTab === "manual"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <PlusCircle size={16} />
          <span>Ajout Simple (Unitaire)</span>
        </button>

        {/* L'ONGLET IMPORTATION CSV EST MASQUÉ DU RENDU VISUEL */}
        {/* Pour réactiver l'onglet ultérieurement, il suffira de décommenter le bloc ci-dessous :
        <button
          onClick={() => setActiveTab("csv")}
          className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
            activeTab === "csv"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <FileSpreadsheet size={16} />
          <span>Importation CSV</span>
        </button>
        */}
      </div>

      {/* Affichage des composants */}
      {loading ? (
        <div className="flex justify-center items-center py-20 min-h-[300px]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-700"></div>
        </div>
      ) : (
        <div>
          {activeTab === "stock" && <StockCompartment products={products} />}
          {activeTab === "manual" && (
            <ManualAddCompartment onProductAdded={() => setActiveTab("stock")} />
          )}
          {/* Composant CSV masqué (réactivable ultérieurement) : */}
          {/* {activeTab === "csv" && <CsvImportCompartment onProductsImported={() => setActiveTab("stock")} />} */}
        </div>
      )}
    </div>
  );
}