import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../services/firestore.service";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { PlusCircle, FileSpreadsheet, Package, Archive, RefreshCw } from "lucide-react";

import StockCompartment from "./components/StockCompartment";
import ProductArchiveTool from "./components/ProductArchiveTool";
import ManualAddCompartment from "./components/ManualAddCompartment";
import CsvImportCompartment from "./components/CsvImportCompartment";

export default function MiseEnRayon() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("stock");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "products"),
      where("producerId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loadedProducts = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setProducts(loadedProducts);
        setLoading(false);
      },
      (error) => {
        console.error("Erreur de synchronisation :", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  const activeCount = products.filter((p) => p.status !== "archived").length;
  const archivedCount = products.filter((p) => p.status === "archived").length;

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6 animate-fade-in text-xs">
      {/* Onglets de navigation */}
      <div className="flex border-b border-gray-200 space-x-1 sm:space-x-2 overflow-x-auto pb-0.5">
        <button
          onClick={() => setActiveTab("stock")}
          className={`pb-2.5 px-3.5 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === "stock"
              ? "border-emerald-700 text-emerald-800 bg-emerald-50/50 rounded-t-xl"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <Package size={15} />
          <span>Rayon Actif ({activeCount})</span>
        </button>

        <button
          onClick={() => setActiveTab("manual")}
          className={`pb-2.5 px-3.5 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === "manual"
              ? "border-emerald-700 text-emerald-800 bg-emerald-50/50 rounded-t-xl"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <PlusCircle size={15} />
          <span>Ajout Simple (Unitaire)</span>
        </button>

        <button
          onClick={() => setActiveTab("csv")}
          className={`pb-2.5 px-3.5 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === "csv"
              ? "border-emerald-700 text-emerald-800 bg-emerald-50/50 rounded-t-xl"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <FileSpreadsheet size={15} />
          <span>Importation CSV</span>
        </button>

        <button
          onClick={() => setActiveTab("archive")}
          className={`pb-2.5 px-3.5 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === "archive"
              ? "border-emerald-700 text-emerald-800 bg-emerald-50/50 rounded-t-xl"
              : "border-transparent text-gray-500 hover:text-gray-800"
          }`}
        >
          <Archive size={15} />
          <span>Archives ({archivedCount})</span>
        </button>
      </div>

      {/* Rendu dynamique des sous-composants */}
      {loading ? (
        <div className="flex justify-center items-center py-20 min-h-[300px]">
          <RefreshCw className="animate-spin text-emerald-700" size={28} />
        </div>
      ) : (
        <div className="pt-2">
          {activeTab === "stock" && <StockCompartment products={products} />}
          {activeTab === "manual" && <ManualAddCompartment onProductAdded={() => setActiveTab("stock")} />}
          {activeTab === "csv" && <CsvImportCompartment onProductsImported={() => setActiveTab("stock")} />}
          {activeTab === "archive" && <ProductArchiveTool products={products} />}
        </div>
      )}
    </div>
  );
}