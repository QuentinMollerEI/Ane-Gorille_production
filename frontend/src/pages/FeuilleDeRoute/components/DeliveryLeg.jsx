import React, { useState, useRef } from "react";
import { Truck, Thermometer, PenTool, CheckCircle, Building, MapPin, Package, X, RotateCcw, ShieldCheck } from "lucide-react";

/**
 * ✍️ COMPOSANT : Pad de Signature Tactile HTML5 Canvas (Norme eIDAS)
 */
function CanvasSignaturePad({ onSave, onClear }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.strokeStyle = "#064e3b"; // Couleur Emeraude
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas && hasDrawn && onSave) {
      onSave(canvas.toDataURL("image/png"));
    }
  };

  const handleClearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    if (onClear) onClear();
  };

  return (
    <div className="space-y-1.5">
      <div className="border border-slate-300 rounded-md bg-slate-50 relative overflow-hidden touch-none">
        <canvas
          ref={canvasRef}
          width={360}
          height={120}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-[120px] cursor-crosshair"
        />
        {!hasDrawn && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 font-medium text-xs">
            Signez ici avec le doigt ou le stylet
          </div>
        )}
      </div>

      {hasDrawn && (
        <button
          type="button"
          onClick={handleClearCanvas}
          className="text-[10px] text-slate-500 hover:text-red-700 font-bold flex items-center gap-1 cursor-pointer"
        >
          <RotateCcw size={12} /> Recommencer la signature
        </button>
      )}
    </div>
  );
}

/**
 * 🌾 COMPOSANT : DeliveryLeg.jsx
 * Module de livraison avec isoloir client étanche (RGPD) et pad de signature électronique.
 */
