import React, { useState } from 'react';
import { Award, Upload, Calendar, CheckCircle } from 'lucide-react';

export default function ProducerDocsView() {
  const [certs, setCerts] = useState([
    { id: 1, name: 'Certification Agriculture Biologique (Ecocert FR-BIO-01)', expires: '31/12/2026', status: 'active' },
    { id: 2, name: 'Attestation de vigilance fiscale Urssaf (KBIS)', expires: '01/03/2027', status: 'active' }
  ]);

  return (
    <div className="space-y-6 bg-white p-6 rounded-2xl border border-gray-150 shadow-sm">
      <div className="border-b border-gray-100 pb-4">
        <h3 className="text-base font-bold text-brand-green flex items-center">
          <Award className="mr-2 text-brand-gold" size={20} />
          Certifications d'Exploitation & Normes Qualité
        </h3>
        <p className="text-xs text-gray-500 mt-1">Téléversez vos justificatifs obligatoires de qualité agricole pour valoriser votre production auprès des cantines scolaires.</p>
      </div>

      <div className="space-y-3 text-xs">
        {certs.map((c) => (
          <div key={c.id} className="border border-gray-100 p-4 rounded-xl flex items-center justify-between bg-gray-50/50">
            <div className="flex items-start space-x-3">
              <Award className="text-brand-green mt-0.5" size={18} />
              <div>
                <p className="font-bold text-brand-dark">{c.name}</p>
                <p className="text-gray-400 mt-1 flex items-center"><Calendar size={12} className="mr-1" /> Expire le : {c.expires}</p>
              </div>
            </div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-brand-green border border-green-100 uppercase">
              <CheckCircle size={10} className="mr-1" /> Valide
            </span>
          </div>
        ))}
      </div>

      {/* Formulaire de dépôt rapide */}
      <div className="border border-dashed border-gray-250 p-6 rounded-xl text-center text-xs space-y-3 hover:bg-gray-50/30 transition-colors cursor-pointer">
        <Upload className="mx-auto text-gray-400" size={24} />
        <div>
          <p className="font-bold text-brand-dark">Ajouter un nouveau certificat d'exploitation</p>
          <p className="text-gray-400 mt-0.5">Glissez-déposez votre certificat au format PDF (Ecocert, Sirene, KBIS...)</p>
        </div>
      </div>
    </div>
  );
}
