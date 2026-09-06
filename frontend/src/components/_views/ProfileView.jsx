import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, AlertTriangle, FileText, Upload, Check } from 'lucide-react';

export default function ProfileView() {
  const { user, completeProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // États des formulaires adaptatifs
  const [siret, setSiret] = useState('');
  const [phone, setPhone] = useState('');

  // Champs spécifiques
  const [chorusCode, setChorusCode] = useState(''); // Acheteur Public
  const [vatNumber, setVatNumber] = useState('');   // Acheteur Privé
  const [iduAdeme, setIduAdeme] = useState('');     // Producteur (Loi AGEC)
  const [drealLicence, setDrealLicence] = useState(''); // Livreur (Transport)

  // Simulation de téléversement de fichiers (Faux liens de stockage cloud)
  const [uploadedDocs, setUploadedDocs] = useState({
    identity: null,
    professionalDoc: null, // Kbis, Certificat Bio, Agrément HACCP, Licence DREAL
  });

  const handleFileUpload = (type) => {
    // Simulation d'envoi de fichier
    setUploadedDocs(prev => ({
      ...prev,
      [type]: `https://firebasestorage.googleapis.com/v0/b/ane-et-gorille/o/docs%2F${type}-${user.uid}.pdf`
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      const additionalData = {
        siret,
        phone,
        updatedAt: new Date().toISOString(),
      };

      // Injection des données réglementaires requises par rôle
      if (user.role === 'acheteur') {
        if (chorusCode) additionalData.chorusCode = chorusCode;
        if (vatNumber) additionalData.vatNumber = vatNumber;
      } else if (user.role === 'producteur') {
        additionalData.iduAdeme = iduAdeme;
      } else if (user.role === 'livreur') {
        additionalData.drealLicence = drealLicence;
      }

      await completeProfile(additionalData, uploadedDocs);
      setSuccess(true);
    } catch (err) {
      alert("Erreur lors de la validation de la conformité : " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 bg-white p-8 rounded-2xl border border-gray-150 shadow-sm">

      {/* En-tête contextuel de conformité */}
      <div className="border-b border-gray-100 pb-5">
        <h2 className="text-xl font-bold text-brand-green flex items-center">
          <ShieldCheck className="mr-2 text-brand-gold" size={24} />
          {user?.profileComplete ? 'Votre compte est conforme' : 'Étape 2 : Conformité Légale & Administrative'}
        </h2>
        <p className="text-xs text-gray-500 mt-1.5">
          Conformément à la législation française (Lois AGEC, EGAlim et contrôles fiscaux de dématérialisation), veuillez compléter vos justificatifs d'exploitation.
        </p>
      </div>

      {/* Bannière d'alerte dynamique */}
      {!user?.profileComplete ? (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-xl flex items-start space-x-3">
          <AlertTriangle className="text-amber-600 flex-shrink-0 mt-0.5" size={18} />
          <div className="text-xs space-y-1">
            <p className="font-bold">Statut : Profil Incomplet (Accès restreint)</p>
            <p>Veuillez renseigner votre SIRET et vos pièces justificatives ci-dessous pour débloquer vos droits de mise en rayon, de facturation ou de livraison.</p>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-xl flex items-start space-x-3">
          <Check className="text-emerald-600 flex-shrink-0 mt-0.5" size={18} />
          <div className="text-xs space-y-1">
            <p className="font-bold">Statut : Compte Certifié Conforme</p>
            <p>Vos documents ont été transmis. Vous disposez de l'intégralité des fonctionnalités associées à votre rôle de <strong>{user?.role}</strong>.</p>
          </div>
        </div>
      )}

      {/* Formulaire de validation */}
      <form onSubmit={handleSubmit} className="space-y-6 text-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Numéro de SIRET (Établissement)</label>
            <input
              type="text"
              required
              placeholder="Ex: 123 456 789 00018"
              value={siret}
              onChange={(e) => setSiret(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-brand-green"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Téléphone de contact</label>
            <input
              type="tel"
              required
              placeholder="Ex: 06 12 34 56 78"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-brand-green"
            />
          </div>

          {/* RENDU DES CONFIGURATIONS SPÉCIFIQUES DE RÔLE */}

          {user?.role === 'acheteur' && (
            <>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Code Service Chorus Pro (Secteur Public)</label>
                <input
                  type="text"
                  placeholder="Ex: SERV-CANTINE (Obligatoire pour mairies)"
                  value={chorusCode}
                  onChange={(e) => setChorusCode(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-brand-green"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Numéro de TVA Intracommunautaire</label>
                <input
                  type="text"
                  placeholder="Ex: FR 12 345678901"
                  value={vatNumber}
                  onChange={(e) => setVatNumber(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-brand-green"
                />
              </div>
            </>
          )}

          {user?.role === 'producteur' && (
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Identifiant Unique ADEME / REP (Loi AGEC emballages)</label>
              <input
                type="text"
                required
                placeholder="Ex: FR123456_01ECOR"
                value={iduAdeme}
                onChange={(e) => setIduAdeme(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-brand-green"
              />
            </div>
          )}

          {user?.role === 'livreur' && (
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Numéro de Licence DREAL (Transport routier)</label>
              <input
                type="text"
                required
                placeholder="Ex: LIC-DREAL-2026-99"
                value={drealLicence}
                onChange={(e) => setDrealLicence(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-brand-green"
              />
            </div>
          )}
        </div>

        {/* SECTION DOSSIER JUSTIFICATIFS (TÉLÉVERSEMENT SIMULÉ) */}
        <div className="border-t border-gray-100 pt-6 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Justificatifs obligatoires de traçabilité</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Fichier 1 : Pièce d'identité de l'exploitant */}
            <div className="border border-dashed border-gray-200 p-4 rounded-xl flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center space-x-3">
                <FileText className="text-gray-400" size={20} />
                <div>
                  <p className="font-semibold text-xs text-brand-dark">Pièce d'identité (CNI / Passeport)</p>
                  <p className="text-[10px] text-gray-400">{uploadedDocs.identity ? '✓ Reçu avec succès' : 'Format PDF exigé'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleFileUpload('identity')}
                className={`p-2 rounded-lg border transition-all ${
                  uploadedDocs.identity ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-white border-gray-200 text-gray-500 hover:text-brand-green'
                }`}
              >
                <Upload size={14} />
              </button>
            </div>

            {/* Fichier 2 : Preuve d'exploitation en fonction du rôle */}
            <div className="border border-dashed border-gray-200 p-4 rounded-xl flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center space-x-3">
                <FileText className="text-gray-400" size={20} />
                <div>
                  <p className="font-semibold text-xs text-brand-dark">
                    {user?.role === 'producteur' && "Certificat AB Ecocert (ou KBIS)"}
                    {user?.role === 'livreur' && "Attestation de Licence DREAL"}
                    {user?.role === 'acheteur' && "Preuve de Représentation (KBIS/Mandat)"}
                  </p>
                  <p className="text-[10px] text-gray-400">{uploadedDocs.professionalDoc ? '✓ Reçu avec succès' : 'Format PDF exigé'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleFileUpload('professionalDoc')}
                className={`p-2 rounded-lg border transition-all ${
                  uploadedDocs.professionalDoc ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-white border-gray-200 text-gray-500 hover:text-brand-green'
                }`}
              >
                <Upload size={14} />
              </button>
            </div>

          </div>
        </div>

        {/* Notification de validation réussie */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-800 text-xs p-3 rounded-lg text-center font-semibold">
            Vos informations de conformité ont été validées et enregistrées avec succès sur la blockchain de traçabilité !
          </div>
        )}

        {/* Bouton de validation globale */}
        <div className="flex justify-end pt-4 border-t border-gray-100">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-brand-green text-white text-xs font-bold rounded-lg hover:bg-opacity-95 transition-all shadow disabled:opacity-50"
          >
            {loading ? 'Validation des fichiers...' : 'Soumettre le dossier de conformité'}
          </button>
        </div>
      </form>

    </div>
  );
}
