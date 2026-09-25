const fs = require('fs');
const path = require('path');

const directory = './frontend/src';

// Règles de remplacement (Ancien chemin -> Nouveau chemin)
const replacements = [
  { regex: /\/Shared\//g, replacement: '/shared/' },
  { regex: /\/Checkout\//g, replacement: '/checkout/' },
  { regex: /\/CheckoutOrchestrator/g, replacement: '/CheckoutOrchestrator' } // Ajustez la casse si nécessaire
];

function walkAndReplace(dir) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkAndReplace(fullPath);
    } else if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;
      
      replacements.forEach(({ regex, replacement }) => {
        if (regex.test(content)) {
          content = content.replace(regex, replacement);
          modified = true;
        }
      });

      if (modified) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`✅ Imports corrigés dans : ${fullPath}`);
      }
    }
  });
}

console.log('🚀 Lancement de la correction des imports...');
walkAndReplace(directory);
console.log('🎉 Terminé ! Démarrez votre serveur Vite pour vérifier.');