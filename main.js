document.addEventListener('DOMContentLoaded', () => {
  chargerProduits();
});

async function chargerProduits() {
  const conteneur = document.getElementById('liste-produits');
  if (!conteneur) return;

  try {
    const response = await fetch('produits.json');
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const produits = await response.json();
    conteneur.innerHTML = ''; // Nettoie le conteneur

    produits.forEach(produit => {
      const carte = document.createElement('div');
      carte.className = 'carte-produit';
      
      carte.innerHTML = `
        <div class="image-wrapper">
          <img src="${produit.image}" alt="${produit.nom}" loading="lazy">
        </div>
        <div class="infos-produit">
          <h3>${produit.nom}</h3>
          <p class="description">${produit.description || ''}</p>
          <div class="bas-carte">
            <span class="prix">${produit.prix} €</span>
            <button class="btn-ajouter">Voir le produit</button>
          </div>
        </div>
      `;
      
      conteneur.appendChild(carte);
    });
  } catch (erreur) {
    console.error('Erreur lors du chargement des produits :', erreur);
    conteneur.innerHTML = '<p class="erreur-chargement">Impossible de charger les produits pour le moment.</p>';
  }
}