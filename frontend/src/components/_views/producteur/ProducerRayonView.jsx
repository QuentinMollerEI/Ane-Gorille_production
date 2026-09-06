import React, { useState } from 'react';
import { db } from '../../../config/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { PlusCircle, Leaf, ShieldAlert } from 'lucide-react';

export default function ProducerRayonView({ user }) {
  const [title, setTitle] = useState('');
  const [priceHT, setPriceHT] = useState('');
  const [isBio, setIsBio] = useState(false);
  const [batchNumber, setBatchNumber] = useState('');
  const [distanceKm, setDistanceKm] = useState('12');
  const [loading, setLoading] = useState(false);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!title || !priceHT || !batchNumber) {
      alert("Veuillez renseigner tous les champs réglementaires obligatoires.");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'products'), {
        title,
        priceHT: parseFloat(priceHT),
        vatRate: 5.5, // TVA maraîchère classique sur l'alimentaire brut
        isAvailable: true,
        isBio,
        producer: user?.displayName || 'Producteur de la Rosée',
        producerSiret: user?.siret || 'SIRET_DÉFAUT',
        iduAdeme: user?.iduAdeme || 'FR-ADEME-EXEMPLE', // Requis par Loi AGEC
        batchNumber, // Requis par Traçabilité HACCP
        harvestDate: new Date().toISOString().split('T')[0],
        distanceKm: parseInt(distanceKm),
        active: true,
        createdAt: new Date().toISOString()
      });

      setTitle('');
      setPriceHT('');
      setIsBio(false);
      setBatchNumber('');
      alert("Votre produit est enregistré et publié en direct sur le Marché de la Rosée !");
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'enregistrement. Vérifiez vos règles de sécurité Firestore.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 bg-white p-6 rounded-2xl border border-gray-150 shadow-sm">
      <div className="border-b border-gray-100 pb-4">
        <h3 className="text-base font-bold text-brand-green flex items-center">
          <PlusCircle className="mr-2 text-brand-gold" size={20} />
          Mise en rayon & Enregistrement Traçabilité
        </h3>
        <p className="text-xs text-gray-500 mt-1">Saisissez vos récoltes. La plateforme calcule automatiquement la TVA et assure la conformité légale.</p>
      </div>

      <form onSubmit={handleAddProduct} className="space-y-4 text-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nom du légume / fruit</label>
            <input
              type="text"
              required
              placeholder="Ex: Carottes fanes de la Rosée"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-brand-green"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Prix de vente HT (€ / kg)</label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="Ex: 2.50"
              value={priceHT}
              onChange={(e) => setPriceHT(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-brand-green"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Numéro de Lot (Traçabilité HACCP)</label>
            <input
              type="text"
              required
              placeholder="Ex: LOT-CAR-0209"
              value={batchNumber}
              onChange={(e) => setBatchNumber(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-brand-green font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Distance de transport (km d'exploitation)</label>
            <input
              type="number"
              required
              value={distanceKm}
              onChange={(e) => setDistanceKm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-brand-green"
            />
          </div>
        </div>

        <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isBio}
              onChange={(e) => setIsBio(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-brand-green focus:ring-brand-green"
            />
            <span className="font-bold text-brand-dark flex items-center">
              <Leaf size={14} className="mr-1 text-emerald-600" /> Certifié Agriculture Biologique (Ecocert)
            </span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 bg-brand-green text-white font-bold rounded-lg hover:bg-opacity-95 transition-all disabled:opacity-50 text-xs"
          >
            {loading ? 'Publication...' : 'Mettre en rayon'}
          </button>
        </div>
      </form>
    </div>
  );
}
