// ÉTAT GLOBAL DE LA BOUTIQUE
let donneesBoutique = { filaments_disponibles: [], produits: [] };
let panier = JSON.parse(localStorage.getItem('panierTheina3D')) || [];

// INITIALISATION
document.addEventListener('DOMContentLoaded', () => {
  chargerBoutique();
  rafraichirPanierUI();
});

// 1. CHARGEMENT DE PRODUITS.JSON
async function chargerBoutique() {
  const conteneur = document.getElementById('liste-produits');
  if (!conteneur) return;

  try {
    const reponse = await fetch('produits.json');
    donneesBoutique = await reponse.json();
    afficherProduits(donneesBoutique.produits);
  } catch (erreur) {
    console.error("Erreur de chargement des données :", erreur);
    conteneur.innerHTML = `<p style="text-align:center; color:#c62828;">Impossible de charger le catalogue. Pense à lancer 'python export_excel.py'.</p>`;
  }
}

// 2. AFFICHAGE DE LA GRILLE DES PRODUITS
function afficherProduits(produits) {
  const conteneur = document.getElementById('liste-produits');
  if (!conteneur) return;

  conteneur.innerHTML = produits.map(p => {
    const prixFormate = Number(p.prix).toFixed(2);
    
    const badgeAsso = p.don_asso 
      ? `<span class="badge-asso">🎗️ 50% pour l'asso</span>` 
      : '';

    const badgeBicolor = p.bicolor 
      ? `<span class="badge-bicolor">🧩 Multi-pièces</span>` 
      : '';

    return `
      <div class="carte-produit">
        <div class="image-wrapper" onclick="ouvrirModale(${p.id})">
          ${badgeAsso}
          ${badgeBicolor}
          <img src="${p.image}" alt="${p.nom}" onerror="this.src='CG/Logo.svg'">
        </div>
        <div class="infos-produit">
          <h3 onclick="ouvrirModale(${p.id})">${p.nom}</h3>
          <p class="description-courte">${p.description_courte || ''}</p>
          <div class="bas-carte">
            <span class="prix">${prixFormate} €</span>
            <button class="btn btn-secondaire" onclick="ouvrirModale(${p.id})">👁️ Aperçu</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// 3. MODALE VISUALISATION ET PERSONNALISATION
function ouvrirModale(idProduit) {
  const p = donneesBoutique.produits.find(item => item.id === idProduit);
  if (!p) return;

  // Options de couleur depuis le stock global de filaments
  const optionsCouleurs = (donneesBoutique.filaments_disponibles || []).map(f => {
    if (f.en_stock) {
      return `<option value="${f.nom}">${f.nom} (${f.matiere})</option>`;
    } else {
      return `<option value="${f.nom}" disabled>${f.nom} — Rupture</option>`;
    }
  }).join('');

  const blocAsso = p.don_asso ? `
    <div class="encadre-asso">
      <span>🎗️</span>
      <p><strong>Produit Solidaire :</strong> 50% des bénéfices générés par cet article sont reversés à notre association partenaire.</p>
    </div>
  ` : '';

  const blocBicolor = p.bicolor ? `
    <p class="note-bicolor">🧩 Cet objet est un assemblage de plusieurs pièces imprimées séparément.</p>
  ` : '';

  const modaleHTML = `
    <div id="modale-produit" class="modale-overlay">
      <div class="modale-contenu">
        <button class="btn-fermer" onclick="fermerModale()">✖</button>
        
        <div class="modale-grille">
          <div class="modale-col-image">
            <img src="${p.image}" alt="${p.nom}" onerror="this.src='CG/Logo.svg'">
            ${blocBicolor}
          </div>
          
          <div class="modale-col-infos">
            <h2>${p.nom}</h2>
            <p class="prix-modale">${Number(p.prix).toFixed(2)} €</p>
            
            ${blocAsso}

            <p class="description-longue">${p.description_longue || p.description_courte || ''}</p>
            
            <div class="champ-choix" style="margin: 15px 0;">
              <label for="choix-couleur" style="font-weight:bold; display:block; margin-bottom:5px;">Couleur du filament :</label>
              <select id="choix-couleur" style="width:100%; padding:8px; border-radius:6px; border:1px solid #ccc;">
                ${optionsCouleurs}
              </select>
            </div>

            <button class="btn btn-primaire" style="width:100%; padding:10px;" onclick="ajouterAuPanierDepuisModale(${p.id})">
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
  const m = document.getElementById('modale-produit');
  if (m) m.remove();
}

function ajouterAuPanierDepuisModale(idProduit) {
  const p = donneesBoutique.produits.find(item => item.id === idProduit);
  if (!p) return;

  const couleurSelect = document.getElementById('choix-couleur').value;
  const indexExistant = panier.findIndex(item => item.id === idProduit && item.couleur === couleurSelect);

  if (indexExistant > -1) {
    panier[indexExistant].quantite += 1;
  } else {
    panier.push({
      id: p.id,
      sku: p.sku,
      nom: p.nom,
      prix: Number(p.prix),
      image: p.image,
      couleur: couleurSelect,
      quantite: 1
    });
  }

  sauvegarderPanier();
  fermerModale();
  ouvrirTiroirPanier();
}

// 4. GESTION ET MISE À JOUR DU PANIER
function modifierQuantite(index, changement) {
  panier[index].quantite += changement;
  if (panier[index].quantite <= 0) {
    panier.splice(index, 1);
  }
  sauvegarderPanier();
}

function supprimerArticle(index) {
  panier.splice(index, 1);
  sauvegarderPanier();
}

function sauvegarderPanier() {
  localStorage.setItem('panierTheina3D', JSON.stringify(panier));
  rafraichirPanierUI();
}

function rafraichirPanierUI() {
  const compteurs = document.querySelectorAll('.compteur-panier');
  const totalArticles = panier.reduce((sum, item) => sum + item.quantite, 0);
  compteurs.forEach(c => c.textContent = totalArticles);

  const conteneurArticles = document.getElementById('panier-liste-articles');
  if (conteneurArticles) {
    if (panier.length === 0) {
      conteneurArticles.innerHTML = `<p style="text-align:center; padding:20px; color:#888;">Votre panier est vide 🛒</p>`;
    } else {
      conteneurArticles.innerHTML = panier.map((item, index) => `
        <div class="ligne-panier">
          <img src="${item.image}" alt="${item.nom}" onerror="this.src='CG/Logo.svg'">
          <div class="details-ligne" style="flex:1;">
            <h4 style="margin:0 0 3px 0;">${item.nom}</h4>
            <p style="margin:0; font-size:0.8rem; color:#666;">Couleur: <strong>${item.couleur}</strong></p>
            <p style="margin:2px 0 0 0; font-weight:bold; color:#4a148c;">${item.prix.toFixed(2)} €</p>
          </div>
          <div class="qte-controle" style="display:flex; align-items:center; gap:5px;">
            <button onclick="modifierQuantite(${index}, -1)">-</button>
            <span>${item.quantite}</span>
            <button onclick="modifierQuantite(${index}, 1)">+</button>
          </div>
          <button class="btn-supprimer" onclick="supprimerArticle(${index})" style="background:none; border:none; cursor:pointer; font-size:1.1rem; margin-left:10px;">🗑️</button>
        </div>
      `).join('');
    }
  }

  calculerEtAfficherTotalPanier();
}

function calculerEtAfficherTotalPanier() {
  const affichageTotal = document.getElementById('panier-total-prix');
  if (!affichageTotal) return;

  const totalSousTotal = panier.reduce((sum, item) => sum + (item.prix * item.quantite), 0);
  const optionLivraison = document.querySelector('input[name="livraison"]:checked');
  const fraisLivraison = parseFloat(optionLivraison ? optionLivraison.value : 3.90);

  const totalFinal = totalSousTotal + (panier.length > 0 ? fraisLivraison : 0);
  affichageTotal.textContent = `${totalFinal.toFixed(2)} €`;
}

function ouvrirTiroirPanier() {
  const tiroir = document.getElementById('tiroir-panier');
  if (tiroir) tiroir.classList.add('actif');
}

function fermerTiroirPanier() {
  const tiroir = document.getElementById('tiroir-panier');
  if (tiroir) tiroir.classList.remove('actif');
}