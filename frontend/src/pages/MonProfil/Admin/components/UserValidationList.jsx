import React, { useState, useEffect } from "react";
import { db } from "../../../../services/firestore.service.js";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";
import {
  ShieldCheck,
  ShieldAlert,
  Award,
  Truck,
  ShoppingBag,
  Landmark,
  Mail,
  Phone,
  FileText,
  User,
} from "lucide-react";

export default function UserValidationList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const loadPendingUsers = async () => {
    try {
      setLoading(true);
      const usersRef = collection(db, "users");
      const q = query(
        usersRef,
        where("validationStatus", "==", "EN_ATTENTE_VALIDATION"),
      );
      const querySnapshot = await getDocs(q);

      const list = [];
      querySnapshot.forEach((doc) => {
        list.push({ uid: doc.id, ...doc.data() });
      });
      setUsers(list);
    } catch (err) {
      console.error("Erreur de chargement des inscriptions :", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingUsers();
  }, []);

  const handleUpdateStatus = async (uid, newStatus) => {
    try {
      setProcessingId(uid);
      const docRef = doc(db, "users", uid);
      await updateDoc(docRef, {
        validationStatus: newStatus,
        validatedAt: new Date(),
      });
      alert(
        newStatus === "VALIDE"
          ? "🟢 Dossier validé ! L'utilisateur est notifié et dispose d'un accès total."
          : "🔴 Dossier marqué comme incomplet. L'utilisateur devra compléter son formulaire.",
      );
      setUsers((prev) => prev.filter((u) => u.uid !== uid));
    } catch (err) {
      console.error("Erreur de mise à jour administrative :", err);
      alert("Une erreur est survenue lors du traitement.");
    } finally {
      setProcessingId(null);
    }
  };

  const getRoleIcon = (role, buyerProfile) => {
    const norm =
      role === "producteur"
        ? "producer"
        : role === "livreur"
          ? "driver"
          : role === "acheteur"
            ? "buyer"
            : role;
    if (norm === "producer")
      return <Award className="text-amber-700 shrink-0" size={16} />;
    if (norm === "driver")
      return <Truck className="text-blue-700 shrink-0" size={16} />;
    if (norm === "buyer") {
      return buyerProfile === "B2G" ? (
        <Landmark className="text-sky-700 shrink-0" size={16} />
      ) : (
        <ShoppingBag className="text-green-700 shrink-0" size={16} />
      );
    }
    return <User className="text-gray-700 shrink-0" size={16} />;
  };

  const getRoleLabel = (role, buyerProfile) => {
    const norm =
      role === "producteur"
        ? "producer"
        : role === "livreur"
          ? "driver"
          : role === "acheteur"
            ? "buyer"
            : role;
    if (norm === "producer") return "Maraîcher";
    if (norm === "driver") return "Livreur";
    if (norm === "buyer")
      return buyerProfile === "B2G" ? "Acheteur Public" : "Acheteur Privé";
    return "Utilisateur";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10 gap-2 text-xs font-black text-purple-800">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-700"></div>
        <span>Chargement des dossiers d'inscription...</span>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 space-y-4 shadow-xs">
      <h3 className="text-sm font-black uppercase text-gray-800 tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-3">
        <ShieldAlert size={16} className="text-purple-700" /> Dossiers en
        Attente de Validation d'Inscription ({users.length})
      </h3>

      {users.length === 0 ? (
        <div className="text-center py-8 text-xs font-semibold text-gray-400 bg-gray-50 rounded-2xl">
          🎉 Aucun dossier d'inscription n'est en attente de validation
          réglementaire.
        </div>
      ) : (
        <div className="space-y-4">
          {users.map((userItem) => (
            <div
              key={userItem.uid}
              className="border border-gray-200 p-5 rounded-2xl bg-gray-50/40 hover:bg-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all"
            >
              {/* Infos Utilisateur */}
              <div className="space-y-2 text-xs font-semibold text-gray-600 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-black text-gray-900">
                    {userItem.companyName || userItem.displayName}
                  </span>
                  <span className="text-[9px] font-black uppercase tracking-wider bg-white border px-2 py-0.5 rounded-full flex items-center gap-1">
                    {getRoleIcon(userItem.role, userItem.buyerProfile)}
                    {getRoleLabel(userItem.role, userItem.buyerProfile)}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
                  <p className="flex items-center gap-1.5">
                    <Mail size={12} className="text-gray-400" />{" "}
                    {userItem.email}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Phone size={12} className="text-gray-400" />{" "}
                    {userItem.phone ||
                      userItem.harvestPhone ||
                      userItem.deliveryPhone}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <FileText size={12} className="text-gray-400" /> SIRET :{" "}
                    <span className="font-mono text-gray-800">
                      {userItem.siret || "N/A"}
                    </span>
                  </p>
                  {(userItem.role === "producer" ||
                    userItem.role === "producteur") &&
                    userItem.isBio && (
                      <p className="text-amber-800 font-bold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                        🌱 Certifié Bio Agrément:{" "}
                        {userItem.bioCertificationNumber}
                      </p>
                    )}
                  {(userItem.role === "driver" ||
                    userItem.role === "livreur") && (
                    <p className="text-blue-800 font-bold bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                      🚛 Lic: {userItem.transportLicense}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions de Validation */}
              <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
                <button
                  type="button"
                  disabled={processingId === userItem.uid}
                  onClick={() => handleUpdateStatus(userItem.uid, "VALIDE")}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1 bg-green-700 hover:bg-green-800 text-white font-black py-2 px-4 rounded-xl text-[10px] uppercase tracking-wider transition-all cursor-pointer shadow-xs"
                >
                  <ShieldCheck size={14} />
                  <span>Valider</span>
                </button>
                <button
                  type="button"
                  disabled={processingId === userItem.uid}
                  onClick={() => handleUpdateStatus(userItem.uid, "INCOMPLET")}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1 bg-white hover:bg-red-50 text-red-900 border border-red-200 font-black py-2 px-4 rounded-xl text-[10px] uppercase tracking-wider transition-all cursor-pointer"
                >
                  <ShieldAlert size={14} />
                  <span>Incomplet</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
