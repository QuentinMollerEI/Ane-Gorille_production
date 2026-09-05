import React, { useState, useRef, useEffect } from "react";
import { X, PenTool, CheckCircle2, RotateCcw, AlertCircle } from "lucide-react";

/**
 * ✍️ COMPOSANT : SignatureModal.jsx
 * Responsabilité unique : Recueillir l'émargement légal du client via signature tactile/souris sur Canvas,
 * avec saisie obligatoire du nom complet et rôle du signataire (Conformité de livraison B2B/B2G).
 */
export default function SignatureModal({
  isOpen,
  onClose,
  onConfirm,
  clientName,
  processing,
}) {
  const [recipientName, setRecipientName] = useState("");
  const [recipientRole, setRecipientRole] = useState("");
  const [canvasError, setCanvasError] = useState(null);

  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);

  // Initialisation du Canvas Tactile / Souris
  useEffect(() => {
    if (!isOpen) return;
    setRecipientName("");
    setRecipientRole("");
    setHasSigned(false);
    setCanvasError(null);

    // Attendre que le canvas soit injecté dans le DOM pour calibrer sa taille
    const timer = setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      ctx.strokeStyle = "#1e293b"; // Slate 800
      ctx.lineWidth = 3.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // Fond blanc uni pour éviter la transparence lors du rendu PNG
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }, 100);

    return () => clearTimeout(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  // --- LOGIQUE DE DESSIN SUR CANVAS (HTML5) ---
  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();

    // Gérer les coordonnées tactiles (mobiles/tablettes) ou souris (desktop)
    if (e.touches && e.touches[0]) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasSigned(true);
    setCanvasError(null);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasSigned(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!recipientName.trim()) {
      setCanvasError(
        "⚠️ Veuillez saisir le nom complet de la personne qui réceptionne la marchandise.",
      );
      return;
    }

    if (!recipientRole.trim()) {
      setCanvasError(
        "⚠️ Veuillez préciser la fonction de cette personne (ex: Directeur de cantine, Économe, Acheteur).",
      );
      return;
    }

    if (!hasSigned) {
      setCanvasError(
        "⚠️ Veuillez apposer votre signature sur l'écran tactile dans le cadre prévu.",
      );
      return;
    }

    try {
      // Extraction de l'image de signature au format base64
      const canvas = canvasRef.current;
      const signatureDataUrl = canvas.toDataURL("image/png");

      onConfirm({
        recipientName: recipientName.trim(),
        recipientRole: recipientRole.trim(),
        signatureBase64: signatureDataUrl,
        signedAt: new Date(),
      });
    } catch (err) {
      console.error("Erreur de conversion de signature :", err);
      setCanvasError("Erreur technique lors du traitement de l'émargement.");
    }
  };

  return (
    <div className="fixed inset-0 z-55 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop sombre */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl relative z-10 overflow-hidden transform transition-all animate-scale-in border border-gray-100">
        {/* En-tête de modal */}
        <div className="bg-green-700 text-white px-6 py-4.5 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-2">
            <PenTool size={18} className="text-green-200" />
            <h3 className="text-sm font-black uppercase tracking-wider">
              Émargement numérique de livraison
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-green-800 text-white/80 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Formulaire et Zone de dessin */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1">
            <p className="text-[10px] text-gray-400 uppercase font-black tracking-wider">
              Destinataire :
            </p>
            <p className="text-xs font-bold text-gray-800">{clientName}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label
                htmlFor="recipientName"
                className="text-[10px] font-black text-gray-400 uppercase tracking-wider"
              >
                Nom du Réceptionnaire *
              </label>
              <input
                type="text"
                id="recipientName"
                name="recipientName"
                required
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Ex: Jean Martin"
                className="w-full border border-gray-300 rounded-xl p-2.5 text-xs bg-white focus:ring-1 focus:ring-green-500"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="recipientRole"
                className="text-[10px] font-black text-gray-400 uppercase tracking-wider"
              >
                Fonction / Rôle *
              </label>
              <input
                type="text"
                id="recipientRole"
                name="recipientRole"
                required
                value={recipientRole}
                onChange={(e) => setRecipientRole(e.target.value)}
                placeholder="Ex: Cuisinier en Chef, Économe"
                className="w-full border border-gray-300 rounded-xl p-2.5 text-xs bg-white focus:ring-1 focus:ring-green-500"
              />
            </div>
          </div>

          {/* Zone du Canvas de signature */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                Signature électronique tactile *
              </label>
              <button
                type="button"
                onClick={handleClearCanvas}
                className="text-[9px] font-bold text-gray-500 hover:text-red-500 flex items-center gap-1 transition-colors"
              >
                <RotateCcw size={10} /> Effacer le tracé
              </button>
            </div>

            <div className="bg-gray-100 border-2 border-dashed border-gray-200 rounded-2xl overflow-hidden relative">
              <canvas
                ref={canvasRef}
                width={440}
                height={160}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-40 bg-white block cursor-crosshair touch-none"
              />
              {!hasSigned && (
                <div className="absolute inset-0 pointer-events-none flex flex-col justify-center items-center text-gray-300 space-y-1">
                  <PenTool size={20} className="stroke-1 animate-pulse" />
                  <span className="text-[9px] font-black uppercase tracking-wider">
                    Signez à l'aide de votre doigt ou souris
                  </span>
                </div>
              )}
            </div>
          </div>

          {canvasError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-[10px] font-bold text-red-800 flex items-center gap-2">
              <AlertCircle size={14} className="flex-shrink-0" />
              <span>{canvasError}</span>
            </div>
          )}

          {/* Boutons d'action */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={processing}
              className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-600 font-bold py-3 px-4 rounded-xl text-xs transition-colors cursor-pointer bg-white"
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={processing}
              className="flex-1 flex items-center justify-center gap-1.5 bg-green-700 hover:bg-green-800 disabled:bg-gray-300 text-white font-black py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md"
            >
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  <span>Enregistrement...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} />
                  <span>Confirmer la remise</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
