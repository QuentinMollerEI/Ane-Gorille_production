import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../services/firestore.service";
import { FileText } from "lucide-react";
import PrivateLegalContext from "./components/PrivateLegalContext";
import PrivateIndicators from "./components/PrivateIndicators";
import PrivateDocumentsTable from "./components/PrivateDocumentsTable";

export default function PiecesComptablePrive() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;
    const q = query(collection(db, "orders"), where("buyerId", "==", user.uid));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setOrders(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      },
      (error) => {
        console.error("Erreur Firestore :", error);
        setLoading(false);
      },
    );
    return () => unsubscribe();
  }, [user?.uid]);

  const documents = [];
  orders.forEach((order) => {
    const orderDate = order.createdAt?.toDate
      ? order.createdAt.toDate().toLocaleDateString("fr-FR")
      : new Date().toLocaleDateString("fr-FR");

    documents.push({
      id: `BC-${order.id.slice(0, 8).toUpperCase()}`,
      date: orderDate,
      type: "Bon de commande",
      entity: order.producerName || "Plateforme",
      amount: order.totalAmount || order.price || 0,
      status: "archived",
    });

    if (
      ["EN_COURS_DE_LIVRAISON", "LIVRE", "PAYE", "TERMINE"].includes(
        order.status,
      )
    ) {
      documents.push({
        id: `BL-${order.id.slice(0, 8).toUpperCase()}`,
        date: orderDate,
        type: "Bon de livraison",
        entity: order.carrierName || "Livreur",
        amount: null,
        status: "archived",
      });
    }

    if (order.status === "PAYE" || order.status === "TERMINE") {
      documents.push({
        id: `FAC-${order.id.slice(0, 8).toUpperCase()}`,
        date: orderDate,
        type: "Facture",
        entity: order.producerName || "Producteur",
        amount: order.totalAmount || order.price || 0,
        status: "paid",
        vatRate: order.vatRate || 5.5,
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
          Pièces Comptables (B2B / B2C)
        </h1>
        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1.5">
          Espace Acheteur Privé : Justificatifs d'achats et transactions
          Stripe[cite: 1, 5].
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-700"></div>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <PrivateLegalContext />
          <PrivateIndicators documents={documents} />
          <PrivateDocumentsTable documents={documents} />
        </div>
      )}
    </div>
  );
}
