// Fonction pour charger les produits depuis le fichier JSON
async function chargerBoutique() {
  const conteneur = document.getElementById('liste-produits');
  if (!conteneur) return; // Si on n'est pas sur la page boutique, on ne fait rien

  try {
    const reponse = await fetch('produits.json');
    const produits = await reponse.json();

    // Génération du HTML pour chaque produit de la base
    conteneur.innerHTML = produits.map(produit => `
      <div class="card carte-produit">
        <div class="image-wrapper" style="position: relative;">
          ${produit.bicolor ? '<span class="badge" style="position:absolute; top:10px; left:10px; background:#ffe0b2; color:#d84315; padding:4px 8px; border-radius:4px; font-size:0.8rem; font-weight:bold;">Bicolor</span>' : ''}
          <img src="${produit.image}" alt="${produit.nom_produit}" onerror="this.src='CG/Logo.svg'" style="width:100%; height:200px; object-fit:cover; border-radius:8px;">
        </div>
        <div class="infos-produit" style="padding: 15px 0;">
          <small style="color:#777; font-weight:bold;">Réf: ${produit.sku}</small>
          <h3 style="margin: 5px 0;">${produit.nom_produit}</h3>
          <div class="bas-carte" style="display:flex; justify-content:space-between; align-items:center; margin-top:15px;">
            <span class="prix" style="font-size:1.2rem; font-weight:bold; color:#4a148c;">${Number(produit.prix_vente).toFixed(2)} €</span>
            <a href="projets.html" class="btn btn-primary">Commander</a>
          </div>
        </div>
      </div>
    `).join('');

  } catch (erreur) {
    console.error("Erreur de chargement des produits :", erreur);
    conteneur.innerHTML = "<p>Impossible de charger la boutique pour le moment.</p>";
  }
}

// Lancement automatique au chargement de la page
document.addEventListener('DOMContentLoaded', chargerBoutique);