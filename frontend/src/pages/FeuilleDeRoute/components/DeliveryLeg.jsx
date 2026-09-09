import React, { useState } from "react";
import {
  MapPin,
  Phone,
  Map,
  ShieldCheck,
  CheckCircle,
  Signature,
  Package,
  FileCheck,
  ClipboardCheck,
  X,
} from "lucide-react";

/**
 * 🚚 COMPOSANT : DeliveryLeg.jsx
 * Responsabilité unique : Gérer la liste des livraisons actives isolées par commande,
 * et piloter le modal interactif de pointage tactile, contrôle HACCP et émargement (SRP).
 */
export default function DeliveryLeg({
  deliveries = [],
  onConfirmDelivery,
  processingId,
}) {
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [checkedItems, setCheckedItems] = useState({});
  const [tempInput, setTempInput] = useState("4.0");
  const [signatureInput, setSignatureInput] = useState("");

  if (deliveries.length === 0) {
    return (
      <div className="bg-white border border-gray-250 rounded-2xl p-8 text-center text-gray-400 italic shadow-sm flex flex-col items-center gap-3">
        <ClipboardCheck size={36} className="text-gray-300" />
        <p className="text-xs font-semibold">
          Aucune commande n'est actuellement en transit logistique.
        </p>
      </div>
    );
  }

  // Ouverture du modal de contrôle pour une commande spécifique
  const handleOpenModal = (delivery) => {
    setSelectedDelivery(delivery);
    setCheckedItems({});
    setTempInput("4.0");
    setSignatureInput("");
  };

  // Cocher/Décocher tactilement un article
  const handleToggleItem = (itemKey) => {
    setCheckedItems((prev) => ({
      ...prev,
      [itemKey]: !prev[itemKey],
    }));
  };

  // Traitement de l'émargement final
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedDelivery) return;

    onConfirmDelivery(
      selectedDelivery.parentOrderId,
      Number(tempInput),
      signatureInput || "EMARGEMENT_NUMERIQUE_OK",
    );
    setSelectedDelivery(null);
  };

  return (
    <div className="space-y-4">
      {deliveries.map((d) => {
        const isProcessing = processingId === d.parentOrderId;
        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          d.deliveryAddress || d.buyerName,
        )}`;

        // Aplatir tous les articles de cette commande
        const allItems = d.subOrders.flatMap((sub) => sub.items || []);

        return (
          <div
            key={d.parentOrderId}
            className="bg-white border border-gray-250 rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden"
          >
            {/* En-tête de livraison par commande */}
            <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[9px] font-black uppercase text-blue-700 bg-blue-50 border border-blue-150 px-2 py-0.5 rounded-md">
                    {d.buyerProfile === "B2G"
                      ? "🏛️ Collectivité (B2G)"
                      : "🏢 Commerce (B2B)"}
                  </span>
                  <span className="text-[10px] font-mono font-black text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                    #{d.parentOrderId.slice(0, 8).toUpperCase()}
                  </span>
                </div>
                <h4 className="text-sm font-black text-gray-900">
                  {d.buyerName}
                </h4>
              </div>

              {/* Raccourcis de contact & Navigation */}
              <div className="flex items-center gap-2">
                {d.buyerPhone && (
                  <a
                    href={`tel:${d.buyerPhone}`}
                    className="p-2 border border-gray-200 text-gray-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition"
                    title="Appeler l'acheteur"
                  >
                    <Phone size={15} />
                  </a>
                )}
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 border border-gray-200 text-gray-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition flex items-center gap-1.5 text-xs font-bold"
                  title="Ouvrir l'itinéraire de distribution"
                >
                  <Map size={15} />
                  <span className="hidden sm:inline">Itinéraire</span>
                </a>
              </div>
            </div>

            {/* Corps de la fiche de livraison */}
            <div className="p-5 space-y-4">
              {/* Adresse d'acheminement */}
              <div className="flex items-start gap-2.5 text-xs font-semibold text-gray-600">
                <MapPin size={16} className="text-gray-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <span className="text-gray-400 block text-[10px] font-black uppercase tracking-wider">
                    Adresse de distribution
                  </span>
                  <span className="text-gray-900 font-bold">
                    {d.deliveryAddress || "Point de retrait central"}
                  </span>
                </p>
              </div>

              {/* Contenu et traçabilité de la commande */}
              <div className="space-y-2 border-t border-gray-100 pt-4">
                <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider block">
                  Contenu de la commande ({allItems.length} article(s))
                </span>
                <div className="p-3 bg-gray-50/50 rounded-xl border border-gray-150 text-[11px] text-gray-600 font-semibold space-y-1.5">
                  {allItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center"
                    >
                      <span className="text-gray-800 font-bold">
                        {item.name || item.title}
                      </span>
                      <span className="text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded font-black">
                        x{item.quantity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Statut de complétude */}
              {d.isComplete ? (
                <div className="p-3 bg-green-50/50 border border-green-200 rounded-xl text-[10px] text-green-800 font-bold flex items-center gap-2">
                  <CheckCircle size={15} className="text-green-600" />
                  <span>
                    Tous les colis de la commande ont été chargés avec succès
                    dans votre camionnette.
                  </span>
                </div>
              ) : (
                <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-xl text-[10px] text-amber-800 font-bold space-y-1">
                  <p>⚠️ Commande incomplète en attente de préparation chez :</p>
                  <p className="text-[9px] text-amber-700 font-semibold pl-2">
                    {d.missingProducers.join(", ")}
                  </p>
                </div>
              )}

              {/* Bouton de déclenchement d'émargement */}
              <div className="border-t border-gray-50 pt-4 flex justify-end">
                <button
                  onClick={() => handleOpenModal(d)}
                  disabled={isProcessing}
                  className="w-full sm:w-auto px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-400 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <span className="animate-pulse">
                      Validation de la livraison...
                    </span>
                  ) : (
                    <>
                      <Signature size={15} />
                      Contrôler & Émarder
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {/* ========================================================================= */}
      {/* 📱 MODAL ERGONOMIQUE MOBILE : POINTAGE TACTILE, HACCP & SIGNATURE */}
      {/* ========================================================================= */}
      {selectedDelivery && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl border border-gray-200 flex flex-col max-h-[90vh] overflow-hidden">
            {/* En-tête du modal */}
            <div className="flex justify-between items-center border-b border-gray-100 pb-4 shrink-0">
              <div className="space-y-0.5">
                <h3 className="text-base font-black text-gray-900 flex items-center gap-1.5">
                  <FileCheck className="text-emerald-700 animate-bounce" />
                  Contrôle de Livraison
                </h3>
                <p className="text-[10px] text-gray-400 font-semibold uppercase">
                  Pointage obligatoire des marchandises avant signature
                </p>
              </div>
              <button
                onClick={() => setSelectedDelivery(null)}
                className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Corps défilant du modal */}
            <form
              onSubmit={handleSubmit}
              className="flex-1 overflow-y-auto py-4 space-y-5 pr-1"
            >
              {/* ÉTAPE A : Liste de pointage tactile */}
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider">
                  Étape A : Pointer les articles remis au client *
                </label>
                <div className="space-y-2">
                  {selectedDelivery.subOrders
                    .flatMap((sub) => sub.items || [])
                    .map((item, idx) => {
                      const isChecked = checkedItems[idx];
                      return (
                        <div
                          key={idx}
                          onClick={() => handleToggleItem(idx)}
                          className={`p-3 border rounded-xl flex items-center justify-between cursor-pointer transition-all active:scale-[0.98] select-none ${
                            isChecked
                              ? "bg-green-50 border-green-200 text-green-900"
                              : "bg-white border-gray-250 hover:bg-gray-50 text-gray-800"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-5 h-5 rounded-md border flex items-center justify-center transition ${
                                isChecked
                                  ? "bg-green-600 border-green-600 text-white"
                                  : "border-gray-300 bg-white"
                              }`}
                            >
                              {isChecked && (
                                <CheckCircle size={14} className="stroke-[3]" />
                              )}
                            </div>
                            <span
                              className={`text-xs font-bold ${isChecked ? "line-through text-green-700" : ""}`}
                            >
                              {item.name || item.title}
                            </span>
                          </div>
                          <span
                            className={`text-xs font-black px-2 py-0.5 rounded ${
                              isChecked
                                ? "bg-green-100 text-green-900"
                                : "bg-emerald-50 text-emerald-800"
                            }`}
                          >
                            x{item.quantity}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* ÉTAPE B : Saisie HACCP thermique */}
              <div className="space-y-2 border-t border-gray-100 pt-4">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider block">
                    Étape B : Relevé Température HACCP (°C) *
                  </label>
                  {/* Badge d'évaluation en direct */}
                  {Number(tempInput) >= 2.0 && Number(tempInput) <= 6.0 ? (
                    <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-150 px-2 py-0.5 rounded-full">
                      ✓ Conforme (Cible &lt; 6°C)
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold text-red-700 bg-red-50 border border-red-150 px-2 py-0.5 rounded-full animate-pulse">
                      ⚠ Alerte : Température hors cible
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  step="0.1"
                  required
                  min="-5"
                  max="25"
                  value={tempInput}
                  onChange={(e) => setTempInput(e.target.value)}
                  className="w-full border-gray-250 rounded-xl p-2.5 text-xs font-bold border focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
                <p className="text-[9px] text-gray-400 font-semibold">
                  Pour garantir la sécurité alimentaire des circuits courts, la
                  température doit être relevée dans le caisson frigorifique au
                  déchargement.
                </p>
              </div>

              {/* ÉTAPE C : Signature / Nom de l'émargeur */}
              <div className="space-y-2 border-t border-gray-100 pt-4">
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider">
                  Étape C : Signature de l'acheteur (Nom de l'émargeur) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: M. Dupont / Responsable Cuisine"
                  value={signatureInput}
                  onChange={(e) => setSignatureInput(e.target.value)}
                  className="w-full border-gray-250 rounded-xl p-2.5 text-xs font-bold border focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Étape D : Rendu et bouton final */}
              <div className="border-t border-gray-100 pt-4 shrink-0 flex flex-col sm:flex-row justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedDelivery(null)}
                  className="px-4 py-2.5 border border-gray-200 text-gray-600 text-xs font-black uppercase tracking-wider rounded-xl hover:bg-gray-50 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={
                    !selectedDelivery.subOrders
                      .flatMap((sub) => sub.items || [])
                      .every((_, idx) => checkedItems[idx])
                  }
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-gray-200 disabled:text-gray-400 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
                >
                  <CheckCircle size={15} />
                  Valider & Émettre les pièces
                </button>
              </div>
              <div className="text-center">
                {!selectedDelivery.subOrders
                  .flatMap((sub) => sub.items || [])
                  .every((_, idx) => checkedItems[idx]) && (
                  <span className="text-[9px] text-amber-600 font-extrabold uppercase animate-pulse">
                    ⚠️ Veuillez cocher tous les colis reçus pour déverrouiller
                    la signature.
                  </span>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
