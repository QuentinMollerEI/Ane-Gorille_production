import React from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import GeneralInfoForm from "./components/GeneralInfoForm.jsx";
import StripeConnectCard from "./components/StripeConnectCard.jsx";
import { UserCheck, ShieldCheck } from "lucide-react";

export default function MonProfilContainer() {
  const { userProfile, user } = useAuth();
  const profile = userProfile || user || {};
  const role = profile.role || "acheteur_prive";

  const isSupplier = role === "producteur" || role === "producer" || role === "artisan";

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6 animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <UserCheck size={20} />
            </span>
            <h2 className="text-xl font-black text-slate-900">
              {profile.companyName || profile.displayName || "Mon Profil Pro"}
            </h2>
          </div>
          <p className="text-xs text-slate-500 font-semibold">
            {profile.email} | SIRET : {profile.siret || "Non renseigné"}
          </p>
        </div>

        <div className="px-3.5 py-1.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-black text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
          <ShieldCheck size={16} className="text-emerald-700" />
          <span>
            Rôle : {role === "producteur" ? "Producteur Maraîcher" : role === "artisan" ? "Artisan Créateur" : role === "acheteur_public" ? "Acheteur Public" : "Acheteur Privé"}
          </span>
        </div>
      </div>

      {isSupplier && <StripeConnectCard profileData={profile} />}

      <GeneralInfoForm />
    </div>
  );
}