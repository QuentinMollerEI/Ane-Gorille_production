import React, { useState } from 'react';
import { db } from '../../config/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ShieldCheck, PlusCircle, Printer } from 'lucide-react';

export default function ProducerView({ user }) {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [isBio, setIsBio] = useState(false);
  const [loading, setLoading] = useState(false);

  // Soumission et enregistrement du nouveau produit sur Firestore
  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!title || !price) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'products'), {
        title,
        pricePerKg: parseFloat(price),
        isAvailable: true,
        isBio,
        producer: user.displayName, // Associe automatiquement le nom du Producteur connecté
        active: true, // Pour validation de mise en ligne
        createdAt: new Date().toISOString()
      });

      // Réinitialisation du formulaire après enregistrement
      setTitle('');
      setPrice('');
      setIsBio(false);
      alert("Félicitations ! Votre produit est désormais en rayon sur le Marché.");
    } catch (err) {
      console.error("Erreur d'ajout Firestore :", err);
      alert("Une erreur est survenue lors de l'enregistrement sur Firestore. Vérifiez vos règles d'accès.");
    } finally {
      setLoading(false);
    }
  };

  const documents = [
    { id: 'BP-2026-001', type: 'Bon de Préparation', date: '02/09/2026', status: 'À préparer' },
    { id: 'BL-2026-042', type: 'Bon de Livraison', date: '02/09/2026', status: 'Prêt' },
  ];

  return (
    <div className="space-y-8">
      <div className="border-b border-gray-100 pb-4">
        <h2 className="text-lg font-bold text-brand-green flex items-center">
          <ShieldCheck size={20} className="mr-2 text-brand-gold" />
          Mise en rayon & Traçabilité Maraîchère
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Ajoutez vos récoltes en rayon et gérez vos documents administratifs de transport et d'hygiène.
        </p>
      </div>

      {/* Formulaire d'Ajout de Produit Réel */}
      <div className="bg-gray-50 p-6 rounded-xl border border-gray-150">
        <h3 className="text-sm font-bold text-brand-dark mb-4 flex items-center">
          <PlusCircle size={16} className="mr-2 text-brand-green" />
          Mettre un nouveau produit en rayon
        </h3>
        <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Nom du légume / fruit</label>
            <input
              type="text"
              required
              placeholder="Ex: Carottes fanes"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 bg-white rounded-lg focus:outline-none focus:border-brand-green"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Prix au kg (€)</label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="Ex: 2.80"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 bg-white rounded-lg focus:outline-none focus:border-brand-green"
            />
          </div>

          <div className="flex items-center justify-between h-10">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isBio}
                onChange={(e) => setIsBio(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-brand-green focus:ring-brand-green"
              />
              <span className="text-sm text-gray-600 font-medium">Certifié BIO</span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="bg-brand-green hover:bg-opacity-95 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-all disabled:opacity-50"
            >
              {loading ? 'Mise en rayon...' : 'Mettre en rayon'}
            </button>
          </div>
        </form>
      </div>

      {/* Bons de Préparation */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Documents de livraison actifs</h3>
        <div className="overflow-hidden border border-gray-100 rounded-xl bg-white">
          <table className="min-w-full divide-y divide-gray-100 text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase">
              <tr>
                <th className="px-6 py-3">Type de document</th>
                <th className="px-6 py-3">Référence</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Statut</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{doc.type}</td>
                  <td className="px-6 py-4 text-gray-500 font-mono">{doc.id}</td>
                  <td className="px-6 py-4 text-gray-500">{doc.date}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-brand-green border border-green-100">
                      {doc.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => alert(`Impression de ${doc.id}`)}
                      className="p-1.5 rounded-lg bg-gray-50 hover:bg-brand-green hover:text-white text-gray-500 transition-colors inline-flex items-center justify-center"
                    >
                      <Printer size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
