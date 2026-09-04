import React, { useState } from "react";
import {
  ChevronUp,
  ChevronDown,
  Package,
  Printer,
  ArrowRight,
  Calendar,
  Clock,
  User,
  MapPin,
  CheckCircle2,
} from "lucide-react";

/**
 * 🥬 COMPARTIMENT : ToHarvestCompartment.jsx
 * Gère les bons de préparation au statut 'A_PREPARER'.
 * Intègre la saisie obligatoire de traçabilité HACCP et la validation.
 */
export default function ToHarvestCompartment({
  subOrders,
  onValidate,
  onPrint,
}) {
  const [isRetracted, setIsRetracted] = useState(false);
  const [batchInputs, setBatchInputs] = useState({});

  const handleInputChange = (id, val) => {
    setBatchInputs((prev) => ({ ...prev, [id]: val }));
  };

  const handleValidationSubmit = (orderId, items) => {
    const lotNumbers = batchInputs[orderId] || "";
    onValidate(orderId, lotNumbers, items);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-3xl shadow-xs overflow-hidden">
      {/* En-tête du compartiment repliable */}
      <div
        onClick={() => setIsRetracted(!isRetracted)}
        className="bg-gray-50 border-b border-gray-150 px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-100/70 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center bg-amber-50 border border-amber-200 text-amber-800 text-xs font-black px-2.5 py-1 rounded-xl">
            🥬 À Récolter / Préparer ({subOrders.length})
          </span>
          <span className="text-[11px] text-gray-500 font-medium hidden sm:inline">
            Produits fraîchement commandés nécessitant récolte et étiquetage
            HACCP.
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
                Aucun bon à récolter pour le moment.
              </p>
              <p className="text-[10px] text-gray-400 mt-1">
                Les nouvelles commandes apparaîtront automatiquement en temps
                réel.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {subOrders.map((order) => (
                <div
                  key={order.id}
                  className="border border-gray-200 rounded-2xl p-5 hover:border-gray-300 transition-colors bg-white"
                >
                  {/* Métadonnées de commande */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-150 pb-3 gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono bg-gray-100 border border-gray-200 text-gray-700 px-2.5 py-0.5 rounded-lg font-black">
                          #{order.subOrderId || order.id.substring(0, 8)}
                        </span>
                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 animate-pulse">
                          À récolter
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
                    <div className="bg-gray-50 border border-gray-150 rounded-xl p-3">
                      <table className="w-full text-left text-xs font-medium text-gray-600">
                        <thead>
                          <tr className="border-b border-gray-200 text-[9px] uppercase text-gray-400 font-black">
                            <th className="pb-1.5">Légume / Produit</th>
                            <th className="pb-1.5 text-center">
                              Quantité à peser
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {order.items.map((item, idx) => (
                            <tr
                              key={idx}
                              className="hover:bg-white/40 transition-colors"
                            >
                              <td className="py-2.5 font-bold text-gray-900">
                                {item.name || item.title}
                              </td>
                              <td className="py-2.5 text-center font-extrabold text-green-700">
                                {item.quantity || item.qty} {item.unit || "kg"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Saisie HACCP & Actions */}
                  <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-end gap-4 pt-3 border-t border-gray-150">
                    <div className="flex-grow max-w-md space-y-1">
                      <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wider">
                        Saisie de traçabilité HACCP *
                      </label>
                      <input
                        type="text"
                        value={batchInputs[order.id] || ""}
                        onChange={(e) =>
                          handleInputChange(order.id, e.target.value)
                        }
                        placeholder="Ex: LOT-2026-REC-01, ou Heure de récolte"
                        className="w-full border border-gray-200 rounded-xl p-2 text-xs font-mono bg-white focus:ring-1 focus:ring-green-500"
                      />
                      <p className="text-[9px] text-gray-400">
                        Mention obligatoire pour garantir l'origine saine et la
                        traçabilité des circuits courts.
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5 justify-end">
                      <button
                        onClick={() => onPrint(order)}
                        className="flex items-center justify-center gap-1.5 border border-gray-200 hover:bg-gray-50 text-gray-600 font-bold py-2 px-3.5 rounded-xl text-xs transition-colors cursor-pointer bg-white"
                      >
                        <Printer size={13} />
                        <span>Imprimer</span>
                      </button>
                      <button
                        onClick={() =>
                          handleValidationSubmit(order.id, order.items)
                        }
                        className="flex items-center justify-center gap-1.5 bg-green-700 hover:bg-green-800 text-white font-black py-2 px-4 rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-xs"
                      >
                        <span>Prêt</span>
                        <ArrowRight size={13} />
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
