import React, { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { db } from "../../../services/firestore.service";
import { collection, onSnapshot, doc, updateDoc } from "firebase/firestore";
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  XCircle,
  UserCheck,
  Clock,
  Package,
} from "lucide-react";

/**
 * 👑 COMPOSANT : AdminContainer.jsx
 * Emplacement : src/pages/MonProfil/Admin/AdminContainer.jsx
 *
 * Centre de Modération et Validation des Inscriptions (PENDING -> APPROVED / REJECTED)
 * et supervision du catalogue.
 */
export default function AdminContainer() {
  const { user } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState("accounts"); // 'accounts' | 'catalog'
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("PENDING");

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

  const handleApproveUser = async (userId, userEmail) => {
    if (!window.confirm(`Voulez-vous approuver le compte de ${userEmail} ?`))
      return;
    try {
      await updateDoc(doc(db, "users", userId), {
        accountStatus: "APPROVED",
        isApproved: true,
        approvedAt: new Date(),
        approvedBy: user?.email || "Admin",
        updatedAt: new Date(),
      });
      alert(`✅ Le compte ${userEmail} a été approuvé avec succès !`);
    } catch (err) {
      console.error("Erreur lors de l'approbation :", err);
      alert("Erreur lors de l'approbation du compte.");
    }
  };

  const handleRejectUser = async (userId, userEmail) => {
    if (
      !window.confirm(
        `Voulez-vous refuser / suspendre le compte de ${userEmail} ?`,
      )
    )
      return;
    try {
      await updateDoc(doc(db, "users", userId), {
        accountStatus: "REJECTED",
        isApproved: false,
        updatedAt: new Date(),
      });
      alert(`❌ Le compte ${userEmail} a été passé en statut Refusé.`);
    } catch (err) {
      console.error("Erreur lors du refus :", err);
    }
  };

  const pendingCount = usersList.filter(
    (u) =>
      u.accountStatus === "PENDING" ||
      (!u.accountStatus && u.isApproved === false),
  ).length;
  const approvedCount = usersList.filter(
    (u) => u.accountStatus === "APPROVED" || u.isApproved === true,
  ).length;
  const rejectedCount = usersList.filter(
    (u) => u.accountStatus === "REJECTED",
  ).length;

  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      (u.displayName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.companyName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.siret || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    const userStatus =
      u.accountStatus || (u.isApproved ? "APPROVED" : "PENDING");
    const matchesStatus = statusFilter === "all" || userStatus === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 min-h-[250px]">
        <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-emerald-700"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto pb-12">
      {/* HEADER CENTRE DE MODÉRATION */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-150 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-100 text-emerald-800 rounded-2xl">
              <ShieldCheck size={26} />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900">
                Centre de Modération & Supervision
              </h2>
              <p className="text-xs text-gray-500 font-semibold">
                Approbations des comptes professionnels et modération du
                catalogue
              </p>
            </div>
          </div>
          <span className="bg-emerald-100 text-emerald-900 text-xs font-black px-3.5 py-1.5 rounded-full uppercase tracking-wider">
            Espace Administrateur
          </span>
        </div>

        {/* SOUS-ONGLETS */}
        <div className="flex border-b border-gray-200 space-x-6 text-xs font-black uppercase tracking-wider">
          <button
            onClick={() => setActiveSubTab("accounts")}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              activeSubTab === "accounts"
                ? "border-emerald-700 text-emerald-800 font-extrabold"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            <UserCheck size={16} />
            <span>1. Modération Inscriptions & Comptes ({pendingCount})</span>
          </button>

          <button
            onClick={() => setActiveSubTab("catalog")}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              activeSubTab === "catalog"
                ? "border-emerald-700 text-emerald-800 font-extrabold"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            <Package size={16} />
            <span>2. Modération Catalogue & Offres</span>
          </button>
        </div>

        {activeSubTab === "accounts" && (
          <div className="space-y-4 pt-2">
            <div className="flex flex-wrap gap-2 text-xs font-extrabold">
              <button
                type="button"
                onClick={() => setStatusFilter("PENDING")}
                className={`px-4 py-2.5 rounded-xl border flex items-center gap-2 transition-all cursor-pointer ${
                  statusFilter === "PENDING"
                    ? "bg-amber-500 text-white border-amber-600 shadow-sm"
                    : "bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100"
                }`}
              >
                <Clock size={15} />
                <span>Demandes en Attente ({pendingCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter("APPROVED")}
                className={`px-4 py-2.5 rounded-xl border flex items-center gap-2 transition-all cursor-pointer ${
                  statusFilter === "APPROVED"
                    ? "bg-emerald-700 text-white border-emerald-800 shadow-sm"
                    : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                }`}
              >
                <CheckCircle2 size={15} />
                <span>Comptes Approuvés ({approvedCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter("REJECTED")}
                className={`px-4 py-2.5 rounded-xl border flex items-center gap-2 transition-all cursor-pointer ${
                  statusFilter === "REJECTED"
                    ? "bg-red-600 text-white border-red-700 shadow-sm"
                    : "bg-red-50 text-red-800 border-red-200 hover:bg-red-100"
                }`}
              >
                <XCircle size={15} />
                <span>Comptes Refusés ({rejectedCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={`px-4 py-2.5 rounded-xl border transition-all cursor-pointer ${
                  statusFilter === "all"
                    ? "bg-gray-800 text-white border-gray-900"
                    : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                }`}
              >
                Tous ({usersList.length})
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
              <div className="sm:col-span-8 relative">
                <Search
                  size={16}
                  className="absolute left-3.5 top-3.5 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Rechercher par e-mail, raison sociale, référent, SIRET..."
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
                  <option value="all">Tous les rôles</option>
                  <option value="client_public">Acheteurs Publics (B2G)</option>
                  <option value="client_pro">Acheteurs Privés (B2B)</option>
                  <option value="producteur">
                    Fournisseurs / Exploitations
                  </option>
                  <option value="admin">Administrateurs</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {activeSubTab === "catalog" && (
          <div className="p-8 bg-gray-50 rounded-2xl border border-gray-200 text-center space-y-3 text-xs">
            <Package size={32} className="mx-auto text-emerald-700" />
            <h3 className="font-extrabold text-gray-800 text-sm">
              Supervision des Offres & Certifications AB
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Contrôle des fiches produits publiées par les producteurs locaux,
              vérification des prix HT et validation des certificats Ecocert.
            </p>
          </div>
        )}
      </div>

      {activeSubTab === "accounts" && (
        <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden text-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-extrabold uppercase text-[10px]">
                  <th className="p-4">Utilisateur / E-mail</th>
                  <th className="p-4">Rôle Demandé</th>
                  <th className="p-4">Statut Compte</th>
                  <th className="p-4">Raison Sociale / SIRET</th>
                  <th className="p-4 text-right">Actions de Modération</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((u) => {
                    const status =
                      u.accountStatus ||
                      (u.isApproved ? "APPROVED" : "PENDING");
                    const isPending = status === "PENDING";
                    const isApproved = status === "APPROVED";
                    const isRejected = status === "REJECTED";

                    return (
                      <tr
                        key={u.id}
                        className="hover:bg-gray-50/80 transition-colors"
                      >
                        <td className="p-4">
                          <p className="font-extrabold text-gray-900">
                            {u.email}
                          </p>
                          <p className="text-[11px] text-gray-500">
                            {u.displayName || "Référent non renseigné"}
                          </p>
                        </td>

                        <td className="p-4">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                              u.role === "client_public"
                                ? "bg-blue-100 text-blue-800"
                                : u.role === "producteur"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : u.role === "admin"
                                    ? "bg-purple-100 text-purple-800"
                                    : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {u.role === "client_public"
                              ? "Acheteur Public"
                              : u.role === "client_pro"
                                ? "Acheteur Pro"
                                : u.role === "producteur"
                                  ? "Fournisseur"
                                  : u.role}
                          </span>
                        </td>

                        <td className="p-4">
                          {isPending && (
                            <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 px-2.5 py-1 rounded-full font-black text-[10px] uppercase">
                              <Clock size={12} />
                              En Attente
                            </span>
                          )}
                          {isApproved && (
                            <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full font-black text-[10px] uppercase">
                              <CheckCircle2 size={12} />
                              Approuvé
                            </span>
                          )}
                          {isRejected && (
                            <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 px-2.5 py-1 rounded-full font-black text-[10px] uppercase">
                              <XCircle size={12} />
                              Refusé
                            </span>
                          )}
                        </td>

                        <td className="p-4 font-mono text-[11px]">
                          <p className="font-bold text-gray-900">
                            {u.companyName || "Non renseignée"}
                          </p>
                          <p className="text-gray-400">
                            {u.siret
                              ? `SIRET: ${u.siret}`
                              : "SIRET non renseigné"}
                          </p>
                        </td>

                        <td className="p-4 text-right space-x-2">
                          {isPending && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleApproveUser(u.id, u.email)}
                                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black rounded-xl text-[11px] uppercase transition-all shadow-sm cursor-pointer inline-flex items-center gap-1"
                              >
                                <CheckCircle2 size={13} />
                                <span>Approuver</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleRejectUser(u.id, u.email)}
                                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold rounded-xl text-[11px] transition-colors cursor-pointer inline-flex items-center gap-1"
                              >
                                <XCircle size={13} />
                                <span>Refuser</span>
                              </button>
                            </>
                          )}

                          {isApproved && u.role !== "admin" && (
                            <button
                              type="button"
                              onClick={() => handleRejectUser(u.id, u.email)}
                              className="px-2.5 py-1 bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-700 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                            >
                              Suspendre
                            </button>
                          )}

                          {isRejected && (
                            <button
                              type="button"
                              onClick={() => handleApproveUser(u.id, u.email)}
                              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold rounded-xl text-[11px] transition-colors cursor-pointer inline-flex items-center gap-1"
                            >
                              <CheckCircle2 size={13} />
                              <span>Ré-approuver</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-8 text-center text-gray-400 italic"
                    >
                      Aucun utilisateur trouvé pour ces critères.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
