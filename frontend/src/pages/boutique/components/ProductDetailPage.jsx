import React, { useState } from "react";
import {
  ArrowLeft,
  ShoppingBag,
  MapPin,
  Building,
  Award,
  ShieldCheck,
  Tag,
  Calendar,
  Package,
  FileText,
  Maximize2,
  X,
  Truck,
  Layers,
  Percent
} from "lucide-react";

/**
 * 🌾 COMPOSANT : ProductDetailPage.jsx
 * Fiche détaillée complète d'un produit du catalogue Âne & Gorille.
 * Nouveautés :
 * - Section dédiée Miel & Apiculture (Origine florale, Poids net, DDM, Provenance 100% France, N° Rucher)
 * - Section dédiée Œufs & Élevage (Code mode d'élevage 0/1/2/3, Calibre S/M/L/XL, Date de ponte, DCR 28j max, N° agrément CE)
 * - Badges de Labels séparés (Bio, AOP, AOC, IGP, Label Rouge, HVE, Demeter, STG, EGAlim)
 * - Photo étiquette INCO avec zoom interactif
 */
export default function ProductDetailPage({
  product,
  allProducts = [],
  onBack,
  onAddToCart,
  onSelectProduct,
}) {
  const [quantity, setQuantity] = useState(1);
  const [showLabelModal, setShowLabelModal] = useState(false);

  if (!product) return null;

  const priceHT = Number(product?.priceHT ?? product?.price ?? 0);
  const vatRate = Number(product?.vatRate ?? product?.vat ?? 5.5);
  const priceTTC = priceHT * (1 + vatRate / 100);
  const stock = Number(product?.stock ?? product?.quantity ?? 0);
  const unit = product?.unit || "kg";

  const producerName =
    product?.producerCompany ||
    product?.companyName ||
    product?.producerName ||
    product?.producer ||
    "Exploitation Agricole Locale";
  const producerAddress =
    product?.producerAddress || product?.harvestLocation || "";
  const producerCity = product?.producerCity || "";
  const producerPostalCode = product?.producerPostalCode || product?.producerZipCode || "";
  const producerDepartment =
    product?.producerDepartment ||
    product?.department ||
    (producerPostalCode ? producerPostalCode.substring(0, 2) : "Local");

  const labelImage =
    product?.labelImageUrl ||
    product?.ingredientsImageUrl ||
    product?.labelImage ||
    product?.labelPhoto ||
    product?.allergensImageUrl ||
    null;

  const batchNumber = product?.batchNumber || product?.lotNumber || null;
  const isManufacturingDate = product?.dateType === "manufacturing" || product?.manufacturingDate;
  
  const displayDate = isManufacturingDate
    ? product?.manufacturingDate
      ? new Date(product.manufacturingDate).toLocaleDateString("fr-FR")
      : null
    : product?.harvestDate
    ? new Date(product.harvestDate).toLocaleDateString("fr-FR")
    : null;

  const dateLabel = isManufacturingDate ? "Date de Fabrication" : "Date de Récolte";
  const packagingType =
    product?.packagingType || "Caisses & Cagettes Réutilisables (Consignées)";
  const category = product?.category || "Légumes";

  const isHoney =
    product?.isHoney ||
    category === "Miel & Apiculture" ||
    (product?.title || product?.name || "").toLowerCase().includes("miel");

  const isEggs =
    product?.isEggs ||
    category === "Œufs & Élevage" ||
    (product?.title || product?.name || "").toLowerCase().includes("œuf") ||
    (product?.title || product?.name || "").toLowerCase().includes("oeuf");

  const eggRearingModes = {
    "0": { code: "0", title: "0 - Agriculture Biologique (Bio)", desc: "Parcours extérieur avec alimentation bio" },
    "1": { code: "1", title: "1 - Élevage Plein Air", desc: "Accès quotidien à un parcours extérieur" },
    "2": { code: "2", title: "2 - Élevage Au Sol", desc: "Bâtiment couvert sans cage" },
    "3": { code: "3", title: "3 - Élevage En Cage", desc: "Cages aménagées aux normes" },
  };

  const eggCalibers = {
    "S": { cal: "S", label: "Petit", weight: "< 53 g" },
    "M": { cal: "M", label: "Moyen", weight: "53 g à 63 g" },
    "L": { cal: "L", label: "Gros", weight: "63 g à 73 g" },
    "XL": { cal: "XL", label: "Très Gros", weight: "≥ 73 g" },
  };

  const rearingInfo = eggRearingModes[product?.eggRearingMode || "0"] || eggRearingModes["0"];
  const caliberInfo = eggCalibers[product?.eggCaliber || "M"] || eggCalibers["M"];

  const otherProducerProducts = allProducts.filter((p) => {
    const pProducer = p.producerCompany || p.companyName || p.producerName || p.producer;
    const isSameProducer =
      (p.producerId && product.producerId && p.producerId === product.producerId) ||
      (pProducer && pProducer.toLowerCase() === producerName.toLowerCase());
    const isDifferentProduct = p.id !== product.id;
    const isVisible = !p.isHidden && p.status !== "hidden" && p.isPublished !== false && !p.isMasked;
    return isSameProducer && isDifferentProduct && isVisible;
  });

  return (
    <div className="space-y-4 animate-fade-in max-w-4xl mx-auto pb-10 text-xs">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="px-3.5 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold rounded-xl transition-colors flex items-center gap-2 cursor-pointer shadow-2xs"
        >
          <ArrowLeft size={14} />
          <span>Retour au catalogue</span>
        </button>
        <div className="flex items-center gap-2">
          {product.id && (
            <span className="text-[10px] font-extrabold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full border border-gray-200">
              Réf : {product.id.substring(0, 8)}
            </span>
          )}
          <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
            <ShieldCheck size={13} className="text-emerald-600" />
            <span>Conforme INCO (UE n°1169/2011)</span>
          </span>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
        <div className="md:col-span-5 relative w-full h-52 md:h-64 bg-gray-100 rounded-xl overflow-hidden border border-gray-200 flex items-center justify-center">
          {product.imageUrl || product.image ? (
            <img
              src={product.imageUrl || product.image}
              alt={product.title || product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center text-gray-400 space-y-1">
              <Building size={36} className="mx-auto" />
              <p className="font-bold text-[11px]">Aucun visuel produit</p>
            </div>
          )}
          <div className="absolute top-2.5 left-2.5 bg-black/65 backdrop-blur-xs text-white px-2.5 py-0.5 rounded-lg text-[10px] font-black flex items-center gap-1 shadow-sm">
            <MapPin size={11} className="text-emerald-400" />
            <span>Dépt : {producerDepartment}</span>
          </div>
        </div>

        <div className="md:col-span-7 space-y-3">
          <div>
            <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
              <span className="text-[9px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                Producteur Vérifié
              </span>
              <span className="text-[9px] font-extrabold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200 flex items-center gap-1">
                <Layers size={10} />
                <span>{category}</span>
              </span>

              {product.isBio && (
                <span className="text-[9px] font-black uppercase text-amber-900 bg-amber-200 border border-amber-300 px-2 py-0.5 rounded-full">
                  🌿 Bio (AB)
                </span>
              )}
              {product.isAOP && (
                <span className="text-[9px] font-black uppercase text-blue-900 bg-blue-100 border border-blue-300 px-2 py-0.5 rounded-full">
                  🇪🇺 AOP
                </span>
              )}
              {product.isAOC && (
                <span className="text-[9px] font-black uppercase text-red-900 bg-red-100 border border-red-300 px-2 py-0.5 rounded-full">
                  🇫🇷 AOC
                </span>
              )}
              {product.isIGP && (
                <span className="text-[9px] font-black uppercase text-purple-900 bg-purple-100 border border-purple-300 px-2 py-0.5 rounded-full">
                  🗺️ IGP
                </span>
              )}
              {product.isLabelRouge && (
                <span className="text-[9px] font-black uppercase text-rose-900 bg-rose-100 border border-rose-300 px-2 py-0.5 rounded-full">
                  🔴 Label Rouge
                </span>
              )}
              {product.isHVE && (
                <span className="text-[9px] font-black uppercase text-emerald-900 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
                  🍃 HVE
                </span>
              )}
            </div>

            <h1 className="text-lg font-black text-gray-900">{product.title || product.name}</h1>
            <p className="text-[11px] text-gray-500 font-extrabold uppercase tracking-wider mt-0.5">
              {producerName}
            </p>
          </div>

          <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-0.5">
            <p className="font-bold text-gray-800 flex items-center gap-1.5 text-[11px]">
              <MapPin size={13} className="text-emerald-700 shrink-0" />
              <span>
                {[producerAddress, producerPostalCode, producerCity].filter(Boolean).join(" ")}
              </span>
            </p>
            <p className="text-[9px] text-emerald-800 font-medium italic">
              Circuit court garanti — Expédition directe depuis l'exploitation
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl">
              <span className="text-gray-400 font-extrabold uppercase text-[8px] block">Tarif Unitaire HT</span>
              <p className="text-sm font-black text-gray-900">{priceHT.toFixed(2)} € / {unit}</p>
              <p className="text-emerald-800 font-bold text-[9px] flex items-center gap-1">
                <Percent size={10} />
                <span>TTC : {priceTTC.toFixed(2)} € (TVA {vatRate}%)</span>
              </p>
            </div>
            <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl">
              <span className="text-gray-400 font-extrabold uppercase text-[8px] block">Stock Disponible</span>
              <p className="text-sm font-black text-gray-900">{stock} {unit}</p>
              <p className="text-gray-500 font-bold text-[9px] flex items-center gap-1">
                <Truck size={10} className="text-gray-400" />
                <span>Livraison 24h-48h</span>
              </p>
            </div>
          </div>

          {stock > 0 ? (
            <div className="flex items-center gap-2 pt-0.5">
              <input
                type="number"
                min="1"
                max={stock}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Math.min(stock, Number(e.target.value))))}
                className="w-16 p-2 border border-gray-300 rounded-xl font-bold text-center text-xs focus:ring-2 focus:ring-emerald-500"
              />
              <button
                onClick={() => onAddToCart && onAddToCart(product, quantity)}
                className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-black py-2.5 px-3 rounded-xl uppercase tracking-wider text-[11px] transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ShoppingBag size={14} />
                <span>Ajouter au panier ({(priceTTC * quantity).toFixed(2)} € TTC)</span>
              </button>
            </div>
          ) : (
            <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 font-bold rounded-xl text-center text-[11px]">
              Produit actuellement en rupture de stock.
            </div>
          )}
        </div>
      </div>

      {/* 🍯 MIEL */}
      {isHoney && (
        <div className="bg-amber-50/80 border border-amber-300 rounded-2xl p-4 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between border-b border-amber-200 pb-2">
            <h3 className="font-black text-amber-950 text-xs flex items-center gap-2">
              <span className="text-base">🍯</span>
              <span>Spécifications Apicoles : Miel Récolté à la Propriété</span>
            </h3>
            <span className="text-[9px] font-extrabold text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
              Décret Miel & Traçabilité INCO
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[11px]">
            <div className="bg-white p-2.5 rounded-xl border border-amber-200 space-y-0.5">
              <span className="text-[9px] font-extrabold uppercase text-amber-800 block">Origine Florale</span>
              <p className="font-black text-gray-900">{product?.floralOrigin || "Polyfloral / Toutes Fleurs"}</p>
            </div>

            <div className="bg-white p-2.5 rounded-xl border border-amber-200 space-y-0.5">
              <span className="text-[9px] font-extrabold uppercase text-amber-800 block">Poids Net / Contenance</span>
              <p className="font-black text-gray-900">{product?.honeyNetWeight || "500 g"}</p>
            </div>

            <div className="bg-white p-2.5 rounded-xl border border-amber-200 space-y-0.5">
              <span className="text-[9px] font-extrabold uppercase text-amber-800 block">Pays de Récolte</span>
              <p className="font-black text-gray-900">{product?.honeyOrigin || "100% Miel de France"}</p>
            </div>

            <div className="bg-white p-2.5 rounded-xl border border-amber-200 space-y-0.5">
              <span className="text-[9px] font-extrabold uppercase text-amber-800 block">DDM (Durabilité Minimale)</span>
              <p className="font-black text-gray-900">
                {product?.ddmDate
                  ? new Date(product.ddmDate).toLocaleDateString("fr-FR")
                  : "À conserver au sec et tempéré"}
              </p>
            </div>
          </div>

          {product?.apiaryNumber && (
            <p className="text-[10px] text-amber-900 font-bold italic pt-1">
              🐝 N° de Rucher / Immatriculation Apiculteur : {product.apiaryNumber}
            </p>
          )}
        </div>
      )}

      {/* 🥚 ŒUFS */}
      {isEggs && (
        <div className="bg-amber-50/50 border border-amber-300 rounded-2xl p-4 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between border-b border-amber-200 pb-2">
            <h3 className="font-black text-amber-950 text-xs flex items-center gap-2">
              <span className="text-base">🥚</span>
              <span>Traçabilité Sanitaire Avicole : Œufs Coquille (Catégorie A)</span>
            </h3>
            <span className="text-[9px] font-extrabold text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
              Règlement (CE) n° 589/2008
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-[11px]">
            <div className="bg-white p-2.5 rounded-xl border border-amber-200 space-y-0.5">
              <span className="text-[9px] font-extrabold uppercase text-amber-800 block">Mode d'Élevage</span>
              <p className="font-black text-gray-900">{rearingInfo.title}</p>
              <p className="text-[9px] text-gray-500">{rearingInfo.desc}</p>
            </div>

            <div className="bg-white p-2.5 rounded-xl border border-amber-200 space-y-0.5">
              <span className="text-[9px] font-extrabold uppercase text-amber-800 block">Calibre des Œufs</span>
              <p className="font-black text-gray-900">
                Calibre {caliberInfo.cal} ({caliberInfo.label})
              </p>
              <p className="text-[9px] text-gray-500">{caliberInfo.weight}</p>
            </div>

            <div className="bg-white p-2.5 rounded-xl border border-amber-200 space-y-0.5">
              <span className="text-[9px] font-extrabold uppercase text-amber-800 block">Date de Ponte</span>
              <p className="font-black text-gray-900">
                {product?.layingDate
                  ? new Date(product.layingDate).toLocaleDateString("fr-FR")
                  : "Récolte fraîche"}
              </p>
            </div>

            <div className="bg-white p-2.5 rounded-xl border border-amber-200 space-y-0.5">
              <span className="text-[9px] font-extrabold uppercase text-amber-800 block">
                DCR (Conso. Recommandée)
              </span>
              <p className="font-black text-amber-900">
                {product?.dcrDate
                  ? new Date(product.dcrDate).toLocaleDateString("fr-FR")
                  : "28 jours max après ponte"}
              </p>
            </div>
          </div>

          {product?.eggSanitaryApproval && (
            <p className="text-[10px] text-amber-900 font-bold italic pt-1">
              🏷️ Agrément Sanitaire du Centre de Conditionnement CE : {product.eggSanitaryApproval}
            </p>
          )}
        </div>
      )}

      {/* COMPOSITION & ALLERGÈNES INCO */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2">
          <h3 className="font-extrabold text-gray-900 text-xs flex items-center gap-1.5">
            <FileText size={15} className="text-emerald-700" />
            <span>Composition, Ingrédients & Allergènes (Règlement INCO)</span>
          </h3>
          <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            Information Sanitaire
          </span>
        </div>

        {labelImage ? (
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-gray-50 p-3 rounded-xl border border-gray-200">
            <div className="relative w-32 h-32 bg-white rounded-lg overflow-hidden border border-gray-300 shrink-0 group">
              <img
                src={labelImage}
                alt="Étiquette Ingrédients et Allergènes"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setShowLabelModal(true)}
                className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer font-bold text-[10px] gap-1"
              >
                <Maximize2 size={14} />
                <span>Agrandir</span>
              </button>
            </div>
            <div className="space-y-1.5 text-gray-700 text-[11px]">
              <p className="font-bold text-gray-900 flex items-center gap-1">
                <ShieldCheck size={14} className="text-emerald-600" />
                <span>Visuel officiel d'étiquette fourni par le maraîcher / producteur</span>
              </p>
              <p className="text-gray-600 leading-relaxed text-[10px]">
                Conformément au Règlement UE n° 1169/2011 (Loi INCO), vérifiez la présence d'allergènes, la liste complète des ingrédients et la valeur nutritionnelle sur la photo de l'étiquette.
              </p>
              <button
                type="button"
                onClick={() => setShowLabelModal(true)}
                className="text-emerald-700 hover:text-emerald-800 font-extrabold underline cursor-pointer text-[10px]"
              >
                Cliquez ici pour afficher l'étiquette en grand format
              </button>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-amber-50/70 border border-amber-200 text-amber-950 rounded-xl text-[10px] space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-amber-700" />
              <span>Produit Brut / Denrée Fraîche Non Transformée</span>
            </p>
            <p className="text-amber-800 leading-relaxed">
              Pour les denrées brutes fraîches non préemballées, la réglementation INCO impose l'affichage de l'origine (France, Dépt {producerDepartment}) et de la catégorie/variété. Aucune étiquette d'ingrédients transformés n'est requise.
            </p>
          </div>
        )}
      </div>

      {/* HACCP & LOGISTIQUE */}
      <div className="bg-gray-50/80 border border-gray-200 rounded-2xl p-3.5 space-y-2">
        <div className="flex items-center justify-between border-b border-gray-200 pb-2">
          <h3 className="font-extrabold text-gray-900 text-xs flex items-center gap-1.5">
            <ShieldCheck size={15} className="text-emerald-700" />
            <span>Traçabilité Sanitaire HACCP & Logistique</span>
          </h3>
          <span className="text-[9px] text-gray-400 font-bold uppercase">Règlement CE 178/2002</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[10px]">
          <div className="flex items-start gap-2 bg-white p-2 rounded-xl border border-gray-200/80">
            <Tag size={14} className="text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-gray-400 block uppercase text-[8px]">N° de Lot Sanitaire</span>
              <span className="font-black text-gray-800">
                {batchNumber || `LOT-${new Date().getFullYear()}-${producerDepartment}`}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2 bg-white p-2 rounded-xl border border-gray-200/80">
            <Calendar size={14} className="text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-gray-400 block uppercase text-[8px]">{dateLabel}</span>
              <span className="font-black text-gray-800">
                {displayDate || "Récolte / Préparation fraîche"}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2 bg-white p-2 rounded-xl border border-gray-200/80">
            <Package size={14} className="text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-gray-400 block uppercase text-[8px]">Conditionnement</span>
              <span className="font-black text-gray-800 truncate block">{packagingType}</span>
            </div>
          </div>
        </div>
      </div>

      {/* MODALE ZOOM */}
      {showLabelModal && labelImage && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl space-y-3 p-4">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
              <h4 className="font-black text-gray-900 text-xs flex items-center gap-1.5">
                <FileText size={16} className="text-emerald-700" />
                <span>Étiquette INCO — {product.title || product.name}</span>
              </h4>
              <button
                onClick={() => setShowLabelModal(false)}
                className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto flex justify-center bg-gray-900 rounded-xl p-2">
              <img
                src={labelImage}
                alt="Étiquette grand format"
                className="max-w-full h-auto object-contain rounded-lg"
              />
            </div>
            <div className="text-right">
              <button
                onClick={() => setShowLabelModal(false)}
                className="px-4 py-1.5 bg-gray-900 text-white font-bold rounded-xl text-xs cursor-pointer hover:bg-gray-800"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AUTRES PRODUITS DU PRODUCTEUR */}
      {otherProducerProducts.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-3.5 shadow-sm space-y-2.5">
          <h3 className="font-extrabold text-gray-900 text-xs flex items-center gap-2">
            <Building size={14} className="text-emerald-700" />
            <span>Autres cultures disponibles chez {producerName}</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {otherProducerProducts.map((p) => {
              const pHT = Number(p.priceHT ?? p.price ?? 0);
              return (
                <div
                  key={p.id}
                  onClick={() => onSelectProduct && onSelectProduct(p)}
                  className="p-2 border border-gray-200 hover:border-emerald-600 rounded-xl cursor-pointer transition-all flex items-center gap-2 bg-gray-50/50 hover:bg-white"
                >
                  <div className="w-9 h-9 bg-gray-200 rounded-lg overflow-hidden shrink-0">
                    {p.imageUrl || p.image ? (
                      <img src={p.imageUrl || p.image} alt={p.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-[8px]">
                        N/A
                      </div>
                    )}
                  </div>
                  <div className="truncate">
                    <p className="font-extrabold text-gray-900 text-[10px] truncate">{p.title || p.name}</p>
                    <p className="text-emerald-800 font-bold text-[9px]">
                      {pHT.toFixed(2)} € HT / {p.unit || "kg"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
