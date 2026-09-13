import React from "react";
import { ShoppingCart, Trash2, ArrowLeft, Package, Minus, Plus } from "lucide-react";
import CheckoutView from "../../../components/Checkout/CheckoutView";

export default function CartContainer({ cart = [], onUpdateQuantity, onRemoveItem, onClearCart, onBackToShop }) {
  const totalHT = cart.reduce((sum, item) => sum + (Number(item.priceHT ?? item.price ?? 0) * item.quantity), 0);

  if (cart.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-3xl p-12 text-center space-y-4">
        <Package size={48} className="mx-auto text-gray-300" />
        <h3 className="text-lg font-bold text-gray-800">Votre panier est actuellement vide</h3>
        <button onClick={onBackToShop} className="px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-black rounded-2xl text-xs uppercase tracking-wider transition-colors cursor-pointer">
          Découvrir les produits
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-xs animate-fade-in">
      <div className="lg:col-span-7 bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-gray-150 pb-3">
          <h3 className="font-extrabold text-gray-900 text-sm">Produits Sélectionnés ({cart.length})</h3>
          <button onClick={onClearCart} className="text-red-600 hover:text-red-800 font-bold text-[11px] flex items-center gap-1 cursor-pointer">
            <Trash2 size={13} /><span>Vider le panier</span>
          </button>
        </div>
        
        <div className="divide-y divide-gray-100 space-y-3">
          {cart.map((item) => {
            const itemTotalHT = Number(item.priceHT ?? item.price ?? 0) * item.quantity;
            return (
              <div key={item.id} className="pt-3 flex items-center justify-between gap-4">
                <div className="space-y-1 flex-1">
                  <h4 className="font-black text-gray-900 text-xs">{item.title || item.name}</h4>
                  <p className="text-gray-500 text-[11px]">Ferme: <span className="font-bold text-gray-700">{item.producerCompany || "Exploitation Locale"}</span></p>
                  <p className="text-emerald-800 font-bold text-[11px]">{Number(item.priceHT ?? item.price ?? 0).toFixed(2)} € HT / {item.unit || "kg"}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden bg-gray-50">
                    <button onClick={() => onUpdateQuantity(item.id, item.quantity - 1)} className="px-2.5 py-1 text-gray-600 hover:bg-gray-200 font-black cursor-pointer"><Minus size={14}/></button>
                    <span className="px-3 py-1 font-extrabold text-gray-900 text-xs">{item.quantity}</span>
                    <button onClick={() => onUpdateQuantity(item.id, item.quantity + 1)} className="px-2.5 py-1 text-gray-600 hover:bg-gray-200 font-black cursor-pointer"><Plus size={14}/></button>
                  </div>
                  <div className="text-right min-w-[70px]">
                    <p className="font-black text-gray-900 text-xs">{itemTotalHT.toFixed(2)} €</p>
                  </div>
                  <button onClick={() => onRemoveItem(item.id)} className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg transition-colors cursor-pointer">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-4 border-t border-gray-200 flex justify-between items-center text-sm">
          <span className="font-black text-gray-900">Total Sous-Commandes (HT)</span>
          <span className="font-black text-emerald-800 text-lg">{totalHT.toFixed(2)} €</span>
        </div>
      </div>

      <div className="lg:col-span-5 space-y-5">
        <CheckoutView cartItems={cart} clearCart={onClearCart} onCheckoutSuccess={onBackToShop} />
      </div>
    </div>
  );
}