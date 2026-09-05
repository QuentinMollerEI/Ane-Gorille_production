import React from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  User,
  Award,
  Truck,
  ShoppingBag,
} from "lucide-react";

export default function ProfileHeader({ userProfile, validationStatus }) {
  const getRoleBadge = (role, buyerProfile) => {
    switch (role) {
      case "producer":
        return {
          label: "Maraîcher / Producteur",
          icon: <Award className="text-amber-700" size={14} />,
          bg: "bg-amber-50 border-amber-200 text-amber-800",
        };
      case "buyer":
        return {
          label:
            buyerProfile === "B2G" ? "Acheteur Public" : "Acheteur Privé B2B",
          icon: <ShoppingBag className="text-green-700" size={14} />,
          bg: "bg-green-50 border-green-200 text-green-800",
        };
      case "driver":
        return {
          label: "Logistique / Livreur",
          icon: <Truck className="text-sky-700" size={14} />,
          bg: "bg-blue-50 border-blue-200 text-blue-800",
        };
      case "admin":
        return {
          label: "Administrateur",
          icon: <ShieldCheck className="text-purple-700" size={14} />,
          bg: "bg-purple-50 border-purple-200 text-purple-800",
        };
      default:
        return {
          label: "Utilisateur",
          icon: <User className="text-gray-700" size={14} />,
          bg: "bg-gray-50 border-gray-200 text-gray-800",
        };
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "VALIDE":
        return {
          label: "Compte Validé & Actif",
          icon: <ShieldCheck className="text-green-700" size={16} />,
          bg: "bg-green-100 border-green-300 text-green-900",
          desc: "Votre dossier réglementaire est conforme. Toutes les fonctionnalités de la plateforme (commande, encaissement, logistique) sont déverrouillées.",
        };
      case "EN_ATTENTE_VALIDATION":
        return {
          label: "Inscription en cours de validation",
          icon: <Clock className="text-amber-700 animate-pulse" size={16} />,
          bg: "bg-amber-100 border-amber-300 text-amber-900",
          desc: "Notre service de conformité vérifie vos pièces légales (SIRET, agréments). Vous serez notifié par e-mail sous 24h.",
        };
      default:
        return {
          label: "Dossier Incomplet",
          icon: <ShieldAlert className="text-red-700" size={16} />,
          bg: "bg-red-100 border-red-300 text-red-900",
          desc: "Veuillez renseigner tous les champs obligatoires marqués d'une étoile pour soumettre votre dossier à la validation réglementaire.",
        };
    }
  };

  const rawRole = userProfile?.role || "buyer";
  const role =
    rawRole === "acheteur"
      ? "buyer"
      : rawRole === "producteur"
        ? "producer"
        : rawRole === "livreur"
          ? "driver"
          : rawRole;
  const roleBadge = getRoleBadge(role, userProfile?.buyerProfile);
  const statusBadge = getStatusBadge(validationStatus);

  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-black text-gray-955">
              {userProfile?.companyName ||
                userProfile?.displayName ||
                "Mon Espace"}
            </h1>
            <span
              className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${roleBadge.bg}`}
            >
              {roleBadge.icon}
              {roleBadge.label}
            </span>
          </div>
          <p className="text-[10px] text-gray-400 font-bold">
            ID unique de session :{" "}
            <span className="font-mono text-gray-700">
              {userProfile?.uid || "N/A"}
            </span>
          </p>
        </div>

        <div
          className={`px-4 py-2.5 rounded-2xl border flex items-center gap-2 text-xs font-black ${statusBadge.bg} self-start sm:self-auto`}
        >
          {statusBadge.icon}
          <span>{statusBadge.label}</span>
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-150 rounded-2xl p-4 text-xs font-semibold text-gray-600 leading-relaxed">
        {statusBadge.desc}
      </div>
    </div>
  );
}
