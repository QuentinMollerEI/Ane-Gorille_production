import React, { useState, useEffect } from "react";
import { collection, query, getDocs } from "firebase/firestore";
import { db } from "../../../services/firestore.service";
import {
  ShieldAlert,
  Download,
  FileText,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

export default function AdminFiscalReporting({ orders = [] }) {
  const [isRetracted, setIsRetracted] = useState(true);
  const [producers, setProducers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Charger les utilisateurs de type 'producteur' pour faire le bilan fiscal réel (Directives DAC7)
  useEffect(() => {
    async function loadProducers() {
      try {
        const usersSnapshot = await getDocs(collection(db, "users"));
        const producersList = [];

        usersSnapshot.forEach((doc) => {
          const userData = doc.data();
          if (userData.role === "producteur" || userData.role === "producer") {
            // Calculer le chiffre d'affaires cumulé réel pour ce producteur
            const producerOrders = orders.filter(
              (o) =>
                o.producerId === doc.id &&
                (o.status === "PAYE" || o.status === "TERMINE"),
            );
            const totalEarned = producerOrders.reduce(
              (sum, o) => sum + Number(o.totalAmount || o.price || 0),
              0,
            );

            producersList.push({
              id: doc.id,
              name: userData.companyName || userData.displayName || "Maraîcher",
              siret: userData.siret || "Non renseigné",
              tvaRegime: userData.tvaRegime || "franchise",
              totalSalesCount: producerOrders.length,
              cumulativeRevenue: totalEarned,
            });
          }
        });
        setProducers(producersList);
      } catch (error) {
        console.error(
          "Erreur de chargement du bilan fiscal des vendeurs :",
          error,
        );
      } finally {
        setLoading(false);
      }
    }

    loadProducers();
  }, [orders]);

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm transition-all duration-300">
      <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
        <h2 className="font-bold text-gray-800 text-base flex items-center gap-2">
          <ShieldAlert size={18} className="text-emerald-600" />
          3. Rapports Réglementaires Directives EU - DAC7 (Bilan Fiscal Annuel)
        </h2>
        <button
          onClick={() => setIsRetracted(!isRetracted)}
          className="text-gray-500 hover:text-gray-800 p-1 hover:bg-gray-100 rounded transition-colors"
        >
          {isRetracted ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
        </button>
      </div>

      {!isRetracted && (
        <div className="p-5 space-y-5 animate-fade-in">
          <div className="bg-red-50/40 text-red-950 p-4 border border-red-100 rounded-xl text-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="font-extrabold uppercase tracking-wide text-red-800">
                Conformité Fiscale Européenne DAC7 obligatoire
              </p>
              <p className="text-gray-600 mt-1 leading-relaxed">
                Les éditeurs de plateformes de mise en relation sont tenus de
                déclarer chaque année à la DGFIP le montant cumulé des ventes de
                chaque marchand inscrit sur la marketplace.
              </p>
            </div>
            <button className="flex items-center gap-1.5 bg-red-700 hover:bg-red-800 text-white font-bold py-2 px-4 rounded-lg text-xs uppercase transition-all shadow-sm self-start md:self-auto">
              <Download size={14} /> Exporter Rapport XML DAC7
            </button>
          </div>

          {loading ? (
            <div className="text-center py-4 text-xs text-gray-400">
              Calcul du bilan fiscal des exploitants...
            </div>
          ) : (
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-gray-50 text-gray-600 border-b border-gray-250 text-xs font-bold uppercase">
                  <tr>
                    <th className="p-4">Exploitation Agricole</th>
                    <th className="p-4">SIRET</th>
                    <th className="p-4">Régime fiscal déclaré</th>
                    <th className="p-4 text-center">
                      Transactions répertoriées
                    </th>
                    <th className="p-4 text-right">
                      Volume de transactions (Année)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150">
                  {producers.length > 0 ? (
                    producers.map((prod, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="p-4 font-bold text-gray-900">
                          {prod.name}
                        </td>
                        <td className="p-4 font-semibold text-gray-600 font-mono text-xs">
                          {prod.siret}
                        </td>
                        <td className="p-4 font-medium">
                          {prod.tvaRegime === "franchise" ? (
                            <span className="px-2.5 py-1 bg-blue-50 border border-blue-150 text-blue-700 rounded-full text-xs font-bold">
                              Franchise (Art. 293 B)
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-green-50 border border-green-150 text-green-700 rounded-full text-xs font-bold">
                              Régime Réel de TVA
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-center font-bold text-gray-800">
                          {prod.totalSalesCount} ventes
                        </td>
                        <td className="p-4 text-right font-black text-gray-950">
                          {prod.cumulativeRevenue.toFixed(2)} €
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="5"
                        className="p-8 text-center text-gray-400 italic"
                      >
                        Aucun producteur actif identifié dans le système.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
