import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../services/firestore.service";
import { FileText } from "lucide-react";
import BuyerIndicators from "./components/BuyerIndicators";
import BuyerDocumentsTable from "./components/BuyerDocumentsTable";
import BuyerBillingSettings from "./components/BuyerBillingSettings";

export default function PiecesComptables() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    // Récupération en temps réel des commandes réelles de l'acheteur depuis Firestore
    const q = query(collection(db, "orders"), where("buyerId", "==", user.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const ordersData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setOrders(ordersData);
        setLoading(false);
      },
      (error) => {
        console.error("Erreur lors de la récupération des commandes :", error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [user?.uid]);

  // Transformation dynamique des commandes réelles en pièces comptables réelles (Bons, Factures)
  const documents = [];
  orders.forEach((order) => {
    const orderDate = order.createdAt?.toDate
      ? order.createdAt.toDate().toLocaleDateString("fr-FR")
      : new Date(order.createdAt || Date.now()).toLocaleDateString("fr-FR");

    // 1. Bon de commande (BC)
    documents.push({
      id: `BC-${order.id.slice(0, 8).toUpperCase()}`,
      orderId: order.id,
      date: orderDate,
      type: "Bon de commande",
      entity: order.producerName || "Plateforme Âne et Gorille",
      amount: order.totalAmount || order.price || 0,
      vatRate: order.vatRate || 5.5,
      status: order.status === "A_PREPARER" ? "pending_30d" : "paid",
      isChorus: false,
      refEngagement: order.refEngagement || "-",
    });

    // 2. Bon de livraison (BL) si la commande est en cours ou livrée
    if (
      ["EN_COURS_DE_LIVRAISON", "LIVRE", "PAYE", "TERMINE"].includes(
        order.status,
      )
    ) {
      documents.push({
        id: `BL-${order.id.slice(0, 8).toUpperCase()}`,
        orderId: order.id,
        date: orderDate,
        type: "Bon de livraison",
        entity: order.carrierName || "Livreur Âne & Gorille",
        amount: null,
        vatRate: 0,
        status:
          order.status === "LIVRE" || order.status === "TERMINE"
            ? "archived"
            : "pending_30d",
        isChorus: false,
        refEngagement: "-",
      });
    }

    // 3. Facture d'achat dématérialisée
    if (
      order.status === "PAYE" ||
      order.status === "TERMINE" ||
      order.paymentMethod === "mandat"
    ) {
      documents.push({
        id: `FAC-${order.id.slice(0, 8).toUpperCase()}`,
        orderId: order.id,
        date: orderDate,
        type: "Facture",
        entity: order.producerName || "Producteur local",
        amount: order.totalAmount || order.price || 0,
        vatRate: order.vatRate || 5.5,
        status:
          order.status === "PAYE" || order.status === "TERMINE"
            ? "paid"
            : "pending_chorus",
        isChorus:
          order.paymentMethod === "mandat" ||
          user?.role === "client_public" ||
          user?.role === "acheteur_public",
        refEngagement: order.refEngagement || "-",
      });
    }
  });

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 animate-fade-in">
      <div className="border-b border-gray-150 pb-5">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
          <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
            <FileText size={28} />
          </span>
          Pièces Comptables & Chorus Pro
        </h1>
        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1.5">
          Consultez et téléchargez vos justificatifs d'achat, factures de
          circuit court et données Chorus Pro.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <BuyerIndicators documents={documents} />
          <BuyerDocumentsTable documents={documents} />
          <BuyerBillingSettings />
        </div>
      )}
    </div>
  );
}
