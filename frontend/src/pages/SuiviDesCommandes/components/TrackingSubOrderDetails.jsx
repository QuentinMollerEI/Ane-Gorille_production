import React from "react";
import { Store, Tag, Calendar, MapPin } from "lucide-react";

/**
 * 🌾 COMPOSANT : TrackingSubOrderDetails.jsx
 * Affichage des sous-commandes groupées par producteur/maraîcher avec numéros de lots sanitaires.
 */
export default function TrackingSubOrderDetails({ subOrders = [], items = [] }) {
  const groupedProducts = React.useMemo(() => {
    if (subOrders && subOrders.length > 0) return subOrders;

    const map = {};
    (items || []).forEach((item) => {
      const pName = item.producerName || item.producer || "Maraîcher Local";
      if (!map[pName]) {
        map[pName] = {
          producerName: pName,
          department: item.department || item.origin || "Local",
          batchNumber: item.batchNumber || item.lotNumber || "LOT-HACCP-STD",
          harvestDate: item.harvestDate || item.manufacturingDate || null,
          items: [],
        };
      }
      map[pName].items.push(item);
    });

    return Object.values(map);
  }, [subOrders, items]);

  if (groupedProducts.length === 0) {
    return (
      <div className="p-4 text-center text-gray-400 italic font-bold">
        Aucun détail de produit disponible pour cette commande.
      </div>
    );
  }

  return (
    <div className="space-y-3 text-xs">
      {groupedProducts.map((sub, idx) => {
        const producerName = sub.producerName || sub.producer || "Exploitation Agricole";
        const dept = sub.department || sub.origin || "Local";
        const batchNum = sub.batchNumber || sub.lotNumber || "LOT-STD";
        const subItems = sub.items || sub.products || [];

        return (
          <div
            key={sub.id || idx}
            className="border border-gray-200 rounded-xl bg-white overflow-hidden shadow-2xs space-y-2 p-3"
          >
            {/* En-tête Producteur */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-150 pb-2 gap-1.5">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
                  <Store size={15} />
                </span>
                <div>
                  <h5 className="font-extrabold text-gray-900 text-xs">{producerName}</h5>
                  <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1">
                    <MapPin size={10} className="text-emerald-700" />
                    <span>Département : {dept}</span>
                  </span>
                </div>
              </div>

              {/* Traçabilité Sanitaire HACCP */}
              <div className="flex items-center gap-2 text-[10px]">
                {batchNum && (
                  <span className="bg-emerald-50 text-emerald-900 border border-emerald-200 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                    <Tag size={11} className="text-emerald-700" />
                    <span>N° Lot : {batchNum}</span>
                  </span>
                )}
                {sub.harvestDate && (
                  <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                    <Calendar size={11} />
                    <span>Récolté le : {new Date(sub.harvestDate).toLocaleDateString("fr-FR")}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Tableau des articles de ce producteur */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[9px] font-black uppercase text-gray-400 border-b border-gray-100">
                    <th className="pb-1.5">Produit</th>
                    <th className="pb-1.5 text-center">Quantité</th>
                    <th className="pb-1.5 text-right">Prix HT</th>
                    <th className="pb-1.5 text-right">Total HT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs font-semibold text-gray-800">
                  {subItems.map((prod, pIdx) => {
                    const priceHT = Number(prod.priceHT ?? prod.price ?? 0);
                    const qty = Number(prod.quantity ?? prod.qty ?? 1);
                    const lineTotal = priceHT * qty;
                    const unit = prod.unit || "kg";

                    return (
                      <tr key={prod.id || pIdx} className="hover:bg-gray-50/50">
                        <td className="py-2 pr-2">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-gray-900">{prod.title || prod.name}</span>
                            {prod.isBio && (
                              <span className="bg-amber-100 text-amber-900 font-black text-[8px] px-1.5 py-0.2 rounded uppercase">
                                Bio
                              </span>
                            )}
                            {prod.isAOP && (
                              <span className="bg-blue-100 text-blue-900 font-black text-[8px] px-1.5 py-0.2 rounded uppercase">
                                AOP
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2 px-2 text-center font-black text-gray-900">
                          {qty} {unit}
                        </td>
                        <td className="py-2 px-2 text-right text-gray-600 font-bold">
                          {priceHT.toFixed(2)} €
                        </td>
                        <td className="py-2 pl-2 text-right font-black text-emerald-800">
                          {lineTotal.toFixed(2)} € HT
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
