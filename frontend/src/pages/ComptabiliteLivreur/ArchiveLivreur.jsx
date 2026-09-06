import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../services/firestore.service";
import { Truck } from "lucide-react";
import LivreurIndicators from "./components/LivreurIndicators";
import LivreurDocumentsTable from "./components/LivreurDocumentsTable";
import LivreurRegulatorySection from "./components/LivreurRegulatorySection";

export default function ArchiveLivreur() {
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    // Récupération dynamique des tournées et livraisons affectées au livreur
    const q = query(
      collection(db, "sub_orders"),
      where("carrierId", "==", user.uid),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const deliveriesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setDeliveries(deliveriesData);
        setLoading(false);
      },
      (error) => {
        console.error("Erreur de récupération des courses livreur :", error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [user?.uid]);

  // Transformation des sous-commandes de transport en pièces comptables réelles (Bons, Factures logistiques)
  const documents = [];
  deliveries.forEach((delivery) => {
    const deliveryDate = delivery.createdAt?.toDate
      ? delivery.createdAt.toDate().toLocaleDateString("fr-FR")
      : new Date(delivery.createdAt || Date.now()).toLocaleDateString("fr-FR");

    const deliveryCost = Number(delivery.deliveryCost || 15.0); // Forfait livraison par défaut si non spécifié

    // 1. Bon de Ramassage (BR) chez le maraîcher
    documents.push({
      id: `BR-${delivery.id.slice(0, 8).toUpperCase()}`,
      deliveryId: delivery.id,
      date: deliveryDate,
      type: "Bon de Ramassage",
      entity: delivery.producerName || "Maraîcher local",
      weightKg: delivery.weight || 25,
      amountTTC: null,
      status: [
        "PRET_A_EXPEDIER",
        "EN_COURS_DE_LIVRAISON",
        "LIVRE",
        "PAYE",
        "TERMINE",
      ].includes(delivery.status)
        ? "completed"
        : "pending",
    });

    // 2. Bon de livraison (BL) signé à remettre au client acheteur
    documents.push({
      id: `BL-${delivery.id.slice(0, 8).toUpperCase()}`,
      deliveryId: delivery.id,
      date: deliveryDate,
      type: "Bon de livraison",
      entity: delivery.buyerName || "Acheteur final",
      weightKg: delivery.weight || 25,
      amountTTC: null,
      status:
        delivery.status === "LIVRE" ||
        delivery.status === "TERMINE" ||
        delivery.status === "PAYE"
          ? "completed"
          : "pending",
    });

    // 3. Prestation Logistique à facturer
    documents.push({
      id: `LOG-${delivery.id.slice(0, 8).toUpperCase()}`,
      deliveryId: delivery.id,
      date: deliveryDate,
      type: "Note de Course",
      entity: "Âne & Gorille (Frais de route)",
      weightKg: delivery.weight || 25,
      amountTTC: deliveryCost,
      status:
        delivery.status === "PAYE" || delivery.status === "TERMINE"
          ? "paid"
          : "pending",
    });
  });

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 animate-fade-in">
      <div className="border-b border-gray-150 pb-5">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
          <span className="p-1.5 bg-green-50 text-green-700 rounded-lg">
            <Truck size={28} />
          </span>
          Archives & Comptabilité Logistique
        </h1>
        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1.5">
          Suivez vos prestations de transport, téléchargez vos fiches de
          ramassage HACCP et gérez vos justificatifs DREAL.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <LivreurIndicators documents={documents} />
          <LivreurDocumentsTable documents={documents} />
          <LivreurRegulatorySection />
        </div>
      )}
    </div>
  );
}
