import React, { useState, useEffect } from "react";
import {
  ShoppingCart,
  X,
  Trash2,
  ChevronRight,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  HelpCircle,
} from "lucide-react";

/**
 * CartFloatingWidget - Bouton Panier Flottant Moderne et Pratique avec Sidebar Coulissante
 * Intègre un badge dynamique, une animation de "pulse" à l'ajout,
 * et un panneau latéral interactif de résumé avant passage à la caisse.
 */
export default function CartFloatingWidget({ onOpenFullCart }) {
  const [isOpen, setIsOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [isPulsing, setIsPulsing] = useState(false);

  // Charger le panier depuis LocalStorage
  const loadCart = () => {
    try {
      const storedCart = JSON.parse(
        localStorage.getItem("ane_et_gorille_cart") || "[]",
      );
      setCartItems(storedCart);
    } catch (err) {
      console.error("Erreur de lecture du panier local :", err);
    }
  };

  // Écoute des changements de panier
  useEffect(() => {
    loadCart();

    // Handler pour l'événement personnalisé d'ajout au panier
    const handleCartUpdate = () => {
      loadCart();
      setIsPulsing(true);
      // Désactiver l'animation pulse après 1s
      const timer = setTimeout(() => setIsPulsing(false), 1000);
      return () => clearTimeout(timer);
    };

    // Écoute globale sur la fenêtre (pour capter les ajouts depuis d'autres fenêtres/fiches produits)
    window.addEventListener("cart-updated", handleCartUpdate);
    window.addEventListener("storage", loadCart); // Sync entre onglets si besoin

    // Monkey-patch de localStorage.setItem pour s'assurer que notre propre onglet intercepte les modifs
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function (key, value) {
      originalSetItem.apply(this, arguments);
      if (key === "ane_et_gorille_cart") {
        window.dispatchEvent(new Event("cart-updated"));
      }
    };

    return () => {
      window.removeEventListener("cart-updated", handleCartUpdate);
      window.removeEventListener("storage", loadCart);
      localStorage.setItem = originalSetItem;
    };
  }, []);

  // Calcul du nombre total d'articles et du montant total
  const totalItemsCount = cartItems.reduce(
    (acc, item) => acc + (item.qty || 0),
    0,
  );

  const totals = cartItems.reduce(
    (acc, item) => {
      const qty = Number(item.qty || 1);
      const priceHT = Number(item.priceHT || 0);
      const vatRate = Number(item.vatRate || 5.5);

      const itemHT = priceHT * qty;
      const itemVAT = itemHT * (vatRate / 100);
      const itemTTC = itemHT + itemVAT;

      acc.totalHT += itemHT;
      acc.totalTVA += itemVAT;
      acc.totalTTC += itemTTC;
      return acc;
    },
    { totalHT: 0, totalTVA: 0, totalTTC: 0 },
  );

  // Regroupement par producteur pour affichage structuré (comme le panier officiel)
  const itemsByProducer = cartItems.reduce((acc, item) => {
    const producerName = item.producerName || "Producteur local";
    if (!acc[producerName]) {
      acc[producerName] = [];
    }
    acc[producerName].push(item);
    return acc;
  }, {});

  // Mettre à jour la quantité directement depuis le widget
  const handleUpdateQty = (productId, newQty) => {
    const qty = parseInt(newQty, 10);
    if (isNaN(qty) || qty < 1) return;

    const updatedCart = cartItems.map((item) => {
      if (item.productId === productId) {
        return { ...item, qty };
      }
      return item;
    });
    localStorage.setItem("ane_et_gorille_cart", JSON.stringify(updatedCart));
  };

  // Supprimer un article depuis le widget
  const handleRemoveItem = (productId) => {
    const updatedCart = cartItems.filter(
      (item) => item.productId !== productId,
    );
    localStorage.setItem("ane_et_gorille_cart", JSON.stringify(updatedCart));
  };

  return (
    <>
      {/* 1. BOUTON FLOTTANT SUSPENDU (Floating Action Button) */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 flex items-center justify-center bg-green-700 hover:bg-green-800 text-white rounded-full p-4 shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 focus:outline-none focus:ring-4 focus:ring-green-300 ${
          isPulsing ? "animate-bounce ring-4 ring-green-400 scale-110" : ""
        }`}
        title="Ouvrir le panier"
        aria-label="Voir mon panier de proximité"
      >
        <div className="relative">
          <ShoppingCart className="w-7 h-7" />
          {totalItemsCount > 0 && (
            <span className="absolute -top-3 -right-3 bg-red-500 text-white text-xs font-black rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center border-2 border-green-700 animate-scale-in">
              {totalItemsCount}
            </span>
          )}
        </div>
      </button>

      {/* 2. SIDEBAR COULISSANTE (DRAWER / SLIDE-OVER) */}
      {isOpen && (
        <div className="fixed inset-0 z-55 overflow-hidden transition-all duration-300">
          {/* Arrière-plan sombre translucide avec effet flou */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setIsOpen(false)}
          />

          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            {/* Conteneur principal de la sidebar */}
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col h-full transform transition-all duration-300 animate-slide-in">
              {/* En-tête de la Sidebar */}
              <div className="px-6 py-5 bg-green-700 text-white flex items-center justify-between shadow-md">
                <div className="flex items-center gap-2.5">
                  <ShoppingBag className="w-5 h-5 text-green-200" />
                  <h2 className="text-lg font-extrabold tracking-wide">
                    Mon Panier Local
                  </h2>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-green-800 text-white/80 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-green-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Corps de la Sidebar (Scrollable) */}
              <div className="flex-1 overflow-y-auto py-6 px-4 sm:px-6 space-y-6">
                {cartItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12 space-y-4">
                    <div className="w-16 h-16 bg-gray-50 border border-gray-100 text-gray-300 rounded-full flex items-center justify-center">
                      <ShoppingCart className="w-8 h-8 stroke-1" />
                    </div>
                    <div>
                      <p className="text-gray-500 font-extrabold text-sm">
                        Votre panier est encore vide
                      </p>
                      <p className="text-xs text-gray-400 max-w-[240px] mx-auto mt-1">
                        Explorez nos étals pour commander de frais produits à
                        nos maraîchers de proximité !
                      </p>
                    </div>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="bg-green-100 hover:bg-green-200 text-green-800 text-xs font-bold py-2 px-5 rounded-xl transition-colors"
                    >
                      Retourner aux achats
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Liste des produits groupés par Producteur */}
                    {Object.entries(itemsByProducer).map(
                      ([producerName, items]) => (
                        <div
                          key={producerName}
                          className="border border-gray-150 rounded-2xl overflow-hidden bg-gray-50/50"
                        >
                          {/* En-tête Maraîcher */}
                          <div className="bg-gray-100 px-4 py-2.5 border-b border-gray-150 flex items-center gap-1.5">
                            <span className="text-xs">🧑‍🌾</span>
                            <span className="text-[10px] font-black uppercase text-gray-600 tracking-wider">
                              {producerName}
                            </span>
                          </div>

                          {/* Articles */}
                          <div className="divide-y divide-gray-150 bg-white">
                            {items.map((item) => {
                              const itemTTC =
                                item.priceHT *
                                item.qty *
                                (1 + (item.vatRate || 5.5) / 100);
                              return (
                                <div
                                  key={item.productId}
                                  className="p-4 flex items-center justify-between gap-3"
                                >
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-gray-800 text-xs truncate leading-snug">
                                      {item.title}
                                    </h4>
                                    <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
                                      {Number(item.priceHT).toFixed(2)} € HT /{" "}
                                      {item.unit || "kg"}
                                    </p>
                                  </div>

                                  {/* Gestion quantité */}
                                  <div className="flex items-center gap-1 bg-gray-50 border rounded-lg p-1">
                                    <input
                                      type="number"
                                      min="1"
                                      value={item.qty}
                                      onChange={(e) =>
                                        handleUpdateQty(
                                          item.productId,
                                          e.target.value,
                                        )
                                      }
                                      className="w-10 text-center bg-transparent text-xs font-black focus:outline-none font-mono"
                                    />
                                  </div>

                                  {/* Prix total TTC de la ligne */}
                                  <div className="text-right min-w-[70px]">
                                    <span className="text-xs font-black text-green-700">
                                      {itemTTC.toFixed(2)} €
                                    </span>
                                  </div>

                                  {/* Suppression */}
                                  <button
                                    onClick={() =>
                                      handleRemoveItem(item.productId)
                                    }
                                    className="text-gray-300 hover:text-red-500 p-1 rounded-lg transition-colors"
                                    title="Supprimer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                )}
              </div>

              {/* Pied de la Sidebar (Si panier non vide) */}
              {cartItems.length > 0 && (
                <div className="border-t border-gray-150 p-6 bg-gray-50 space-y-4">
                  {/* Totaux financiers */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-gray-500 font-semibold">
                      <span>Total HT :</span>
                      <span>{totals.totalHT.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 font-semibold">
                      <span>TVA cumulée :</span>
                      <span>{totals.totalTVA.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between text-gray-800 font-black border-t border-dashed pt-3 text-sm">
                      <span>Total TTC :</span>
                      <span className="text-green-700 text-base">
                        {totals.totalTTC.toFixed(2)} €
                      </span>
                    </div>
                  </div>

                  {/* Sécurité */}
                  <div className="flex items-center gap-1.5 p-2 bg-green-50 border border-green-150 rounded-xl text-[9px] text-green-800 font-medium leading-relaxed">
                    <ShieldCheck className="text-green-700 w-4 h-4 flex-shrink-0" />
                    <span>
                      Transactions sécurisées via Stripe Connect. Transfert
                      direct garanti.
                    </span>
                  </div>

                  {/* Boutons d'Action */}
                  <div className="grid grid-cols-1 gap-2 pt-1">
                    {/* Aller au Panier Complet */}
                    {onOpenFullCart ? (
                      <button
                        onClick={() => {
                          onOpenFullCart();
                          setIsOpen(false);
                        }}
                        className="w-full flex items-center justify-center gap-1.5 border border-gray-300 hover:bg-gray-100 text-gray-700 font-bold py-3 px-4 rounded-xl text-xs transition-all"
                      >
                        Voir & Modifier en grand
                      </button>
                    ) : (
                      <a
                        href="/cart"
                        className="w-full flex items-center justify-center gap-1.5 border border-gray-300 hover:bg-gray-100 text-gray-700 font-bold py-3 px-4 rounded-xl text-xs text-center transition-all"
                      >
                        Voir & Modifier en grand
                      </a>
                    )}

                    {/* Passer à la caisse (Checkout) */}
                    <a
                      href="/checkout"
                      className="w-full flex items-center justify-center gap-2 bg-green-700 hover:bg-green-800 text-white font-black py-3.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md hover:shadow-lg text-center"
                    >
                      <span>Passer au paiement</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Ajout des styles CSS d'animation nécessaires directement */}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes scaleIn {
          from { transform: scale(0); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-slide-in {
          animation: slideIn 0.3s ease-out forwards;
        }
        .animate-scale-in {
          animation: scaleIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .backdrop-blur-xs {
          backdrop-filter: blur(2px);
        }
      `}</style>
    </>
  );
}
