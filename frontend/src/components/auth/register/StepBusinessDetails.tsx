// Chemin exact : src/components/auth/register/StepBusinessDetails.tsx
import React from 'react';
// IMPORT CORRIGÉ : On remonte de 3 dossiers (register -> auth -> components -> src/hooks)
import { RegisterFormData } from '../../../hooks/useRegisterSteps'; 

interface StepBusinessDetailsProps {
  formData: RegisterFormData;
  updateFields: (fields: Partial<RegisterFormData>) => void;
  siretStatus: 'idle' | 'success' | 'failed';
  handleVerifySiret: () => void;
}

export const StepBusinessDetails: React.FC<StepBusinessDetailsProps> = ({
  formData,
  updateFields,
  siretStatus,
  handleVerifySiret
}) => {
  const isBuyer = formData.role === 'Buyer' || formData.role === 'acheteur_prive' || formData.role === 'acheteur_public';
  const isProducer = formData.role === 'Producer' || formData.role === 'producteur';
  const isCarrier = formData.role === 'Carrier';

  return (
    <div className="flex flex-col gap-4">
      {/* SAISIE DU SIRET AVEC RECHERCHE INSEE AUTOMATIQUE */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-gray-900">
          Numéro SIRET de l'établissement (14 chiffres)
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="ex: 123 456 789 00012"
            value={formData.siret}
            onChange={(e) => updateFields({ siret: e.target.value })}
            className={`flex-1 h-[38px] border ${siretStatus === 'success' ? 'border-green-500' : 'border-gray-300'} rounded-lg px-3 text-[13px] outline-none focus:ring-2 focus:ring-emerald-500`}
          />
          <button
            type="button"
            onClick={handleVerifySiret}
            className="px-4 h-[38px] bg-emerald-900 text-white rounded-lg font-bold cursor-pointer text-xs hover:bg-emerald-800 transition-colors"
          >
            Rechercher INSEE
          </button>
        </div>
        {siretStatus === 'success' && (
          <span className="text-[11px] text-green-500 font-bold">
            Établissement authentifié via l'Annuaire SIRENE de l'INSEE.
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
         <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-700">
              {isProducer ? "Nom de votre GAEC / Exploitation" : isCarrier ? "Nom de l'Entreprise de Transport" : "Nom de l'établissement"} *
            </label>
            <input
              type="text"
              placeholder="Dénomination sociale officielle"
              value={formData.companyName}
              onChange={(e) => updateFields({ companyName: e.target.value })}
              required
              className="w-full p-2.5 border border-gray-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none text-xs"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-700">
               Statut Juridique d'Entreprise *
            </label>
             <input
              type="text"
              placeholder="ex: GAEC, SARL, EI, EURL..."
              value={formData.legalStatus}
              onChange={(e) => updateFields({ legalStatus: e.target.value })}
              required
              className="w-full p-2.5 border border-gray-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none text-xs"
            />
          </div>
      </div>

      {/* INFORMATIONS DE CONTACTS ET NOTIFICATIONS D'AFFAIRES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
           <label className="text-xs font-bold text-gray-700">Nom & Prénom du Responsable *</label>
           <input
              type="text"
              placeholder="ex: Quentin LEFEVRE"
              value={formData.contactName}
              onChange={(e) => updateFields({ contactName: e.target.value })}
              required
              className="w-full p-2.5 border border-gray-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none text-xs"
            />
        </div>
        <div className="flex flex-col gap-1">
           <label className="text-xs font-bold text-gray-700">Téléphone Mobile (Notifications) *</label>
           <input
              type="tel"
              placeholder="ex: 06 12 34 56 78"
              value={formData.phone}
              onChange={(e) => updateFields({ phone: e.target.value })}
              required
              className="w-full p-2.5 border border-gray-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none text-xs"
            />
        </div>
      </div>

      {isProducer && (
        <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-1">
               <label className="text-xs font-bold text-gray-700">Second e-mail professionnel (Notification double GAEC)</label>
               <input
                  type="email"
                  placeholder="ex: compta-haute-ferme@orange.fr"
                  value={formData.contactEmail2}
                  onChange={(e) => updateFields({ contactEmail2: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none text-xs"
                />
            </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-900">
              Description de l'Activité (Vitrine visible par les acheteurs publics/privés)
            </label>
            <textarea
              placeholder="Présentez votre ferme, votre savoir-faire de terroir et vos types de cultures maraîchères..."
              value={formData.activityDescription}
              onChange={(e) => updateFields({ activityDescription: e.target.value })}
              required
              className="h-[60px] rounded-lg border border-gray-300 p-2 text-[12.5px] font-inherit resize-none outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      )}

      {/* CHAMPS DYNAMIQUES SELON LE PROFIL D'AFFAIRES */}
      {isBuyer && (
        <div className="flex flex-col gap-3 p-3.5 bg-slate-50 rounded-lg border border-gray-200">
          <label className="text-xs font-bold text-gray-900">Classification d'Acheteur Pro</label>
          <div className="flex gap-5">
            <label className="flex items-center gap-1.5 text-[13px] cursor-pointer">
              <input
                type="radio"
                name="buyerType"
                checked={formData.buyerType === 'public'}
                onChange={() => updateFields({ buyerType: 'public' })}
                className="accent-emerald-600"
              />
              Établissement Public (Cantine de Mairie, B2G)
            </label>
            <label className="flex items-center gap-1.5 text-[13px] cursor-pointer">
              <input
                type="radio"
                name="buyerType"
                checked={formData.buyerType === 'private'}
                onChange={() => updateFields({ buyerType: 'private' })}
                className="accent-emerald-600"
              />
              Commerce Privé (Restaurant, B2B)
            </label>
          </div>

          {formData.buyerType === 'public' ? (
            <div className="flex flex-col gap-2.5">
               <div className="flex flex-col gap-1">
                 <label className="text-xs font-bold text-gray-700">Code Service Chorus Pro (Routage de factures d'État) *</label>
                 <input
                    type="text"
                    placeholder="ex: SERV-RESTO-SCOLAIRE"
                    value={formData.serviceCode}
                    onChange={(e) => updateFields({ serviceCode: e.target.value })}
                    required
                    className="w-full p-2.5 border border-gray-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none text-xs"
                  />
               </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                 <div className="flex flex-col gap-1">
                   <label className="text-xs font-bold text-gray-700">E-mail du Responsable Achats *</label>
                   <input
                      type="email"
                      placeholder="ex: achats@mairie.fr"
                      value={formData.purchasingManagerEmail}
                      onChange={(e) => updateFields({ purchasingManagerEmail: e.target.value })}
                      required
                      className="w-full p-2.5 border border-gray-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none text-xs"
                    />
                 </div>
                 <div className="flex flex-col gap-1">
                   <label className="text-xs font-bold text-gray-700">E-mail du Pouvoir Adjudicateur *</label>
                   <input
                      type="email"
                      placeholder="ex: comptabilite@mairie.fr"
                      value={formData.authorizingOfficerEmail}
                      onChange={(e) => updateFields({ authorizingOfficerEmail: e.target.value })}
                      required
                      className="w-full p-2.5 border border-gray-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none text-xs"
                    />
                 </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
               <div className="flex flex-col gap-1">
                 <label className="text-xs font-bold text-gray-700">Numéro de TVA Intracommunautaire *</label>
                 <input
                    type="text"
                    placeholder="ex: FR89123456789"
                    value={formData.vatNumber}
                    onChange={(e) => updateFields({ vatNumber: e.target.value })}
                    required
                    className="w-full p-2.5 border border-gray-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none text-xs"
                  />
               </div>
               <div className="flex flex-col gap-1">
                 <label className="text-xs font-bold text-gray-700">E-mail du Responsable Achats du Restaurant *</label>
                 <input
                    type="email"
                    placeholder="ex: comptable@monrestaurant.fr"
                    value={formData.purchasingManagerEmail}
                    onChange={(e) => updateFields({ purchasingManagerEmail: e.target.value })}
                    required
                    className="w-full p-2.5 border border-gray-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none text-xs"
                  />
               </div>
            </div>
          )}
        </div>
      )}

      {isProducer && (
        <div className="flex flex-col gap-3 p-3.5 bg-emerald-50 rounded-lg border border-emerald-500">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
             <div className="flex flex-col gap-1">
               <label className="text-xs font-bold text-gray-700">Numéro PACAGE (Déclaration PAC) *</label>
               <input
                  type="text"
                  placeholder="ex: 028123456"
                  value={formData.pacageNumber}
                  onChange={(e) => updateFields({ pacageNumber: e.target.value })}
                  required
                  className="w-full p-2.5 border border-gray-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none text-xs"
                />
             </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-bold text-emerald-900">Régime Fiscal de TVA</span>
              <label className="flex items-center gap-1.5 text-xs mt-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isVatRegistered}
                  onChange={(e) => updateFields({ isVatRegistered: e.target.checked })}
                  className="accent-emerald-600"
                />
                Assujetti aux taux réels de TVA
              </label>
            </div>
          </div>

          {formData.isVatRegistered ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-emerald-900">Taux de TVA Maraîchère principal</label>
                <select
                  value={formData.vatRate}
                  onChange={(e) => updateFields({ vatRate: parseFloat(e.target.value) })}
                  className="h-9 rounded-lg border border-gray-300 px-2 text-[12.5px] font-bold bg-white outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value={5.5}>5.5 % (Maraîchage frais ordinaire)</option>
                  <option value={10}>10 % (Produits transformés de terroir)</option>
                  <option value={20}>20 % (Fleurs & autres)</option>
                </select>
              </div>
               <div className="flex flex-col gap-1">
                 <label className="text-xs font-bold text-gray-700">Numéro de TVA Maraîcher *</label>
                 <input
                    type="text"
                    placeholder="ex: FR12345678901"
                    value={formData.vatNumber}
                    onChange={(e) => updateFields({ vatNumber: e.target.value })}
                    required
                    className="w-full p-2.5 border border-gray-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none text-xs"
                  />
               </div>
            </div>
          ) : (
            <div className="text-[10.5px] text-emerald-900 font-bold leading-relaxed mt-1">
              Régime de Franchise en Base (Art. 293 B du CGI). Vos factures sous mandat contiendront automatiquement la mention légale obligatoire : « TVA non applicable, article 293 B du CGI »
            </div>
          )}

          {/* Saisie RIB & Paramétrage Chorus Pro pour le maraîcher */}
          <div className="border-t border-dashed border-emerald-500 pt-2.5 mt-2">
            <span className="text-[11px] font-bold text-emerald-900 block mb-2">
              Coordonnées Bancaires de l'Exploitation (Stripe Connect Express)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
               <div className="flex flex-col gap-1">
                 <label className="text-xs font-bold text-gray-700">Code IBAN *</label>
                 <input
                    type="text"
                    placeholder="FR76 3000 6000 0112 3456 7890 123"
                    value={formData.iban}
                    onChange={(e) => updateFields({ iban: e.target.value })}
                    required
                    className="w-full p-2.5 border border-gray-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none text-xs"
                  />
               </div>
               <div className="flex flex-col gap-1">
                 <label className="text-xs font-bold text-gray-700">Code BIC / SWIFT *</label>
                 <input
                    type="text"
                    placeholder="ex: BNPAPRPPXXX"
                    value={formData.bic}
                    onChange={(e) => updateFields({ bic: e.target.value })}
                    required
                    className="w-full p-2.5 border border-gray-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none text-xs"
                  />
               </div>
            </div>
            
            <label className="flex items-start gap-1.5 text-xs mt-3 cursor-pointer text-emerald-900 font-bold">
              <input
                type="checkbox"
                checked={formData.transmitToChorusPro}
                onChange={(e) => updateFields({ transmitToChorusPro: e.target.checked })}
                className="mt-0.5 accent-emerald-600"
              />
              <span>Transmettre automatiquement mes factures agricoles aux acheteurs publics via Chorus Pro</span>
            </label>
          </div>

          {/* Saisie Conditions de Paiement du maraîcher */}
          <div className="border-t border-dashed border-emerald-500 pt-2.5 mt-2">
            <span className="text-[11px] font-bold text-emerald-900 block mb-2">
              Conditions Commerciales (à destination des acheteurs privés B2B)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
               <div className="flex flex-col gap-1">
                 <label className="text-xs font-bold text-gray-700">Délai réglementaire de règlement *</label>
                 <input
                    type="text"
                    placeholder="ex: 30 jours fin de mois"
                    value={formData.paymentDelay}
                    onChange={(e) => updateFields({ paymentDelay: e.target.value })}
                    required
                    className="w-full p-2.5 border border-gray-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none text-xs"
                  />
               </div>
               <div className="flex flex-col gap-1">
                 <label className="text-xs font-bold text-gray-700">Pénalités de retard légales *</label>
                 <input
                    type="text"
                    placeholder="ex: Taux de la BCE majoré de 10 points"
                    value={formData.latePenalties}
                    onChange={(e) => updateFields({ latePenalties: e.target.value })}
                    required
                    className="w-full p-2.5 border border-gray-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none text-xs"
                  />
               </div>
            </div>
          </div>
        </div>
      )}

      {isCarrier && (
        <div className="flex flex-col gap-3 p-3.5 bg-amber-50 rounded-lg border border-amber-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
             <div className="flex flex-col gap-1">
               <label className="text-xs font-bold text-gray-700">N° Attestation Capacité Professionnelle DREAL *</label>
               <input
                  type="text"
                  placeholder="ex: CAP-12345"
                  value={formData.carrierCapacity}
                  onChange={(e) => updateFields({ carrierCapacity: e.target.value })}
                  required
                  className="w-full p-2.5 border border-gray-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none text-xs"
                />
             </div>
             <div className="flex flex-col gap-1">
               <label className="text-xs font-bold text-gray-700">Numéro de Licence de Transport Intérieur *</label>
               <input
                  type="text"
                  placeholder="ex: LIC-98765"
                  value={formData.carrierLicense}
                  onChange={(e) => updateFields({ carrierLicense: e.target.value })}
                  required
                  className="w-full p-2.5 border border-gray-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none text-xs"
                />
             </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
             <div className="flex flex-col gap-1">
               <label className="text-xs font-bold text-gray-700">Modèle Véhicule ({"<"}3.5t) *</label>
               <input
                  type="text"
                  placeholder="ex: Renault Master Frigo"
                  value={formData.vehicleModel}
                  onChange={(e) => updateFields({ vehicleModel: e.target.value })}
                  required
                  className="w-full p-2.5 border border-gray-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none text-xs"
                />
             </div>
             <div className="flex flex-col gap-1">
               <label className="text-xs font-bold text-gray-700">Plaque d'Immatriculation *</label>
               <input
                  type="text"
                  placeholder="ex: AB-123-CD"
                  value={formData.vehiclePlate}
                  onChange={(e) => updateFields({ vehiclePlate: e.target.value })}
                  required
                  className="w-full p-2.5 border border-gray-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none text-xs"
                />
             </div>
          </div>
          <div className="flex flex-col gap-1.5 text-[11px] text-amber-900 leading-relaxed mt-1">
            <label className="flex items-start gap-1.5 cursor-pointer font-bold">
              <input
                type="checkbox"
                checked={formData.drealCertified}
                onChange={(e) => updateFields({ drealCertified: e.target.checked })}
                required
                className="mt-0.5 accent-amber-600"
              />
              <span>Je certifie sur l'honneur détenir la capacité financière requise (1 800 € de capitaux) exigée par la DREAL Centre-Val de Loire pour le véhicule frigorifique affecté.</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};