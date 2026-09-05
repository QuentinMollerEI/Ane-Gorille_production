import React, { useState, useEffect } from "react";
import { db } from "../../../../services/firestore.service.js";
import { collection, getDocs } from "firebase/firestore";
import { BarChart3, Users, Award, Truck, ShoppingBag } from "lucide-react";

export default function PlatformMetrics() {
  const [stats, setStats] = useState({
    total: 0,
    producers: 0,
    drivers: 0,
    buyers: 0,
    validated: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        const querySnapshot = await getDocs(collection(db, "users"));

        let total = 0;
        let producers = 0;
        let drivers = 0;
        let buyers = 0;
        let validated = 0;

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          total++;
          const norm =
            data.role === "producteur"
              ? "producer"
              : data.role === "livreur"
                ? "driver"
                : data.role === "acheteur"
                  ? "buyer"
                  : data.role;
          if (norm === "producer") producers++;
          if (norm === "driver") drivers++;
          if (norm === "buyer") buyers++;
          if (data.validationStatus === "VALIDE") validated++;
        });

        setStats({ total, producers, drivers, buyers, validated });
      } catch (err) {
        console.error("Erreur de calcul des statistiques :", err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const complianceRate =
    stats.total > 0 ? Math.round((stats.validated / stats.total) * 100) : 0;

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 animate-pulse">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="bg-gray-100 h-24 rounded-3xl border border-gray-200"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-xs font-semibold text-gray-500">
        {/* Total Utilisateurs */}
        <div className="bg-white border border-gray-200 p-5 rounded-3xl flex flex-col justify-between shadow-xs h-28">
          <div className="flex justify-between items-start">
            <span className="uppercase text-[10px] tracking-wider font-black text-gray-400">
              Inscrits
            </span>
            <Users size={16} className="text-purple-600" />
          </div>
          <span className="text-2xl font-black text-gray-900 mt-2">
            {stats.total}
          </span>
        </div>

        {/* Maraîchers */}
        <div className="bg-white border border-gray-200 p-5 rounded-3xl flex flex-col justify-between shadow-xs h-28">
          <div className="flex justify-between items-start">
            <span className="uppercase text-[10px] tracking-wider font-black text-gray-400">
              Producteurs
            </span>
            <Award size={16} className="text-amber-600" />
          </div>
          <span className="text-2xl font-black text-gray-900 mt-2">
            {stats.producers}
          </span>
        </div>

        {/* Livreurs */}
        <div className="bg-white border border-gray-200 p-5 rounded-3xl flex flex-col justify-between shadow-xs h-28">
          <div className="flex justify-between items-start">
            <span className="uppercase text-[10px] tracking-wider font-black text-gray-400">
              Transporteurs
            </span>
            <Truck size={16} className="text-blue-600" />
          </div>
          <span className="text-2xl font-black text-gray-900 mt-2">
            {stats.drivers}
          </span>
        </div>

        {/* Acheteurs */}
        <div className="bg-white border border-gray-200 p-5 rounded-3xl flex flex-col justify-between shadow-xs h-28">
          <div className="flex justify-between items-start">
            <span className="uppercase text-[10px] tracking-wider font-black text-gray-400">
              Acheteurs
            </span>
            <ShoppingBag size={16} className="text-green-600" />
          </div>
          <span className="text-2xl font-black text-gray-900 mt-2">
            {stats.buyers}
          </span>
        </div>

        {/* Conformité */}
        <div className="bg-purple-900 border border-purple-800 p-5 rounded-3xl flex flex-col justify-between shadow-md h-28 text-purple-200">
          <div className="flex justify-between items-start">
            <span className="uppercase text-[10px] tracking-wider font-black text-purple-300">
              Conformité
            </span>
            <BarChart3 size={16} className="text-purple-300" />
          </div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-2xl font-black text-white">
              {complianceRate}%
            </span>
            <span className="text-[9px] font-bold text-purple-300">
              des dossiers validés
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
