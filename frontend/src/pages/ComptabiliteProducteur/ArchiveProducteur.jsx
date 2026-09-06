import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../services/firestore.service";
import { FileText } from "lucide-react";
import ProducerIndicators from "./components/ProducerIndicators";
import ProducerDocumentsTable from "./components/ProducerDocumentsTable";
import ProducerPayoutsSettings from "./components/ProducerPayoutsSettings";

export default function ArchiveProducteur() {
  const { user } = useAuth();
  const [subOrders, setSubOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    // Récupération en temps réel des sous-commandes du producteur depuis Firestore
    const q = query(
      collection(db, "sub_orders"),
      where("producerId", "==", user.uid),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const subOrdersData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSubOrders(subOrdersData);
        setLoading(false);
      },
      (error) => {
        console.error(
          "Erreur de récupération des sous-commandes producteur :",
          error,
        );
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [user?.uid]);

  // Transformation dynamique des données Firestore en pièces comptables réelles (Factures, BL, etc.)
  const documents = [];
  subOrders.forEach((subOrder) => {
    const subOrderDate = subOrder.createdAt?.toDate
      ? subOrder.createdAt.toDate().toLocaleDateString("fr-FR")
      : new Date(subOrder.createdAt || Date.now()).toLocaleDateString("fr-FR");

    const amountTTC = Number(subOrder.totalAmount || subOrder.amount || 0);
    const vatRate = Number(subOrder.vatRate || 5.5);
    const platformCommission = amountTTC * 0.15; // Exemple réaliste : commission plateforme de 18%

    // 1. Facture de Vente émise pour le compte du producteur
    documents.push({
      id: `FAC-${subOrder.id.slice(0, 8).toUpperCase()}`,
      subOrderId: subOrder.id,
      date: subOrderDate,
      type: "Facture de Vente",
      entity: subOrder.buyerName || "Acheteur local",
      amountTTC: amountTTC,
      vatRate: vatRate,
      status:
        subOrder.status === "PAYE" || subOrder.status === "TERMINE"
          ? "paid"
          : "pending_30d",
      isChorus:
        subOrder.paymentMethod === "mandat" ||
        subOrder.buyerRole === "client_public",
      refEngagement: subOrder.refEngagement || "-",
    });

    // 2. Bon de livraison (BL) associé
    if (
      [
        "PRET_A_EXPEDIER",
        "EN_COURS_DE_LIVRAISON",
        "LIVRE",
        "PAYE",
        "TERMINE",
      ].includes(subOrder.status)
    ) {
      documents.push({
        id: `BL-${subOrder.id.slice(0, 8).toUpperCase()}`,
        subOrderId: subOrder.id,
        date: subOrderDate,
        type: "Bon de livraison",
        entity: subOrder.buyerName || "Acheteur local",
        amountTTC: null,
        vatRate: 0,
        status:
          subOrder.status === "LIVRE" ||
          subOrder.status === "TERMINE" ||
          subOrder.status === "PAYE"
            ? "archived"
            : "pending_30d",
        isChorus: false,
        refEngagement: "-",
      });
    }

    // 3. Facture de Commission (Âne et Gorille)
    if (subOrder.status === "PAYE" || subOrder.status === "TERMINE") {
      documents.push({
        id: `COM-${subOrder.id.slice(0, 8).toUpperCase()}`,
        subOrderId: subOrder.id,
        date: subOrderDate,
        type: "Facture de Commission",
        entity: "Âne & Gorille SAS (Plateforme)",
        amountTTC: platformCommission,
        vatRate: 20.0, // TVA standard de 20% sur la commission de service
        status: "paid",
        isChorus: false,
        refEngagement: "-",
      });
    }
  });

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 animate-fade-in">
      <div className="border-b border-gray-150 pb-5">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
          <span className="p-1.5 bg-green-50 text-green-700 rounded-lg">
            <FileText size={28} />
          </span>
          Archives & Comptabilité Producteur
        </h1>
        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1.5">
          Suivez votre chiffre d'affaires, gérez vos reversements Stripe Connect
          et vos obligations de TVA.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <ProducerIndicators documents={documents} />
          <ProducerDocumentsTable documents={documents} />
          <ProducerPayoutsSettings />
        </div>
      )}
    </div>
  );
}
