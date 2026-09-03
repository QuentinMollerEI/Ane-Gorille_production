import React from 'react';
import { Award, FileCheck, ShieldCheck } from 'lucide-react';

export default function DriverDrealView() {
  return (
    <div className="space-y-6 bg-white p-6 rounded-2xl border border-gray-150 shadow-sm">
      <div className="border-b border-gray-100 pb-4">
        <h3 className="text-base font-bold text-brand-green flex items-center">
          <Award className="mr-2 text-brand-gold" size={20} />
          Agrément de Transport Routier de Marchandises
        </h3>
        <p className="text-xs text-gray-500 mt-1">Consultez et tenez à jour votre licence de transport intérieur délivrée par la DREAL.</p>
      </div>

      <div className="p-5 border border-green-150 bg-green-50/50 rounded-xl flex items-start space-x-3 text-xs">
        <ShieldCheck className="text-brand-green flex-shrink-0 mt-0.5" size={20} />
        <div className="space-y-1">
          <h4 className="font-bold text-brand-green">Statut : Licence active de Transport routier de marchandises</h4>
          <p className="text-gray-700"><strong>Détenteur :</strong> LogiVert (Jean-Pierre)</p>
          <p className="text-gray-700"><strong>Licence DREAL de transport intérieur N° :</strong> 2026-L-123456</p>
          <p className="text-gray-700"><strong>Date de validité :</strong> Jusqu'au 31/12/2026</p>
        </div>
      </div>

      <div className="border border-dashed border-gray-250 p-6 rounded-xl text-center text-xs space-y-2">
        <FileCheck className="mx-auto text-gray-400" size={24} />
        <p className="font-bold text-brand-dark">Mettre à jour ma licence DREAL annuelle</p>
        <p className="text-gray-400">Glissez le scan ou la version PDF officielle de votre licence pour revalidation.</p>
      </div>
    </div>
  );
}
