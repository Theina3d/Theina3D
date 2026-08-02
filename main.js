async function chargerBoutique() {
  const conteneur = document.getElementById('liste-produits');
  if (!conteneur) return;

  try {
    const reponse = await fetch('produits.json');
    const produits = await reponse.json();

    conteneur.innerHTML = produits.map(produit => {
      // Sécurisation des noms de clés
      const sku = produit.sku || produit.SKU || 'N/A';
      const nom = produit.nom_produit || produit.nom || 'Produit Sans Nom';
      const prixBrut = produit.prix_vente !== undefined ? produit.prix_vente : produit.prix;
      const prix = Number(prixBrut) ? Number(prixBrut).toFixed(2) : '0.00';
      const image = produit.image || 'CG/Logo.svg';
      const isBicolor = produit.bicolor == 1 || produit.bicolor === true;

      return `
        <div class="card carte-produit">
          <div class="image-wrapper" style="position: relative;">
            ${isBicolor ? '<span class="badge" style="position:absolute; top:10px; left:10px; background:#ffe0b2; color:#d84315; padding:4px 8px; border-radius:4px; font-size:0.8rem; font-weight:bold;">Bicolor</span>' : ''}
            <img src="${image}" alt="${nom}" onerror="this.src='CG/Logo.svg'" style="width:100%; height:200px; object-fit:cover; border-radius:8px;">
          </div>
          <div class="infos-produit" style="padding: 15px 0;">
            <small style="color:#777; font-weight:bold;">Réf: ${sku}</small>
            <h3 style="margin: 5px 0;">${nom}</h3>
            <div class="bas-carte" style="display:flex; justify-content:space-between; align-items:center; margin-top:15px;">
              <span class="prix" style="font-size:1.2rem; font-weight:bold; color:#4a148c;">${prix} €</span>
              <a href="projets.html" class="btn btn-primary">Commander</a>
            </div>
          </div>
        </div>
      `;
    }).join('');

  } catch (erreur) {
    console.error("Erreur de chargement des produits :", erreur);
    conteneur.innerHTML = "<p>Impossible de charger la boutique pour le moment.</p>";
  }
}

document.addEventListener('DOMContentLoaded', chargerBoutique);