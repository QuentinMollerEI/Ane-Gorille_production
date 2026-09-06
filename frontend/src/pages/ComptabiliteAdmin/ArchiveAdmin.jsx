import React, { useState, useEffect } from "react";
import { collection, query, limit, onSnapshot } from "firebase/firestore";
import { db } from "../../services/firestore.service";
import { ShieldAlert } from "lucide-react";
import AdminIndicators from "./components/AdminIndicators";
import AdminGlobalRegister from "./components/AdminGlobalRegister";
import AdminFiscalReporting from "./components/AdminFiscalReporting";

export default function ArchiveAdmin() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Récupération dynamique globale des commandes pour la surveillance Admin
    const q = query(collection(db, "orders"));

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
        console.error(
          "Erreur de récupération des données système Admin :",
          error,
        );
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 animate-fade-in">
      <div className="border-b border-gray-150 pb-5">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
          <span className="p-1.5 bg-red-50 text-red-700 rounded-lg">
            <ShieldAlert size={28} />
          </span>
          Surveillance Fiscale, Stripe & Chorus Pro (Admin)
        </h1>
        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1.5">
          Console de contrôle globale : Volume d'affaires (GMV), Registre
          réglementaire DAC7 et passerelle Chorus Pro.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-700"></div>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <AdminIndicators orders={orders} />
          <AdminGlobalRegister orders={orders} />
          <AdminFiscalReporting orders={orders} />
        </div>
      )}
    </div>
  );
}
