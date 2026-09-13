import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Store, Package, ClipboardList, Map, ListOrdered, FileText, User } from "lucide-react";

export default function Sidebar() {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const currentModule = params.get("module") || "default";

  const role = userProfile?.role || user?.role || "acheteur_prive";

  const handleNav = (module) => {
    navigate(`/dashboard?module=${module}`);
  };

  const getDefaultModule = (r) => {
    if (r === "producteur" || r === "producer") return "rayon";
    if (r === "livreur" || r === "carrier") return "route";
    return "boutique";
  };

  const NavItem = ({ module, icon: Icon, label }) => {
    const isActive = currentModule === module || (currentModule === "default" && module === getDefaultModule(role));
    return (
      <button
        onClick={() => handleNav(module)}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all ${
          isActive ? "bg-emerald-700 text-white shadow-md" : "text-gray-600 hover:bg-emerald-50 hover:text-emerald-800"
        }`}
      >
        <Icon size={20} />
        <span>{label}</span>
      </button>
    );
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen p-4 flex flex-col gap-2 sticky top-0">
      <h2 className="text-xl font-black text-gray-900 px-4 mb-6">Plateforme Hub</h2>
      
      {(role.includes("acheteur") || role.includes("client") || role === "admin") && (
        <NavItem module="boutique" icon={Store} label="Boutique & Panier" />
      )}

      {(role === "producteur" || role === "producer" || role === "admin") && (
        <>
          <NavItem module="rayon" icon={Package} label="Mise en Rayon" />
          <NavItem module="prep" icon={ClipboardList} label="Préparations" />
        </>
      )}

      {(role === "livreur" || role === "carrier" || role === "admin") && (
        <NavItem module="route" icon={Map} label="Feuille de Route" />
      )}

      {(role.includes("acheteur") || role.includes("client") || role === "admin") && (
        <NavItem module="suivi" icon={ListOrdered} label="Suivi Commandes" />
      )}
      
      {role !== "livreur" && role !== "carrier" && (
        <NavItem module="compta" icon={FileText} label="Comptabilité" />
      )}

      <div className="mt-auto border-t border-gray-100 pt-4">
        <NavItem module="profil" icon={User} label="Mon Profil" />
      </div>
    </aside>
  );
}