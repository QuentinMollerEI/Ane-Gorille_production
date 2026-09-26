import React, { useState, useEffect } from 'react';
import { db } from '../../../config/firebase.js';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useAuth } from '../../../context/AuthContext.jsx';

import { StockHeaderStats } from './stock/StockHeaderStats.jsx';
import { StockFilters } from './stock/StockFilters.jsx';
import { StockTable } from './stock/StockTable.jsx';
import { EditProductModal } from './stock/EditProductModal.jsx';

import { Package, AlertCircle, Loader2 } from 'lucide-react';

export default function StockCompartment() {
  const { userProfile, user } = useAuth();
  const currentUser = userProfile || user || {};

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!currentUser.uid) {
      setLoading(false);
      return;
    }

    const productsRef = collection(db, 'products');
    const q = query(productsRef, where('vendorUid', '==', currentUser.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setProducts(list);
        setLoading(false);
      },
      (err) => {
        console.error('Erreur chargement stock :', err);
        setError('Impossible de charger les références de stock.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser.uid]);

  const handleQuickStockChange = async (productId, newStock) => {
    if (newStock < 0) return;
    try {
      const prodRef = doc(db, 'products', productId);
      await updateDoc(prodRef, { stock: newStock });
    } catch (err) {
      console.error('Erreur mise à jour stock rapide :', err);
    }
  };

  const handleToggleActive = async (productId, newIsActive) => {
    try {
      const prodRef = doc(db, 'products', productId);
      await updateDoc(prodRef, { isActive: newIsActive });
    } catch (err) {
      console.error('Erreur bascule visibilité :', err);
    }
  };

  const handleSaveProduct = async (productId, updatedData) => {
    setIsSaving(true);
    try {
      const prodRef = doc(db, 'products', productId);
      await updateDoc(prodRef, updatedData);
      setIsEditModalOpen(false);
      setSelectedProduct(null);
    } catch (err) {
      console.error('Erreur sauvegarde produit :', err);
      setError('Échec de la sauvegarde du produit.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Voulez-vous vraiment archiver cette référence de votre stock ?')) return;
    try {
      const prodRef = doc(db, 'products', productId);
      await deleteDoc(prodRef);
    } catch (err) {
      console.error('Erreur suppression produit :', err);
    }
  };

  const filteredProducts = products.filter((item) => {
    const title = (item.title || item.name || '').toLowerCase();
    const matchesSearch = title.includes(searchTerm.toLowerCase());

    let matchesStock = true;
    const stock = item.stock || 0;
    const minStock = item.minStock || 5;

    if (stockFilter === 'IN_STOCK') matchesStock = stock > 0;
    if (stockFilter === 'LOW_STOCK') matchesStock = stock > 0 && stock <= minStock;
    if (stockFilter === 'OUT_OF_STOCK') matchesStock = stock <= 0;

    let matchesCategory = true;
    if (categoryFilter === 'ANE') matchesCategory = item.universe !== 'GORILLE' && item.category !== 'artisanat';
    if (categoryFilter === 'GORILLE') matchesCategory = item.universe === 'GORILLE' || item.category === 'artisanat';

    return matchesSearch && matchesStock && matchesCategory;
  });

  if (loading) {
    return (
      <div className="p-12 text-center space-y-3">
        <Loader2 className="animate-spin mx-auto text-emerald-700" size={32} />
        <p className="text-xs font-bold text-slate-500">Chargement de votre stock en cours...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Package className="text-emerald-700" size={24} />
            Gestion des Stocks &amp; Mises en Rayon
          </h2>
          <p className="text-xs font-semibold text-slate-500">
            Ajustement en temps réel, tarifs HT &amp; visibilité sur la boutique
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-bold flex items-center gap-2">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <StockHeaderStats products={products} />

      <StockFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        stockFilter={stockFilter}
        onStockFilterChange={setStockFilter}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
      />

      <StockTable
        products={filteredProducts}
        onQuickStockChange={handleQuickStockChange}
        onEditProduct={(prod) => {
          setSelectedProduct(prod);
          setIsEditModalOpen(true);
        }}
        onToggleActive={handleToggleActive}
        onDeleteProduct={handleDeleteProduct}
      />

      <EditProductModal
        product={selectedProduct}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedProduct(null);
        }}
        onSave={handleSaveProduct}
        isSaving={isSaving}
      />
    </div>
  );
}