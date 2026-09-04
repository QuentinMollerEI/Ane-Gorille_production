import React, { useState, useEffect } from "react";
import {
  ShoppingCart,
  X,
  Trash2,
  ChevronRight,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";

if (typeof window !== "undefined" && !window.localStorage_cart_patched) {
  window.localStorage_cart_patched = true;

  const originalGetItem = localStorage.getItem;
  const originalSetItem = localStorage.setItem;
  const originalRemoveItem = localStorage.removeItem;

  const getTargetKey = () => {
    const uid = window.current_user_uid;
    return uid ? `ane_et_gorille_cart_${uid}` : "ane_et_gorille_cart_anonymous";
  };

  localStorage.getItem = function (key) {
    if (key === "ane_et_gorille_cart") {
      return originalGetItem.call(localStorage, getTargetKey());
    }
    return originalGetItem.call(localStorage, key);
  };

  localStorage.setItem = function (key, value) {
    if (key === "ane_et_gorille_cart") {
      const res = originalSetItem.call(localStorage, getTargetKey(), value);
      window.dispatchEvent(new Event("cart-updated"));
      return res;
    }
    return originalSetItem.call(localStorage, key, value);
  };

  localStorage.removeItem = function (key) {
    if (key === "ane_et_gorille_cart") {
      const res = originalRemoveItem.call(localStorage, getTargetKey());
      window.dispatchEvent(new Event("cart-updated"));
      return res;
    }
    return originalRemoveItem.call(localStorage, key);
  };
}

/**
 * CartFloatingWidget - Aperçu Rapide du Panier
 * Tiroir latéral fluide permettant de consulter les articles ajoutés,
 * d'ajuster les quantités ou de retirer des produits de proximité,
 * avec un lien unique et propre menant au grand panier pour la validation sécurisée.
 */
export default function CartFloatingWidget({ onOpenFullCart }) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [isPulsing, setIsPulsing] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.current_user_uid = user?.uid || null;
      window.dispatchEvent(new Event("cart-updated"));
    }
  }, [user]);

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

  useEffect(() => {
    loadCart();

    const handleCartUpdate = () => {
      loadCart();
      setIsPulsing(true);
      const timer = setTimeout(() => setIsPulsing(false), 1000);
      return () => clearTimeout(timer);
    };

    window.addEventListener("cart-updated", handleCartUpdate);
    window.addEventListener("storage", loadCart);

    return () => {
      window.removeEventListener("cart-updated", handleCartUpdate);
      window.removeEventListener("storage", loadCart);
    };
  }, [user]);

  if (!user) {
    return null;
  }

  const totalItemsCount = cartItems.reduce((acc, item) => {
    const itemQty = parseInt(item.qty || item.quantityWanted || 0, 10);
    return acc + itemQty;
  }, 0);

  const totals = cartItems.reduce(
    (acc, item) => {
      const qty = Number(item.qty || item.quantityWanted || 1);
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

  const itemsByProducer = cartItems.reduce((acc, item) => {
    const producerName = item.producerName || "Producteur local";
    if (!acc[producerName]) {
      acc[producerName] = [];
    }
    acc[producerName].push({
      productId: item.productId || item.id,
      title: item.title || item.name || "Produit local",
      priceHT: parseFloat(item.priceHT || 0),
      vatRate: parseFloat(item.vatRate || 5.5),
      qty: parseInt(item.qty || item.quantityWanted || 1, 10),
      unit: item.unit || "kg",
      image: item.image || "",
    });
    return acc;
  }, {});

  const handleUpdateQty = (productId, newQty) => {
    const qty = parseInt(newQty, 10);
    if (isNaN(qty) || qty < 1) return;

    const updatedCart = cartItems.map((item) => {
      const id = item.productId || item.id;
      if (id === productId) {
        return {
          ...item,
          qty,
          quantityWanted: qty,
        };
      }
      return item;
    });
    localStorage.setItem("ane_et_gorille_cart", JSON.stringify(updatedCart));
  };

  const handleRemoveItem = (productId) => {
    const updatedCart = cartItems.filter((item) => {
      const id = item.productId || item.id;
      return id !== productId;
    });
    localStorage.setItem("ane_et_gorille_cart", JSON.stringify(updatedCart));
  };

  return (
    <>
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

      {isOpen && (
        <div className="fixed inset-0 z-55 overflow-hidden transition-all duration-300">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setIsOpen(false)}
          />

          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col h-full transform transition-all duration-300 animate-slide-in">
              <div className="px-6 py-5 bg-green-700 text-white flex items-center justify-between shadow-md">
                <div className="flex items-center gap-2.5">
                  <ShoppingBag className="w-5 h-5 text-green-200" />
                  <h2 className="text-lg font-extrabold tracking-wide">
                    Aperçu du Panier
                  </h2>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-green-800 text-white/80 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-green-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

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
                    {Object.entries(itemsByProducer).map(
                      ([producerName, items]) => (
                        <div
                          key={producerName}
                          className="border border-gray-150 rounded-2xl overflow-hidden bg-gray-50/50"
                        >
                          <div className="bg-gray-100 px-4 py-2.5 border-b border-gray-150 flex items-center gap-1.5">
                            <span className="text-xs">🧑‍🌾</span>
                            <span className="text-[10px] font-black uppercase text-gray-600 tracking-wider">
                              {producerName}
                            </span>
                          </div>

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

                                  <div className="flex items-center gap-1 bg-gray-50 border rounded-lg p-1">
                                    <input
                                      type="number"
                                      id={`qty-widget-${item.productId}`}
                                      name={`qty-widget-${item.productId}`}
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

                                  <div className="text-right min-w-[70px]">
                                    <span className="text-xs font-black text-green-700">
                                      {itemTTC.toFixed(2)} €
                                    </span>
                                  </div>

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

              {cartItems.length > 0 && (
                <div className="border-t border-gray-150 p-6 bg-gray-50 space-y-4">
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

                  <div className="flex items-center gap-1.5 p-2 bg-green-50 border border-green-150 rounded-xl text-[9px] text-green-800 font-medium leading-relaxed">
                    <ShieldCheck className="text-green-700 w-4 h-4 flex-shrink-0" />
                    <span>
                      Aperçu de commande de proximité. Récapitulatif comptable
                      généré au panier.
                    </span>
                  </div>

                  <div className="pt-1">
                    {onOpenFullCart ? (
                      <button
                        onClick={() => {
                          onOpenFullCart();
                          setIsOpen(false);
                        }}
                        className="w-full flex items-center justify-center gap-2 bg-green-700 hover:bg-green-800 text-white font-black py-4 px-4 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md hover:shadow-lg text-center cursor-pointer"
                      >
                        <span>Voir & modifier mon panier</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <a
                        href="/cart"
                        className="w-full flex items-center justify-center gap-2 bg-green-700 hover:bg-green-800 text-white font-black py-4 px-4 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md hover:shadow-lg text-center"
                      >
                        <span>Voir & modifier mon panier</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
