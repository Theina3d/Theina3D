// Variable globale pour le panier
let panier = JSON.parse(localStorage.getItem('panierTheina3D')) || [];

// 1. CHARGEMENT ET AFFICHAGE DES PRODUITS
async function chargerBoutique() {
  const conteneur = document.getElementById('liste-produits');
  if (!conteneur) return; // Si la section n'existe pas sur la page, on arrête

  try {
    const reponse = await fetch('produits.json');
    const produits = await reponse.json();

    conteneur.innerHTML = produits.map(p => {
      const prixFormate = Number(p.prix).toFixed(2);
      return `
        <div class="card carte-produit">
          <div class="image-wrapper" style="position: relative;">
            <img src="${p.image}" alt="${p.nom}" onerror="this.src='CG/Logo.svg'" style="width:100%; height:200px; object-fit:cover; border-radius:8px;">
          </div>
          <div class="infos-produit" style="padding: 15px 0;">
            <small style="color:#777; font-weight:bold;">Réf: ${p.sku || 'N/A'}</small>
            <h3 style="margin: 5px 0;">${p.nom}</h3>
            <p style="font-size: 0.85rem; color: #666; margin-bottom: 10px;">${p.description_courte || ''}</p>
            <div class="bas-carte" style="display:flex; justify-content:space-between; align-items:center; margin-top:15px;">
              <span class="prix" style="font-size:1.2rem; font-weight:bold; color:#4a148c;">${prixFormate} €</span>
              <button class="btn btn-primary" onclick="ajouterAuPanier(${p.id}, '${p.nom.replace(/'/g, "\\'")}', ${p.prix}, '${p.image}')">
                Ajouter 🛒
              </button>
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

// 2. GESTION DU PANIER
function ajouterAuPanier(id, nom, prix, image) {
  const articleExistant = panier.find(item => item.id === id);

  if (articleExistant) {
    articleExistant.quantite += 1;
  } else {
    panier.push({ id, nom, prix: Number(prix), image, quantite: 1 });
  }

  enregistrerEtMettreAJour();
  alert(`"${nom}" a été ajouté à votre panier !`);
}

function modifierQuantite(id, delta) {
  const article = panier.find(item => item.id === id);
  if (!article) return;

  article.quantite += delta;
  if (article.quantite <= 0) {
    panier = panier.filter(item => item.id !== id);
  }

  enregistrerEtMettreAJour();
  afficherPanier(); // Rafraîchit l'affichage de la page/modale panier
}

function enregistrerEtMettreAJour() {
  localStorage.setItem('panierTheina3D', JSON.stringify(panier));
  mettreAJourBullePanier();
}

function mettreAJourBullePanier() {
  const compteur = document.getElementById('compteur-panier');
  if (compteur) {
    const totalArticles = panier.reduce((sum, item) => sum + item.quantite, 0);
    compteur.textContent = totalArticles;
  }
}

// 3. INITIALISATION
document.addEventListener('DOMContentLoaded', () => {
  chargerBoutique();
  mettreAJourBullePanier();
  afficherPanier();
});