// Chemin exact : src/components/auth/register/StepAddress.tsx
import React, { useState } from 'react';
// IMPORT CORRIGÉ : On remonte de 3 dossiers (register -> auth -> components -> src/hooks)
import { RegisterFormData } from '../../../hooks/useRegisterSteps'; 

interface StepProps {
  formData: RegisterFormData;
  updateFields: (fields: Partial<RegisterFormData>) => void;
}

export const StepAddress: React.FC<StepProps> = ({ formData, updateFields }) => {
  const [addressQuery, setAddressQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleAddressSearch = async (queryText: string) => {
    setAddressQuery(queryText);
    if (queryText.length < 3) {
      setSuggestions([]);
      return;
    }
    try {
      const response = await fetch(
        `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(queryText)}&limit=5`
      );
      if (response.ok) {
        const data = await response.json();
        const list = data.features.map((feat: any) => ({
          street: feat.properties.name,
          zipCode: feat.properties.postcode,
          city: feat.properties.city,
          label: feat.properties.label
        }));
        setSuggestions(list);
        setShowSuggestions(true);
      }
    } catch (err) {
      console.error("Erreur API BAN :", err);
    }
  };

  const handleSelect = (s: any) => {
    updateFields({
      street: s.street || '',
      zipCode: s.zipCode || '',
      city: s.city || ''
    });
    setAddressQuery(s.label);
    setShowSuggestions(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1 relative">
         <label className="block font-bold text-gray-700 mb-1 text-xs">
            Rechercher votre adresse d'établissement (BAN) *
        </label>
        <input
          type="text"
          placeholder="Saisissez votre rue, code postal ou commune d'Eure-et-Loir..."
          value={addressQuery}
          onChange={(e) => handleAddressSearch(e.target.value)}
          required
          className="w-full p-2.5 border border-gray-300 rounded-xl bg-white font-medium focus:ring-2 focus:ring-emerald-500 outline-none text-xs"
        />
        
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-16 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-md z-50 max-h-48 overflow-y-auto">
            {suggestions.map((s, idx) => (
              <div
                key={idx}
                onClick={() => handleSelect(s)}
                className={`p-2.5 text-xs cursor-pointer hover:bg-gray-50 transition-colors ${idx < suggestions.length - 1 ? 'border-b border-gray-200' : ''}`}
              >
                {s.label}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
        <div className="sm:col-span-2">
          <span className="text-[10px] font-bold text-gray-500 block">Rue / Établissement</span>
          <span className="text-[12.5px] text-gray-900 font-bold">{formData.street || 'Non spécifiée'}</span>
        </div>
        <div>
          <span className="text-[10px] font-bold text-gray-500 block">Code Postal</span>
          <span className="text-[12.5px] text-gray-900 font-bold">{formData.zipCode || 'Non spécifié'}</span>
        </div>
        <div>
          <span className="text-[10px] font-bold text-gray-500 block">Commune d'Eure-et-Loir</span>
          <span className="text-[12.5px] text-gray-900 font-bold">{formData.city || 'Non spécifiée'}</span>
        </div>
      </div>
    </div>
  );
};