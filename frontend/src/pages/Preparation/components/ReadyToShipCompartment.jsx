import React, { useState } from "react";
import {
  ChevronUp,
  ChevronDown,
  Package,
  Printer,
  Calendar,
  Clock,
  User,
  MapPin,
  CheckCircle2,
} from "lucide-react";

/**
 * 📦 COMPARTIMENT : ReadyToShipCompartment.jsx
 * Affiche les bons de préparation au statut 'PRET_A_EXPEDIER'.
 * Historise les numéros de lots déjà saisis et permet l'impression des étiquettes.
 */
export default function ReadyToShipCompartment({ subOrders, onPrint }) {
  const [isRetracted, setIsRetracted] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-3xl shadow-xs overflow-hidden">
      {/* En-tête du compartiment repliable */}
      <div
        onClick={() => setIsRetracted(!isRetracted)}
        className="bg-gray-50 border-b border-gray-150 px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-100/70 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center bg-green-50 border border-green-200 text-green-800 text-xs font-black px-2.5 py-1 rounded-xl">
            📦 Prêt pour Expédition ({subOrders.length})
          </span>
          <span className="text-[11px] text-gray-500 font-medium hidden sm:inline">
            Colis préparés et validés, en attente de ramassage par le
            transporteur.
          </span>
        </div>
        <button className="text-gray-400 hover:text-gray-600">
          {isRetracted ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
        </button>
      </div>

      {/* Contenu rétractable */}
      {!isRetracted && (
        <div className="p-6 space-y-6">
          {subOrders.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/30">
              <Package
                className="mx-auto text-gray-300 mb-3 stroke-1"
                size={40}
              />
              <p className="text-gray-500 font-extrabold text-sm">
                Aucune commande prête à expédier.
              </p>
              <p className="text-[10px] text-gray-400 mt-1">
                Validez vos récoltes dans le premier compartiment pour les
                transférer ici.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {subOrders.map((order) => (
                <div
                  key={order.id}
                  className="border border-green-200 bg-green-50/10 rounded-2xl p-5 transition-colors"
                >
                  {/* Métadonnées */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-green-150 pb-3 gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono bg-gray-100 border border-gray-200 text-gray-700 px-2.5 py-0.5 rounded-lg font-black">
                          #{order.subOrderId || order.id.substring(0, 8)}
                        </span>
                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-green-100 border border-green-300 text-green-800">
                          Colis Prêt
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-gray-800 flex items-center gap-1.5 pt-1">
                        <User size={13} className="text-gray-400" />
                        {order.buyerName}
                      </h4>
                      <div className="flex items-center gap-3 text-[10px] text-gray-400 font-medium">
                        <span className="flex items-center gap-1">
                          <Calendar size={11} />
                          {order.createdAt
                            ? new Date(
                                order.createdAt.seconds * 1000,
                              ).toLocaleDateString()
                            : "N/A"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={11} />
                          {order.createdAt
                            ? new Date(
                                order.createdAt.seconds * 1000,
                              ).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "N/A"}
                        </span>
                      </div>
                    </div>

                    {/* Destination de livraison */}
                    <div className="text-left md:text-right max-w-xs space-y-1">
                      <p className="text-[9px] text-gray-400 uppercase font-black tracking-wider flex items-center md:justify-end gap-1">
                        <MapPin size={11} /> Lieu de livraison
                      </p>
                      <p className="text-xs font-semibold text-gray-600 leading-tight">
                        {order.deliveryAddress ||
                          "Point de distribution central"}
                      </p>
                    </div>
                  </div>

                  {/* Tableau des articles */}
                  <div className="py-3">
                    <div className="bg-white border border-green-100 rounded-xl p-3">
                      <table className="w-full text-left text-xs font-medium text-gray-600">
                        <thead>
                          <tr className="border-b border-gray-150 text-[9px] uppercase text-gray-400 font-black">
                            <th className="pb-1.5">Légume / Produit</th>
                            <th className="pb-1.5 text-center">Quantité</th>
                            <th className="pb-1.5 text-right font-mono">
                              Lot HACCP
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {order.items.map((item, idx) => (
                            <tr
                              key={idx}
                              className="hover:bg-green-50/20 transition-colors"
                            >
                              <td className="py-2.5 font-bold text-gray-900">
                                {item.name || item.title}
                              </td>
                              <td className="py-2.5 text-center font-extrabold text-green-700">
                                {item.quantity || item.qty} {item.unit || "kg"}
                              </td>
                              <td className="py-2.5 text-right text-gray-500 font-mono text-[10px]">
                                {order.batchNumbers?.join(", ") || "Enregistré"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Informations de validation sanitaire */}
                  <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 pt-3 border-t border-green-150">
                    <div className="flex items-center gap-2 text-green-800 text-xs font-medium">
                      <CheckCircle2
                        className="text-green-700 flex-shrink-0"
                        size={16}
                      />
                      <div>
                        <strong>Traçabilité validée HACCP</strong>
                        <p className="text-[10px] text-green-600 mt-0.5">
                          Lots de traçabilité :{" "}
                          <span className="font-mono">
                            {order.batchNumbers?.join(", ") || "N/A"}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => onPrint(order)}
                        className="flex items-center justify-center gap-1.5 border border-green-200 hover:bg-green-100/50 text-green-800 font-bold py-2 px-3.5 rounded-xl text-xs transition-colors cursor-pointer bg-white"
                      >
                        <Printer size={13} />
                        <span>Imprimer l'étiquette</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
