// Variable globale pour le panier
let panier = JSON.parse(localStorage.getItem('panierTheina3D')) || [];
let tousLesProduits = [];

// 1. CHARGEMENT ET AFFICHAGE DES PRODUITS
async function chargerBoutique() {
  const conteneur = document.getElementById('liste-produits');
  if (!conteneur) return;

  try {
    const reponse = await fetch('produits.json');
    tousLesProduits = await reponse.json();

    conteneur.innerHTML = tousLesProduits.map(p => {
      const prixFormate = Number(p.prix).toFixed(2);
      return `
        <div class="card carte-produit">
          <div class="image-wrapper" style="position: relative; cursor: pointer;" onclick="ouvrirModale(${p.id})">
            <img src="${p.image}" alt="${p.nom}" onerror="this.src='CG/Logo.svg'" style="width:100%; height:200px; object-fit:cover; border-radius:8px;">
          </div>
          <div class="infos-produit" style="padding: 15px 0;">
            <h3 style="margin: 5px 0; cursor: pointer;" onclick="ouvrirModale(${p.id})">${p.nom}</h3>
            <p style="font-size: 0.85rem; color: #666; margin-bottom: 10px;">${p.description_courte || ''}</p>
            
            <div class="bas-carte" style="display:flex; justify-content:space-between; align-items:center; margin-top:15px;">
              <span class="prix" style="font-size:1.2rem; font-weight:bold; color:#4a148c;">${prixFormate} €</span>
              <button class="btn btn-secondary" onclick="ouvrirModale(${p.id})" style="padding:6px 12px; margin-right:5px;">👁️ Aperçu</button>
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

// 2. MODALE DÉTAILS PRODUIT
function ouvrirModale(id) {
  const p = tousLesProduits.find(item => item.id === id);
  if (!p) return;

  // Création dynamique des options de couleur
  const couleurs = p.couleurs_disponibles || ['Violet', 'Noir', 'Blanc', 'Gris'];
  const optionsCouleurs = couleurs.map(c => `<option value="${c}">${c}</option>`).join('');

  // Injection du HTML de la modale
  const modaleHTML = `
    <div id="modale-produit" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); display:flex; justify-content:center; align-items:center; z-index:1000; padding:20px;">
      <div style="background:white; border-radius:12px; max-width:600px; width:100%; max-height:90vh; overflow-y:auto; padding:25px; position:relative; box-shadow:0 10px 25px rgba(0,0,0,0.2);">
        
        <button onclick="fermerModale()" style="position:absolute; top:15px; right:15px; background:none; border:none; font-size:1.5rem; cursor:pointer;">✖</button>
        
        <div style="display:flex; gap:20px; flex-wrap:wrap;">
          <div style="flex:1; min-width:200px;">
            <img id="image-principale-modale" src="${p.image}" alt="${p.nom}" style="width:100%; height:220px; object-fit:cover; border-radius:8px;" onerror="this.src='CG/Logo.svg'">
          </div>
          
          <div style="flex:1.2; min-width:220px;">
            <h2 style="margin-top:0;">${p.nom}</h2>
            <p style="font-size:1.3rem; font-weight:bold; color:#4a148c; margin:10px 0;">${Number(p.prix).toFixed(2)} €</p>
            <p style="color:#555; font-size:0.9rem; line-height:1.4;">${p.description_longue || p.description_courte || ''}</p>
            
            <div style="margin: 15px 0;">
              <label for="choix-couleur" style="font-weight:bold; display:block; margin-bottom:5px;">Couleur :</label>
              <select id="choix-couleur" style="width:100%; padding:8px; border-radius:6px; border:1px solid #ccc;">
                ${optionsCouleurs}
              </select>
            </div>

            <button class="btn btn-primary" style="width:100%; padding:10px; margin-top:10px;" onclick="ajouterAuPanierDepuisModale(${p.id}, '${p.nom.replace(/'/g, "\\'")}', ${p.prix}, '${p.image}')">
              Ajouter au panier 🛒
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modaleHTML);
}

function fermerModale() {
  const modale = document.getElementById('modale-produit');
  if (modale) modale.remove();
}

function ajouterAuPanierDepuisModale(id, nom, prix, image) {
  const couleurChoisie = document.getElementById('choix-couleur')?.value || 'Défaut';
  ajouterAuPanier(id, nom, prix, image, couleurChoisie);
  fermerModale();
}

// 3. GESTION DU PANIER
function ajouterAuPanier(id, nom, prix, image, couleur = 'Défaut') {
  // On différencie les articles par ID ET par Couleur
  const articleExistant = panier.find(item => item.id === id && item.couleur === couleur);

  if (articleExistant) {
    articleExistant.quantite += 1;
  } else {
    panier.push({ id, nom, prix: Number(prix), image, couleur, quantite: 1 });
  }

  enregistrerEtMettreAJour();
  alert(`"${nom}" (${couleur}) ajouté au panier !`);
}

function modifierQuantite(id, couleur, delta) {
  const article = panier.find(item => item.id === id && item.couleur === couleur);
  if (!article) return;

  article.quantite += delta;
  if (article.quantite <= 0) {
    panier = panier.filter(item => !(item.id === id && item.couleur === couleur));
  }

  enregistrerEtMettreAJour();
  if (typeof afficherPanier === 'function') afficherPanier();
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

document.addEventListener('DOMContentLoaded', () => {
  chargerBoutique();
  mettreAJourBullePanier();
});