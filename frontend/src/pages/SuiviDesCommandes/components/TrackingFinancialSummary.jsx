import React from "react";
import { MapPin, Building, FileText, Download } from "lucide-react";

/**
 * 💳 COMPOSANT : TrackingFinancialSummary.jsx
 * Détail des adresses, identifiants de facturation B2B/B2G et téléchargements PDF
 */
export default function TrackingFinancialSummary({ order }) {
  const isPublicBuyer =
    order.paymentMethod === "mandat" ||
    order.buyerRole === "client_public" ||
    order.buyerRole === "acheteur_public";
  const totalHT = Number(order.totalHT || order.totalAmount || 0);
  const totalTVA = Number(order.totalTVA || totalHT * 0.055);
  const totalTTC = Number(
    order.totalTTC || order.totalAmount || totalHT + totalTVA,
  );

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-4 text-xs">
      {/* COMPARTIMENT 1 : ADRESSE DE LIVRAISON */}
      <div className="space-y-1.5 border-b border-gray-200 pb-3">
        <p className="font-black text-gray-900 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
          <MapPin size={13} className="text-emerald-700" />
          Point de Distribution
        </p>
        <p className="font-bold text-gray-800 leading-snug">
          {order.deliveryAddress || "Adresse enregistrée dans Mon Profil"}
        </p>
      </div>

      {/* COMPARTIMENT 2 : FACTURATION & CHORUS PRO */}
      <div className="space-y-1.5 border-b border-gray-200 pb-3">
        <p className="font-black text-gray-900 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
          <Building size={13} className="text-blue-700" />
          Facturation Légale
        </p>
        <p className="font-semibold text-gray-700">
          Entité :{" "}
          <strong className="text-gray-900">
            {order.buyerName || order.companyName || "Acheteur"}
          </strong>
        </p>
        <p className="font-mono text-gray-600 text-[11px]">
          SIRET : {order.buyerSiret || order.siretBuyer || "Consigné"}
        </p>
        {isPublicBuyer &&
          order.refEngagement &&
          order.refEngagement !== "-" && (
            <p className="font-bold text-blue-900 text-[11px]">
              N° Engagement Chorus Pro : {order.refEngagement}
            </p>
          )}
        <p className="text-[11px] font-bold text-emerald-800">
          Règlement :{" "}
          {isPublicBuyer
            ? "Mandat Administratif (LME 30 jours)"
            : "Carte Bancaire (Stripe Connect)"}
        </p>
      </div>

      {/* COMPARTIMENT 3 : VENTILATION FINANCIÈRE */}
      <div className="space-y-1 font-bold border-b border-gray-200 pb-3">
        <div className="flex justify-between text-gray-600">
          <span>Sous-total HT :</span>
          <span>{totalHT.toFixed(2)} €</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>TVA (5.5%) :</span>
          <span>{totalTVA.toFixed(2)} €</span>
        </div>
        <div className="flex justify-between text-gray-900 font-black pt-1 border-t border-gray-200">
          <span>Total TTC :</span>
          <span className="text-emerald-800">{totalTTC.toFixed(2)} €</span>
        </div>
      </div>

      {/* COMPARTIMENT 4 : TÉLÉCHARGEMENTS JUSTIFICATIFS */}
      <div className="flex gap-2">
        <button
          onClick={() =>
            alert(
              `📄 Duplicata du Bon de Commande BC-${order.id.slice(0, 8).toUpperCase()}`,
            )
          }
          className="flex-1 bg-white hover:bg-gray-100 text-gray-800 font-black py-2 px-3 rounded-xl border border-gray-300 transition-colors flex items-center justify-center gap-1 cursor-pointer"
        >
          <Download size={13} />
          <span>B.C. (PDF)</span>
        </button>

        {["LIVRE", "TERMINE"].includes(order.status) && (
          <button
            onClick={() =>
              alert(
                `📄 Facture d'Achat FAC-${order.id.slice(0, 8).toUpperCase()}`,
              )
            }
            className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-black py-2 px-3 rounded-xl transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-sm"
          >
            <FileText size={13} />
            <span>Facture</span>
          </button>
        )}
      </div>
    </div>
  );
}
