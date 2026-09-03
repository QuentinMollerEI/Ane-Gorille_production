import React, { useState } from "react";
import { ChevronUp, ChevronDown, Search, Edit2, Trash2 } from "lucide-react";

export default function StockCompartment() {
  const [isRetracted, setIsRetracted] = useState(false);
  const [selectAll, setSelectAll] = useState(false);

  // Simulation de données
  const products = [
    {
      id: 1,
      name: "Carottes Fanes",
      category: "Légumes",
      price: 2.5,
      stock: 45,
      unit: "botte",
      isBio: true,
    },
    {
      id: 2,
      name: "Pommes de terre",
      category: "Légumes",
      price: 1.2,
      stock: 120,
      unit: "kg",
      isBio: false,
    },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm transition-all">
      <div className="flex justify-between items-center p-5 border-b border-gray-100">
        <h2 className="font-bold text-gray-800 text-lg">
          3. Gestion des Stocks & Catalogue
        </h2>
        <button
          onClick={() => setIsRetracted(!isRetracted)}
          className="text-gray-500 hover:text-gray-800"
        >
          {isRetracted ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
        </button>
      </div>

      {!isRetracted && (
        <div className="p-5">
          {/* Barre de recherche et filtres */}
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-3 text-gray-400"
              />
              <input
                type="text"
                placeholder="Rechercher un produit..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-brand-green focus:border-brand-green"
              />
            </div>
            <select className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-brand-green">
              <option value="">Toutes catégories</option>
              <option value="Légumes">Légumes</option>
              <option value="Fruits">Fruits</option>
            </select>
            <select className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-brand-green">
              <option value="">Tous les stocks</option>
              <option value="low">Stock faible</option>
              <option value="out">Rupture</option>
            </select>
          </div>

          {/* Tableau de stock */}
          <div className="overflow-x-auto border border-gray-200 rounded-md">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
                <tr>
                  <th className="p-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={() => setSelectAll(!selectAll)}
                      className="rounded border-gray-300 text-brand-green focus:ring-brand-green"
                    />
                  </th>
                  <th className="p-3 font-semibold">Produit</th>
                  <th className="p-3 font-semibold">Catégorie</th>
                  <th className="p-3 font-semibold">Prix (HT)</th>
                  <th className="p-3 font-semibold">Stock</th>
                  <th className="p-3 font-semibold text-center">
                    Bio / EGAlim
                  </th>
                  <th className="p-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        readOnly
                        className="rounded border-gray-300 text-brand-green focus:ring-brand-green"
                      />
                    </td>
                    <td className="p-3 font-medium text-gray-900">{p.name}</td>
                    <td className="p-3 text-gray-600">{p.category}</td>
                    <td className="p-3 font-medium">
                      {p.price.toFixed(2)} € / {p.unit}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${p.stock > 10 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                      >
                        {p.stock} {p.unit}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {p.isBio ? (
                        <span className="text-green-600 font-bold">✓</span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <button className="text-gray-500 hover:text-blue-600 transition p-1">
                        <Edit2 size={16} />
                      </button>
                      <button className="text-gray-500 hover:text-red-600 transition p-1">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
