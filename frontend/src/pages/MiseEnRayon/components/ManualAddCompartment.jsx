import React from "react";
import { PlusCircle, AlertCircle, CheckCircle2 } from "lucide-react";
import { useManualAddProduct } from "../hooks/useManualAddProduct.js";

import ProductIdentityFields from "./ProductIdentityFields.jsx";
import PricingSection from "./PricingSection.jsx";
import HaccpTraceabilitySection from "./HaccpTraceabilitySection.jsx";
import EgalimBadgesSelector from "./EgalimBadgesSelector.jsx";

export default function ManualAddCompartment({ onSuccess }) {
  const {
    formData,
    handleChange,
    handleSubmit,
    isSubmitting,
    errorMsg,
    successMsg,
    calculatedPrices
  } = useManualAddProduct(onSuccess);

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 space-y-6 shadow-sm max-w-5xl mx-auto">
      <div className="border-b border-slate-100 pb-4">
        <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
          <PlusCircle size={22} className="text-emerald-700" />
          Nouveau Produit au Catalogue
        </h3>
        <p className="text-xs text-slate-500 font-medium">
          Renseignez les informations produits, le taux de TVA et la traçabilité HACCP pour mise en ligne immédiate.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-bold flex items-center gap-2">
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      <ProductIdentityFields formData={formData} handleChange={handleChange} />
      <PricingSection formData={formData} handleChange={handleChange} calculatedPrices={calculatedPrices} />
      <HaccpTraceabilitySection formData={formData} handleChange={handleChange} />
      <EgalimBadgesSelector formData={formData} handleChange={handleChange} />

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-4 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white font-black rounded-2xl text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md"
      >
        {isSubmitting ? "Enregistrement en cours..." : "Publier le produit sur la marketplace"}
      </button>
    </form>
  );
}