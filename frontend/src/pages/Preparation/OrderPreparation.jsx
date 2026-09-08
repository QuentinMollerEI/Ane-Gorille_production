import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../services/firestore.service";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  ClipboardList,
  Package,
  CheckCircle,
  Clock,
  Truck,
  AlertCircle,
  ChevronRight,
  Search,
  BarChart3,
  Hash,
} from "lucide-react";

export default function OrderPreparation() {
  const { user } = useAuth();
  const [subOrders, setSubOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtres d'onglets pour le workflow physique [cite: 17]
  const [activeFilter, setActiveTab] = useState("A_PREPARER"); // 'A_PREPARER' | 'A_RAMASSER' | 'RAMASSE'
  const [batchInputs, setBatchInputs] = useState({}); // Stockage des numéros de lots saisis par les producteurs
  const [searchTerm, setSearchTerm] = useState("");

  // 📡 ÉCOUTEUR FIRESTORE TEMPS RÉEL (Zéro écrit en dur) [cite: 17]
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Requête sécurisée : On écoute les sub_orders affectés à ce producteur précis [cite: 17]
    const q = query(
      collection(db, "sub_orders"),
      where("producerId", "==", user.uid),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docsList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSubOrders(docsList);
        setLoading(false);
      },
      (err) => {
        console.error("Erreur de synchronisation des sub_orders :", err);
        setError(
          "Erreur de permissions ou de connexion lors de la récupération des données.",
        );
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [user?.uid]);

  // ⚡ ACTION : Valider la préparation (Bascule vers A_RAMASSER = Bon de Ramassage) [cite: 17]
  const handleValidatePreparation = async (subOrderId) => {
    const lotNumber = batchInputs[subOrderId]?.trim();
    if (!lotNumber) {
      alert(
        "⚠️ Réglementation EGAlim & Traçabilité : Veuillez renseigner un numéro de lot pour assurer la traçabilité des denrées fraîches.",
      );
      return;
    }

    try {
      const subOrderRef = doc(db, "sub_orders", subOrderId);

      // Mise à jour physique dans Firestore (Zéro simulation) [cite: 17]
      await updateDoc(subOrderRef, {
        status: "A_RAMASSER", // Devient disponible pour la logistique (Bon de Ramassage) [cite: 17]
        lotNumber: lotNumber,
        preparedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      alert(
        "🎉 Préparation validée ! Le bon de ramassage a été envoyé instantanément au livreur.",
      );

      // Nettoyer l'input
      setBatchInputs((prev) => {
        const copy = { ...prev };
        delete copy[subOrderId];
        return copy;
      });
    } catch (err) {
      console.error("Erreur de validation de la préparation :", err);
      alert("Impossible de valider la préparation : " + err.message);
    }
  };

  // Filtrage local dynamique (SRP : Single Responsibility Principle) [cite: 17]
  const filteredSubOrders = subOrders.filter((order) => {
    const matchesFilter = order.status === activeFilter;
    const matchesSearch =
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.buyerName || "").toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 bg-gray-50 min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-700"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="border-b border-gray-200 pb-5">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
          <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
            <ClipboardList size={28} />
          </span>
          Suivi des Préparations & Récoltes
        </h1>
        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1.5">
          Gérez vos récoltes de légumes en temps réel, certifiez les lots pour
          la loi EGAlim et transmettez les bons de ramassage.
        </p>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
              À Récolter / Préparer
            </p>
            <p className="text-2xl font-black text-brand-dark">
              {subOrders.filter((o) => o.status === "A_PREPARER").length} bons
            </p>
          </div>
          <Clock size={24} className="text-amber-500 animate-pulse" />
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
              En attente de ramassage
            </p>
            <p className="text-2xl font-black text-brand-dark">
              {subOrders.filter((o) => o.status === "A_RAMASSER").length} bons
            </p>
          </div>
          <Truck size={24} className="text-blue-500" />
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
              Pris en charge / Livrés
            </p>
            <p className="text-2xl font-black text-emerald-700">
              {
                subOrders.filter(
                  (o) => o.status === "RAMASSE" || o.status === "DELIVERED",
                ).length
              }{" "}
              bons
            </p>
          </div>
          <CheckCircle size={24} className="text-emerald-500" />
        </div>
      </div>

      {/* Onglets de filtres et recherche */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab("A_PREPARER")}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              activeFilter === "A_PREPARER"
                ? "bg-amber-600 text-white shadow-sm"
                : "bg-gray-50 text-gray-600 hover:bg-gray-100"
            }`}
          >
            📋 1. À récolter / Préparer (
            {subOrders.filter((o) => o.status === "A_PREPARER").length})
          </button>
          <button
            onClick={() => setActiveTab("A_RAMASSER")}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              activeFilter === "A_RAMASSER"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-gray-50 text-gray-600 hover:bg-gray-100"
            }`}
          >
            🚜 2. Bons de ramassage (
            {subOrders.filter((o) => o.status === "A_RAMASSER").length})
          </button>
          <button
            onClick={() => setActiveTab("RAMASSE")}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              activeFilter === "RAMASSE"
                ? "bg-emerald-700 text-white shadow-sm"
                : "bg-gray-50 text-gray-600 hover:bg-gray-100"
            }`}
          >
            ✅ 3. Collectés / Ramassés (
            {subOrders.filter((o) => o.status === "RAMASSE").length})
          </button>
        </div>

        <div className="relative">
          <Search size={16} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par N° ou client..."
            className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-green-500 focus:border-green-500 w-full md:w-64"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-sm flex items-center gap-2">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* Grille des Bons de Préparations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredSubOrders.length > 0 ? (
          filteredSubOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
            >
              <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Bon de Préparation
                  </span>
                  <p className="font-black text-gray-900 text-base">
                    {order.id.slice(0, 8).toUpperCase()}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Destinataire
                  </span>
                  <p className="font-bold text-brand-dark text-xs">
                    {order.buyerName || "Acheteur local"}
                  </p>
                </div>
              </div>

              {/* Items */}
              <div className="p-5 space-y-3 flex-1">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Légumes & Fruits à récolter :
                </p>
                <div className="divide-y divide-gray-100">
                  {(order.items || []).map((item, index) => (
                    <div
                      key={index}
                      className="py-2 flex justify-between items-center text-xs"
                    >
                      <span className="font-bold text-gray-800 flex items-center gap-1.5">
                        <Package size={14} className="text-gray-400" />
                        {item.name}
                      </span>
                      <span className="px-2.5 py-1 bg-green-50 text-green-800 rounded-lg font-black text-xs border border-green-150">
                        x {item.quantity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions de validation & Saisie du Lot */}
              <div className="p-5 bg-gray-50/50 border-t border-gray-100 space-y-4">
                {order.status === "A_PREPARER" ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <Hash size={12} /> Numéro de Lot (Certification
                        Traçabilité / HACCP) *
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: LOT-SALADE-0709"
                        className="w-full border-gray-300 rounded-lg p-2 text-xs focus:ring-1 focus:ring-green-500 border focus:border-green-500 font-semibold"
                        value={batchInputs[order.id] || ""}
                        onChange={(e) =>
                          setBatchInputs({
                            ...batchInputs,
                            [order.id]: e.target.value,
                          })
                        }
                      />
                    </div>
                    <button
                      onClick={() => handleValidatePreparation(order.id)}
                      className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-lg uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle size={14} /> Récolte & Préparation Terminées
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500 font-medium">
                        N° de Lot Certifié :
                      </span>
                      <span className="font-bold text-emerald-800 bg-green-50 border border-green-150 px-2 py-0.5 rounded text-[10px] uppercase">
                        {order.lotNumber || "Non défini"}
                      </span>
                    </div>
                    <div className="p-2.5 bg-green-50 border border-green-200 rounded-lg text-green-800 text-[11px] font-semibold flex items-center gap-1.5">
                      <CheckCircle size={14} /> Le bon de ramassage est actif et
                      transmis aux livreurs.
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-2 bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-400 italic shadow-sm">
            Aucun bon de préparation trouvé pour cet onglet.
          </div>
        )}
      </div>
    </div>
  );
}
