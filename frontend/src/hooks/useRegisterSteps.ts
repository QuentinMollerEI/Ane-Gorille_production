import { useState } from 'react';

/**
 * Définition stricte des données du formulaire d'inscription complet
 * Résout les erreurs d'import TypeScript dans les composants Step*.tsx
 */
export interface RegisterFormData {
  role: 'Buyer' | 'Producer' | 'Carrier' | 'acheteur_prive' | 'acheteur_public' | 'producteur';
  companyName: string;
  legalStatus: string;
  siret: string;
  contactName: string;
  phone: string;
  contactEmail2?: string;
  activityDescription?: string;
  buyerType?: 'public' | 'private';
  serviceCode?: string;
  purchasingManagerEmail?: string;
  authorizingOfficerEmail?: string;
  vatNumber?: string;
  pacageNumber?: string;
  isVatRegistered?: boolean;
  vatRate?: number;
  iban?: string;
  bic?: string;
  transmitToChorusPro?: boolean;
  paymentDelay?: string;
  latePenalties?: string;
  carrierCapacity?: string;
  carrierLicense?: string;
  vehicleModel?: string;
  vehiclePlate?: string;
  drealCertified?: boolean;
  street: string;
  zipCode: string;
  city: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  gdprConsent?: boolean;
  publicBiddingHonorSigned?: boolean;
  originTraceabilitySigned?: boolean;
}

/**
 * Hook pour gérer l'état d'un formulaire d'inscription multi-étapes (si vous l'utilisez)
 */
export const useRegisterSteps = (initialData: Partial<RegisterFormData> = {}) => {
  const [formData, setFormData] = useState<RegisterFormData>({
    role: 'Buyer',
    companyName: '',
    legalStatus: '',
    siret: '',
    contactName: '',
    phone: '',
    street: '',
    zipCode: '',
    city: '',
    ...initialData
  } as RegisterFormData);

  const updateFields = (fields: Partial<RegisterFormData>) => {
    setFormData(prev => ({ ...prev, ...fields }));
  };

  return { formData, updateFields };
};