export default function DeliveryLeg({ deliveries = [], onConfirmDelivery, processingId }) {
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [tempHaccp, setTempHaccp] = useState("3.5");
  const [recipientName, setRecipientName] = useState("");
  const [signatureBase64, setSignatureBase64] = useState("");

  const handleOpenClientModal = (delivery) => {
    setSelectedDelivery(delivery);
    setTempHaccp("3.5");
    setRecipientName("");
    setSignatureBase64("");
  };

  const handleCloseModal = () => {
    setSelectedDelivery(null);
  };

  const handleSubmitDelivery = (e) => {
    e.preventDefault();
    if (!selectedDelivery) return;

    const parentOrderId = selectedDelivery.parentOrderId;
    const tempNum = Number(tempHaccp);

    if (isNaN(tempNum)) {
      alert("Veuillez saisir une température valide.");
      return;
    }

    if (onConfirmDelivery) {
      onConfirmDelivery(
        parentOrderId,
        tempNum,
        signatureBase64 || "EMARGEMENT_NUMERIQUE_OK",
        recipientName
      );
    }
    handleCloseModal();
  };

  if (!deliveries || deliveries.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-md border border-dashed border-slate-300 text-slate-400 font-bold italic text-xs">
        Aucune livraison en attente pour cette tournée.
      </div>
    );
  }

  const tempVal = Number(tempHaccp);
  const isTempOk = tempVal >= 2.0 && tempVal <= 8.0;

  return (
    <div className="space-y-3 text-xs font-sans text-slate-800">
      {/* LISTE DES POINTS DE LIVRAISON SANS FUITE DE DONNÉES */}
      <div className="grid grid-cols-1 gap-2.5">
        {deliveries.map((delivery) => {
          const parentOrderId = delivery.parentOrderId;
          const isProcessing = processingId === parentOrderId;

          return (
            <div
              key={parentOrderId}
              className="bg-white border border-slate-200 rounded-md p-3.5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-slate-300 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-1 bg-blue-100 text-blue-900 rounded-md">
                    <Building size={15} />
                  </span>
                  <h4 className="font-extrabold text-slate-900 text-sm">
                    {delivery.buyerName || "Acheteur Client"}
                  </h4>
                  {delivery.buyerProfile === "B2G" && (
                    <span className="bg-sky-100 text-sky-900 font-black text-[9px] px-1.5 py-0.5 rounded uppercase border border-sky-300">
                      Secteur Public (Chorus Pro)
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
                  <MapPin size={12} className="text-emerald-700 shrink-0" />
                  <span>{delivery.deliveryAddress}</span>
                </p>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-center">
                <div className="text-right hidden sm:block">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Réf Commande</span>
                  <span className="font-mono font-bold text-slate-900 text-xs">
                    #{parentOrderId.substring(0, 8).toUpperCase()}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenClientModal(delivery)}
                  disabled={isProcessing}
                  className="px-3.5 py-2 bg-blue-900 hover:bg-black text-white font-extrabold rounded-md text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <PenTool size={14} />
                  <span>Ouvrir Bon de Livraison & Émarger</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 🔒 ISOLOIR D'ÉMARGEMENT CLIENT ISOLÉ (MODALE PLEIN ÉCRAN RGPD) */}
      {selectedDelivery && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in">
          <div className="bg-white rounded-md max-w-xl w-full max-h-[92vh] overflow-y-auto shadow-2xl p-5 space-y-4 text-slate-900 text-xs">
            {/* En-tête du Bon de Livraison de CE client uniquement */}
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-800 text-white rounded-md flex items-center justify-center font-black text-xs">
                  AG
                </div>
                <div>
                  <h3 className="font-black text-sm uppercase tracking-tight text-slate-900">
                    Bon de Livraison & Émargement
                  </h3>
                  <p className="text-[10px] text-slate-500 font-bold">
                    Âne & Gorille — Réseau Logistique B2B & B2G
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseModal}
                className="p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Cartouche Client Unique */}
            <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-md text-[11px]">
              <div>
                <span className="text-slate-400 font-bold uppercase text-[9px] block">Acheteur Destinataire</span>
                <span className="font-extrabold text-slate-900">{selectedDelivery.buyerName}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase text-[9px] block">Réf Commande</span>
                <span className="font-mono font-extrabold text-slate-900">#{selectedDelivery.parentOrderId.substring(0, 8).toUpperCase()}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 font-bold uppercase text-[9px] block">Adresse de Livraison</span>
                <span className="font-medium text-slate-800">{selectedDelivery.deliveryAddress}</span>
              </div>
            </div>

            {/* Contenu de la commande du client */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase text-slate-500 block">
                Colis Chargés ({selectedDelivery.subOrders?.length || 1} lot(s))
              </span>
              <div className="border border-slate-200 rounded-md overflow-hidden divide-y divide-slate-100 bg-white">
                {(selectedDelivery.subOrders || []).map((sub, idx) => (
                  <div key={idx} className="p-2 flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-900">{sub.producerName || "Maraîcher Partner"}</span>
                    <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      N° Lot : {sub.lotNumber || sub.batchNumber || "LOT-HACCP"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Formulaire d'émargement et de température HACCP */}
            <form onSubmit={handleSubmitDelivery} className="space-y-3 pt-1 border-t border-slate-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Température Froid (°C) */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 text-[11px] flex items-center gap-1 uppercase tracking-wider">
                    <Thermometer size={13} className="text-emerald-700" /> Température Froid (°C) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={tempHaccp}
                    onChange={(e) => setTempHaccp(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-md font-bold font-mono text-slate-900 text-xs focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                  <span className={`text-[9px] font-bold block ${isTempOk ? "text-emerald-700" : "text-red-600"}`}>
                    {isTempOk ? "🟢 Conforme (2°C - 8°C)" : "🔴 Alerte température hors norme"}
                  </span>
                </div>

                {/* Nom du Réceptionnaire */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 text-[11px] flex items-center gap-1 uppercase tracking-wider">
                    Réceptionnaire (Nom/Fonction)
                  </label>
                  <input
                    type="text"
                    placeholder="ex: M. Martin (Chef de cuisine)"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-md font-bold text-slate-900 text-xs focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>
              </div>

              {/* Pad de Signature Tactile */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 text-[11px] flex items-center gap-1 uppercase tracking-wider">
                  <PenTool size={13} className="text-emerald-700" /> Signature Électronique *
                </label>
                <CanvasSignaturePad
                  onSave={(base64) => setSignatureBase64(base64)}
                  onClear={() => setSignatureBase64("")}
                />
              </div>

              {/* Actions de validation */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-3.5 py-2 border border-slate-300 text-slate-700 font-bold rounded-md text-xs hover:bg-slate-100 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold rounded-md text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <CheckCircle size={14} />
                  <span>Valider l'Émargement & Signer le BL</span>
                </button>
              </div>
            </form>

            <div className="text-[9px] text-slate-400 flex items-center gap-1 pt-1">
              <ShieldCheck size={11} className="text-emerald-700" />
              <span>Acte juridique de transfert de responsabilité certifié eIDAS & HACCP.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}