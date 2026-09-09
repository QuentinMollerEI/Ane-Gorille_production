import React, { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { db } from "../../../services/firestore.service";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import {
  ShieldCheck,
  Users,
  Building,
  Store,
  Truck,
  Search,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  UserCheck,
} from "lucide-react";

/**
 * 👑 COMPOSANT : AdminContainer.jsx
 * Responsabilité unique : Administration & Supervision globale du registre utilisateurs,
 * contrôle des inscriptions, vérification du statut Stripe Connect, du certificat Bio (AB) et élévation des rôles.
 */
export default function AdminContainer() {
  const { user } = useAuth();
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  useEffect(() => {
    const usersRef = collection(db, "users");
    const unsubscribe = onSnapshot(
      usersRef,
      (snapshot) => {
        const list = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setUsersList(list);
        setLoading(false);
      },
      (err) => {
        console.error("Erreur de chargement des utilisateurs Admin :", err);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  const handlePromoteToAdmin = async (userId, currentRole) => {
    if (
      !window.confirm(
        "Voulez-vous accorder les privilèges d'Administrateur à cet utilisateur ?",
      )
    )
      return;
    try {
      await updateDoc(doc(db, "users", userId), {
        role: "admin",
        updatedAt: new Date(),
      });
      alert("✅ Rôle mis à jour vers Administrateur avec succès.");
    } catch (err) {
      console.error("Erreur de mise à jour du rôle :", err);
    }
  };

  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      (u.displayName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.companyName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.siret || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === "all" || u.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (roleKey) => {
    switch (roleKey) {
      case "client_public":
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-blue-100 text-blue-800">
            Acheteur Public
          </span>
        );
      case "client_pro":
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-indigo-100 text-indigo-800">
            Acheteur Pro (B2B)
          </span>
        );
      case "producteur":
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
            Fournisseur & Exploitant
          </span>
        );
      case "livreur":
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-800">
            Opérateur Logistique
          </span>
        );
      case "admin":
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-purple-100 text-purple-800">
            Administration
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-gray-100 text-gray-800">
            {roleKey || "acheteur"}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 min-h-[250px]">
        <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-emerald-700"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-150 pb-4">
          <div>
            <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
              <ShieldCheck size={24} className="text-emerald-600" />
              Administration & Supervision du Registre Utilisateurs
            </h2>
            <p className="text-xs text-gray-500 font-semibold mt-0.5">
              Supervisez les comptes inscrits ({usersList.length} membres),
              contrôlez les SIRET et les badges de conformité.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-full">
              {usersList.length} Utilisateurs
            </span>
          </div>
        </div>

        {/* RECHERCHE ET FILTRES */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
          <div className="sm:col-span-8 relative">
            <Search
              size={16}
              className="absolute left-3.5 top-3.5 text-gray-400"
            />
            <input
              type="text"
              placeholder="Rechercher par nom, e-mail, raison sociale, SIRET..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl font-bold text-gray-800"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="sm:col-span-4">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 font-bold text-gray-800 bg-white"
            >
              <option value="all">Tous les rôles ({usersList.length})</option>
              <option value="client_public">
                Acheteurs Publics & Collectivités
              </option>
              <option value="client_pro">Acheteurs Professionnels (B2B)</option>
              <option value="producteur">Fournisseurs & Exploitants</option>
              <option value="livreur">Opérateurs Logistiques</option>
              <option value="admin">Administrateurs</option>
            </select>
          </div>
        </div>
      </div>

      {/* TABLEAU DES INSCRITS */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden text-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-extrabold uppercase text-[10px]">
                <th className="p-4">Établissement / Référent</th>
                <th className="p-4">Rôle Métier</th>
                <th className="p-4">SIRET / Chorus</th>
                <th className="p-4">Statut Stripe / Bio</th>
                <th className="p-4 text-right">Actions Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-gray-50/80 transition-colors"
                  >
                    <td className="p-4">
                      <p className="font-extrabold text-gray-900">
                        {u.companyName || "Non renseigné"}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        {u.displayName || "Sans nom"} • {u.email}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        📞 {u.phone || "-"}
                      </p>
                    </td>

                    <td className="p-4">{getRoleBadge(u.role)}</td>

                    <td className="p-4 font-mono">
                      <p className="font-bold">{u.siret || "Sans SIRET"}</p>
                      {u.codeService && (
                        <p className="text-[10px] text-emerald-700">
                          Code Service: {u.codeService}
                        </p>
                      )}
                    </td>

                    <td className="p-4 space-y-1">
                      {u.role === "producteur" ? (
                        <>
                          <div className="flex items-center gap-1 text-[10px]">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                u.stripeOnboardingStatus === "COMPLETED" ||
                                u.stripeAccountId
                                  ? "bg-emerald-500"
                                  : "bg-amber-500"
                              }`}
                            ></span>
                            <span className="font-bold">
                              Stripe:{" "}
                              {u.stripeAccountId ? "Lié" : "Non configuré"}
                            </span>
                          </div>

                          <div className="text-[10px]">
                            {u.isBioCertified ? (
                              <span className="text-emerald-700 font-bold">
                                🌱 Certifié AB
                              </span>
                            ) : (
                              <span className="text-gray-400">
                                Conventionnel
                              </span>
                            )}
                          </div>
                        </>
                      ) : (
                        <span className="text-gray-400 italic">N/A</span>
                      )}
                    </td>

                    <td className="p-4 text-right">
                      {u.role !== "admin" ? (
                        <button
                          type="button"
                          onClick={() => handlePromoteToAdmin(u.id, u.role)}
                          className="px-3 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded-lg text-[11px] font-bold transition-colors inline-flex items-center gap-1"
                        >
                          <UserCheck size={12} />
                          <span>Promouvoir Admin</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-purple-700 font-bold bg-purple-50 px-2 py-1 rounded-md">
                          Superviseur
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="p-8 text-center text-gray-400 italic"
                  >
                    Aucun utilisateur ne correspond à ces critères.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
