import React, { useState, useEffect } from "react";
import { Truck, AlertCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../services/firestore.service";
import { collection, query, where, onSnapshot } from "firebase/firestore";

// Import des sous-composants réécrits (Principe SRP de responsabilité unique)
import LivreurIndicators from "./components/LivreurIndicators";
import LivreurDocumentsTable from "./components/LivreurDocumentsTable";
import LivreurRegulatorySection from "./components/LivreurRegulatorySection";

/**
 * 📂 ARCHIVE LIVREUR - COMPOSANT ORCHESTRATEUR DE PIÈCES COMPTABLES (SRP)
 * Sa seule et unique responsabilité est d'établir l'écoute temps réel Firestore,
 * de structurer les données des courses réelles et de les distribuer aux enfants.
 */
export default function ArchiveLivreur() {
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // 📡 REQUÊTE FIRESTORE TEMPS RÉEL (Écoute les sous-commandes logistiques de ce livreur)
    // Synchronisation sur 'carrierId' (la variable universelle de documentWorkflowService.js)
    const q = query(
      collection(db, "sub_orders"),
      where("carrierId", "==", user.uid),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const realDeliveries = snapshot.docs.map((doc) => {
          const data = doc.data();

          // Mappage de statut ultra-résilient (Gère "DELIVERED", "LIVRE", "completed", "TERMINE")
          let inferredStatus = "in_transit";
          if (
            ["DELIVERED", "LIVRE", "completed", "TERMINE"].includes(data.status)
          ) {
            inferredStatus = "delivered";
          }

          return {
            id: data.parentOrderId || doc.id,
            blCode: data.blCode || `BL-${doc.id.slice(0, 8).toUpperCase()}`,
            date: data.createdAt?.toDate
              ? data.createdAt.toDate().toLocaleDateString("fr-FR")
              : new Date().toLocaleDateString("fr-FR"),
            producer: data.producerName || "Producteur local",
            buyer: data.buyerName || "Acheteur",
            distanceKm: data.distanceKm || 15,
            tempHaccp: data.tempHaccp || null,
            status: inferredStatus,
            amount: data.amount ? Number(data.amount) * 0.15 : 18.75, // CA transport
          };
        });

        // Données de démo historiques (sans créer de doublons)
        const staticDocs = [
          {
            id: "CMD-2026-89",
            blCode: "BL-2026-089",
            date: "01/09/2026",
            producer: "Producteur de la Rosée",
            buyer: "Restaurant Le Local",
            distanceKm: 12,
            tempHaccp: "4.2",
            status: "delivered",
            amount: 15,
          },
          {
            id: "CMD-2026-102",
            blCode: "BL-2026-102",
            date: "02/09/2026",
            producer: "Producteur de la Rosée",
            buyer: "Mairie de Toulouse (Cantine)",
            distanceKm: 15,
            tempHaccp: "4.5",
            status: "delivered",
            amount: 18.75,
          },
        ];

        const realIds = realDeliveries.map((d) => d.id);
        const filteredStatic = staticDocs.filter(
          (d) => !realIds.includes(d.id),
        );

        setDeliveries([...realDeliveries, ...filteredStatic]);
        setLoading(false);
      },
      (err) => {
        console.error("Erreur d'écoute de l'archive logistique :", err);
        setError("Impossible de synchroniser vos relevés de courses réels.");
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [user?.uid]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-700"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 animate-fade-in">
      <div className="border-b border-gray-150 pb-5">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
          <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
            <Truck size={28} />
          </span>
          Relevés de Prestations & Logistique
        </h1>
        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1.5">
          Consultez vos relevés de courses, validez vos trajets logistiques,
          suivez la conformité sanitaire HACCP et vos licences DREAL.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <LivreurIndicators deliveries={deliveries} />
      <LivreurDocumentsTable deliveries={deliveries} />
      <LivreurRegulatorySection />
    </div>
  );
}
