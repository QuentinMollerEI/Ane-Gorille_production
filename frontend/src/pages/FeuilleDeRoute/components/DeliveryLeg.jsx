import React from "react";
import {
  Truck,
  MapPin,
  User,
  CheckSquare,
  Receipt,
  ArrowRight,
  Package,
  ExternalLink,
  FileText,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

/**
 * 📦 COMPOSANT : DeliveryLeg.jsx (v3 - Complétude Logistique Intégrée)
 * Responsabilité unique : Gérer la liste des livraisons logistiques groupées à destination des acheteurs.
 * Affiche les informations de facturation Chorus Pro, les adresses, et les légumes de proximité associés,
 * avec un indicateur de complétude en direct pour les commandes multi-producteurs.
 */
export default function DeliveryLeg({
  deliveries,
  onConfirmDelivery,
  processingId,
}) {
  if (deliveries.length === 0) {
    return (
      <div className="text-center py-10 bg-white border border-dashed rounded-2xl p-6">
        <Truck className="mx-auto text-gray-300 mb-2 stroke-1" size={36} />
        <p className="text-xs font-bold text-gray-500">
          Aucun colis en cours de livraison.
        </p>
        <p className="text-[10px] text-gray-400 mt-1">
          Validez l'enlèvement chez un maraîcher pour lancer l'expédition de la
          marchandise vers les acheteurs.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
        <span className="text-xs font-black uppercase text-green-700 bg-green-50 border border-green-200 px-2.5 py-0.5 rounded-full">
          Étape 2 : Tournée de Livraison
        </span>
        <span className="text-xs text-gray-400 font-semibold">
          ({deliveries.length} points de distribution)
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {deliveries.map((delivery) => (
          <div
            key={delivery.buyerId}
            className={`bg-white border rounded-2xl p-5 shadow-xs transition-all ${
              delivery.isComplete
                ? "border-gray-200 hover:border-green-300"
                : "border-amber-200 hover:border-amber-300 bg-amber-50/5"
            }`}
          >
            {/* Destination d'expédition */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-100 pb-4 gap-4">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-base">🏢</span>
                  <h4 className="font-extrabold text-sm text-gray-800 uppercase tracking-wide">
                    {delivery.buyerName || "Établissement Pro / Public"}
                  </h4>
                  {delivery.buyerProfile === "B2G" && (
                    <span className="text-[9px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-150 px-2 py-0.5 rounded">
                      Secteur Public (B2G)
                    </span>
                  )}
                </div>
                <p className="text-xs font-bold text-gray-600 flex items-center gap-1 leading-snug">
                  <MapPin size={12} className="text-green-700 flex-shrink-0" />{" "}
                  {delivery.deliveryAddress}
                </p>
              </div>

              {/* Engagement Chorus Pro */}
              {delivery.engagementNumber && (
                <div className="flex items-center gap-1 bg-blue-50 border border-blue-150 text-[10px] text-blue-800 font-bold px-2.5 py-1 rounded-xl">
                  <Receipt size={12} className="text-blue-700" />
                  <span>Engagement : {delivery.engagementNumber}</span>
                </div>
              )}
            </div>

            {/* 🔍 COMPLÉTUDE DE LA COMMANDE CLIENT (MULTI-PRODUCTEUR) */}
            <div className="my-3">
              {delivery.isComplete ? (
                <div className="flex items-center gap-2 p-2.5 bg-green-50 border border-green-150 rounded-xl text-[10px] text-green-800 font-bold">
                  <CheckCircle2
                    size={14}
                    className="text-green-700 flex-shrink-0"
                  />
                  <span>
                    Commande Complète ({delivery.colisLoaded}/
                    {delivery.totalColisToday} colis chargés) • Prêt pour remise
                    client.
                  </span>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-250 rounded-xl space-y-1.5 text-[10px] text-amber-900">
                  <div className="flex items-center gap-2 font-black text-amber-850">
                    <AlertTriangle
                      size={15}
                      className="text-amber-700 flex-shrink-0 animate-bounce"
                    />
                    <span>
                      Commande Incomplète ({delivery.colisLoaded}/
                      {delivery.totalColisToday} colis chargés)
                    </span>
                  </div>
                  <p className="font-medium leading-relaxed">
                    Certains colis de cette commande sont encore en attente de
                    préparation ou n'ont pas encore été récupérés chez les
                    maraîchers suivants :
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {delivery.missingProducers.map((prod, idx) => (
                      <span
                        key={idx}
                        className="bg-white border border-amber-250 text-amber-800 px-2 py-0.5 rounded font-bold uppercase tracking-wide text-[8px]"
                      >
                        🧑‍🌾 {prod}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Marchandises à remettre */}
            <div className="py-4 space-y-2.5">
              <p className="text-[10px] text-gray-400 uppercase font-black tracking-wider">
                Légumes du terroir chargés dans le camion :
              </p>
              <div className="bg-gray-50/50 border border-gray-150 rounded-xl p-3.5 space-y-3">
                {delivery.subOrders.map((sub) => (
                  <div
                    key={sub.id}
                    className="border-b border-dashed border-gray-200 last:border-0 pb-2.5 last:pb-0 space-y-1.5"
                  >
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-semibold text-gray-500">
                        🧑‍🌾 Provenance : {sub.producerName}
                      </span>
                      <span className="font-mono text-gray-400 font-bold">
                        Bon N° {sub.subOrderId || sub.id.substring(0, 8)}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {sub.items?.map((item, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] bg-white border border-gray-200 text-green-800 px-2 py-0.5 rounded-md font-bold"
                        >
                          {item.quantity || item.qty} {item.unit || "kg"} •{" "}
                          {item.title || item.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions de livraison */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center pt-3 border-t border-gray-100 gap-3">
              <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1">
                <User size={12} className="text-gray-300" />{" "}
                {delivery.billingEmail || "compta@etablissement.fr"}
              </span>

              <div className="flex items-center gap-2">
                {/* Visualiser le BL en route */}
                <button
                  onClick={() =>
                    alert(
                      "Impression du duplicata de Bon de Livraison (BL) en cours...",
                    )
                  }
                  className="flex items-center justify-center gap-1 border border-gray-250 hover:bg-gray-50 text-gray-600 font-bold py-2 px-3.5 rounded-xl text-[10px] uppercase tracking-wider transition-colors cursor-pointer bg-white"
                  title="Imprimer BL logistique"
                >
                  <FileText size={12} />
                  <span>BL</span>
                </button>

                {/* Valider la livraison */}
                <button
                  onClick={() =>
                    onConfirmDelivery(delivery.buyerId, delivery.subOrders)
                  }
                  disabled={processingId === delivery.buyerId}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-green-700 hover:bg-green-800 disabled:bg-gray-300 text-white font-black py-2.5 px-5 rounded-xl text-[10px] uppercase tracking-wider transition-all cursor-pointer shadow-sm"
                >
                  {processingId === delivery.buyerId ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                      <span>Enregistrement...</span>
                    </>
                  ) : (
                    <>
                      <CheckSquare size={13} />
                      <span>Confirmer la livraison</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
