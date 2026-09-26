export const DEFAULT_MAPPING = {
  title: ['titre', 'nom', 'produit', 'title', 'name', 'designation'],
  price: ['prix', 'prix_ht', 'price', 'tarif', 'prix ht'],
  unit: ['unite', 'unit', 'conditionnement'],
  stock: ['stock', 'quantite', 'qty'],
  minStock: ['minstock', 'stock_min', 'seuil_min', 'min_stock'],
  tvaRate: ['tva', 'taux_tva', 'tva_rate', 'vat'],
  universe: ['univers', 'categorie', 'universe', 'category'],
  origin: ['origine', 'origin', 'provenance'],
  description: ['description', 'details']
};

export function autoDetectMapping(csvHeaders) {
  const mapping = {};
  const normalizedHeaders = csvHeaders.map(h => h.trim().toLowerCase());

  Object.entries(DEFAULT_MAPPING).forEach(([field, aliases]) => {
    const matchIndex = normalizedHeaders.findIndex(h => aliases.includes(h));
    if (matchIndex !== -1) {
      mapping[field] = csvHeaders[matchIndex];
    } else {
      mapping[field] = '';
    }
  });

  return mapping;
}

export function parseCsvText(csvText) {
  const lines = csvText.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length < 2) {
    throw new Error("Le fichier CSV doit contenir au moins une ligne d'en-tête et une ligne de données.");
  }

  const separator = lines[0].includes(';') ? ';' : ',';
  const headers = lines[0].split(separator).map(h => h.trim().replace(/^["']|["']$/g, ''));
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const rawValues = lines[i].split(separator).map(v => v.trim().replace(/^["']|["']$/g, ''));
    if (rawValues.length === headers.length || rawValues.some(v => v.length > 0)) {
      const rowObject = {};
      headers.forEach((header, idx) => {
        rowObject[header] = rawValues[idx] || '';
      });
      rows.push(rowObject);
    }
  }

  return { headers, rows };
}

export function validateAndTransformRow(rawRow, mapping, vendorUid) {
  const errors = [];

  const rawTitle = rawRow[mapping.title] || '';
  const title = rawTitle.trim();
  if (!title) {
    errors.push("Titre/Nom du produit obligatoire");
  }

  const rawPrice = (rawRow[mapping.price] || '').replace(',', '.');
  const price = parseFloat(rawPrice);
  if (isNaN(price) || price < 0) {
    errors.push("Prix HT invalide (doit être un nombre positif)");
  }

  let unit = (rawRow[mapping.unit] || 'kg').toLowerCase().trim();
  const validUnits = ['kg', 'pièce', 'piece', 'botte', 'cagette', 'lot'];
  if (!validUnits.includes(unit)) {
    unit = 'kg';
  }

  const rawStock = rawRow[mapping.stock] || '0';
  const stock = parseInt(rawStock, 10);
  const validStock = isNaN(stock) || stock < 0 ? 0 : stock;

  const rawMinStock = rawRow[mapping.minStock] || '5';
  const minStock = parseInt(rawMinStock, 10);
  const validMinStock = isNaN(minStock) || minStock < 0 ? 5 : minStock;

  let rawTva = (rawRow[mapping.tvaRate] || '').replace(',', '.').replace('%', '');
  let tvaRate = 0.055;
  if (rawTva === '20' || rawTva === '0.2' || rawTva === '0.20') {
    tvaRate = 0.20;
  }

  let universe = (rawRow[mapping.universe] || 'ANE').toUpperCase().trim();
  if (universe.includes('GORILLE') || universe.includes('ARTISAN')) {
    universe = 'GORILLE';
    if (!rawTva) tvaRate = 0.20;
  } else {
    universe = 'ANE';
  }

  const origin = (rawRow[mapping.origin] || '28350 Saint-Rémy-sur-Avre').trim();
  const description = (rawRow[mapping.description] || '').trim();

  return {
    isValid: errors.length === 0,
    errors,
    data: {
      title,
      name: title,
      price: price || 0,
      unit,
      stock: validStock,
      minStock: validMinStock,
      tvaRate,
      universe,
      origin,
      description,
      vendorUid,
      isActive: true,
      importedViaCsv: true,
      createdAt: new Date().toISOString()
    }
  };
}
