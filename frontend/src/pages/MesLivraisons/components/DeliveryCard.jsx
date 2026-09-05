import React, { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  MapPin,
  Truck,
  CheckSquare,
  UserCheck,
  Receipt,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import DeliveryItemsList from "./DeliveryItemsList";

/**
 * 📦 COMPOSANT : DeliveryCard.jsx
 * Responsabilité unique : Gérer la carte collapsible d'une escale client et assembler les données logistiques.
 * Affiche la complétude du panier de proximité et le bouton d'émargement d'un point de distribution acheteur.
 */
export default function DeliveryCard({
  delivery,
  isExpanded,
  onToggle,
  onOpenSignatureModal,
}) {
  const isCompleted = delivery.status === "LIVRE";

  return (
    <div
      className={`bg-white border rounded-3xl overflow-hidden shadow-xs transition-all duration-200 ${
        isCompleted
          ? "border-green-150 bg-green-50/10"
          : delivery.isComplete
            ? "border-gray-200 hover:border-green-700"
            : "border-amber-250 bg-amber-50/10 hover:border-amber-400"
      }`}
    >
      {/* En-tête cliquable (Résumé d'escale) */}
      <div
        onClick={onToggle}
        className="p-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 cursor-pointer hover:bg-gray-50/30 transition-colors select-none"
      >
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-2">
            <span className="text-xs font-mono bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-lg font-black text-gray-800">
              #{delivery.buyerId.substring(0, 8).toUpperCase()}
            </span>

            {/* Statuts adaptatifs logistiques */}
            {isCompleted ? (
              <span className="text-[10px] font-black uppercase tracking-wider bg-green-50 border border-green-200 text-green-700 px-2.5 py-1 rounded-full flex items-center gap-1">
                <CheckCircle2 size={11} /> Livré & Signé
              </span>
            ) : delivery.isComplete ? (
              <span className="text-[10px] font-black uppercase tracking-wider bg-green-600 text-white px-2.5 py-1 rounded-full">
                ✓ Prêt (Colis Chargés)
              </span>
            ) : (
              <span className="text-[10px] font-black uppercase tracking-wider bg-amber-50 border border-amber-200 text-amber-700 px-2.5 py-1 rounded-full flex items-center gap-1 animate-pulse">
                <AlertTriangle size={11} /> Commande Incomplète
              </span>
            )}

            {delivery.buyerProfile === "B2G" && (
              <span className="text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200 px-2.5 py-0.5 rounded-full">
                Secteur Public (B2G)
              </span>
            )}
          </div>

          <h3 className="text-sm font-black text-gray-900 leading-snug">
            {delivery.billingName || "Établissement Client"}
          </h3>

          <p className="text-xs font-semibold text-gray-600 flex items-center gap-1 leading-relaxed">
            <MapPin size={13} className="text-green-700 flex-shrink-0" />{" "}
            {delivery.deliveryAddress}
          </p>
        </div>

        {/* Détails du volume, de la complétude, et expand */}
        <div className="flex items-center gap-5 self-end lg:self-auto">
          <div className="text-left lg:text-right">
            <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider leading-none">
              Chargement
            </p>
            <p
              className={`text-sm font-black mt-1 ${isCompleted ? "text-green-700" : delivery.isComplete ? "text-green-700" : "text-amber-700"}`}
            >
              {delivery.loadedCount} / {delivery.totalCount} Colis
            </p>
          </div>
          <div className="p-1.5 border border-gray-200 rounded-xl bg-white text-gray-400 hover:text-gray-700 transition-colors">
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>
      </div>

      {/* ⚠️ ZONE D'ALERTE POUR COMMANDE INCOMPLÈTE */}
      {!isCompleted && !delivery.isComplete && (
        <div className="mx-6 mb-4 p-3 bg-amber-50 border border-amber-200 rounded-2xl flex gap-2 items-start text-[10px] text-amber-900 leading-relaxed font-semibold">
          <AlertTriangle
            className="text-amber-700 flex-shrink-0 mt-0.5"
            size={15}
          />
          <div>
            <strong className="font-bold uppercase tracking-wider block">
              Attention : Colis manquants pour cet arrêt !
            </strong>
            <span>
              Certains maraîchers de proximité n'ont pas encore finalisé la
              préparation HACCP de leur commande ou le ramassage n'a pas été
              validé à l'Étape 1 :
            </span>
            <div className="mt-1 flex flex-wrap gap-1.5 font-bold">
              {delivery.pendingProducers.map((name, idx) => (
                <span
                  key={idx}
                  className="bg-white border border-amber-200 text-amber-800 px-1.5 py-0.5 rounded"
                >
                  🧑‍🌾 {name}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Détails collapsibles (Pointage colis & Signature d'émargement) */}
      {isExpanded && (
        <div className="px-6 pb-6 pt-4 border-t border-gray-150 bg-gray-50/50 space-y-6">
          {/* Bloc 1 : Coordonnées administratives */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border p-4 rounded-2xl text-xs space-y-1.5">
              <p>
                <strong className="text-gray-500">Contact Facturation :</strong>{" "}
                <span className="text-gray-800 font-bold">
                  {delivery.billingEmail || "Non communiqué"}
                </span>
              </p>
              {delivery.engagementNumber && (
                <p className="flex items-center gap-1 font-bold text-blue-900 bg-blue-50 border border-blue-150 px-2 py-0.5 rounded-lg w-fit mt-1 text-[10px]">
                  <Receipt size={12} className="text-blue-700" />
                  <span>Engagement Chorus : {delivery.engagementNumber}</span>
                </p>
              )}
            </div>

            <div className="bg-white border p-4 rounded-2xl text-xs flex flex-col justify-center gap-2">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider leading-none">
                Archivage Légal (Factur-X/BL)
              </p>
              <button
                onClick={() =>
                  alert(
                    "Impression du Bon de Livraison (BL) logistique certifié...",
                  )
                }
                className="w-fit flex items-center gap-1.5 border border-gray-250 hover:bg-gray-50 text-gray-700 font-bold py-1.5 px-3 rounded-lg text-[10px] transition-colors cursor-pointer bg-white"
              >
                <FileText size={12} className="text-green-700" />
                <span>Imprimer Bon de Livraison</span>
              </button>
            </div>
          </div>

          {/* Bloc 2 : Liste de pointage des légumes */}
          <DeliveryItemsList subOrders={delivery.subOrders} />

          {/* Bloc 3 : Panneau d'émargement de clôture */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center pt-4 border-t border-dashed border-gray-200 gap-4">
            {isCompleted ? (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex gap-3 items-center text-xs text-green-900 w-full">
                <CheckCircle2
                  size={24}
                  className="text-green-700 flex-shrink-0"
                />
                <div>
                  <strong className="font-bold">
                    Colis livrés et certifiés par émargement numérique
                  </strong>
                  <p className="text-[10px] text-green-600 mt-0.5">
                    Réceptionné par :{" "}
                    <span className="font-bold uppercase">
                      {delivery.recipientName}
                    </span>{" "}
                    ({delivery.recipientRole}) le{" "}
                    {delivery.deliveredAt
                      ? new Date(
                          delivery.deliveredAt.seconds * 1000,
                        ).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-gray-700">
                    Prêt pour la remise finale ?
                  </p>
                  <p className="text-[10px] text-gray-400">
                    Faites signer électroniquement le client pour valider sa
                    conformité et solder la transaction.
                  </p>
                </div>

                {!delivery.isComplete && (
                  <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-[9px] text-amber-900 font-medium">
                    <AlertTriangle size={14} className="text-amber-700" />
                    <span>
                      Incomplet ! S'assurer que le client accepte une livraison
                      partielle avant d'émarger.
                    </span>
                  </div>
                )}

                <button
                  onClick={() => onOpenSignatureModal(delivery)}
                  className="flex items-center justify-center gap-2 bg-green-700 hover:bg-green-800 text-white font-black py-3 px-6 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md"
                >
                  <span>Procéder à l'émargement</span>
                  <ArrowRight size={14} />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
