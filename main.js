let donneesBoutique = { filaments_disponibles: [], produits: [] };
let panier = JSON.parse(localStorage.getItem('panierTheina3D')) || [];

document.addEventListener('DOMContentLoaded', () => {
    chargerProduitsDepuisJSON();
    rafraichirPanierUI();

    // Gestion de l'ouverture/fermeture du panier au clic
    const btnPanier = document.querySelector('.btn-panier-header') || document.getElementById('btn-panier');
    if (btnPanier) {
        btnPanier.addEventListener('click', (e) => {
            e.preventDefault();
            ouvrirTiroirPanier();
        });
    }
});

// 1. CHARGEMENT DES PRODUITS (produits.json)
async function chargerProduitsDepuisJSON() {
    const conteneur = document.getElementById('liste-produits') || document.querySelector('.grille-produits');
    if (!conteneur) return;

    try {
        const reponse = await fetch('produits.json');
        if (!reponse.ok) throw new Error("Fichier produits.json introuvable");
        
        donneesBoutique = await reponse.json();
        afficherProduits(donneesBoutique.produits);
    } catch (erreur) {
        console.error("Erreur de chargement :", erreur);
        conteneur.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #d32f2f;">
                <p><strong>Impossible de charger le catalogue.</strong></p>
                <small>Assure-toi d'avoir exécuté <code>python export_excel.py</code> dans ton terminal.</small>
            </div>
        `;
    }
}

// 2. AFFICHAGE DES CARTES PRODUITS
function afficherProduits(produits) {
    const conteneur = document.getElementById('liste-produits') || document.querySelector('.grille-produits');
    if (!conteneur) return;

    if (!produits || produits.length === 0) {
        conteneur.innerHTML = `<p style="grid-column: 1/-1; text-align: center;">Aucun produit trouvé dans Excel.</p>`;
        return;
    }

    conteneur.innerHTML = produits.map(p => `
        <div class="carte-produit">
            <div class="image-wrapper" onclick="ouvrirModale(${p.id})">
                ${p.don_asso ? `<span class="badge-asso">🎗️ 50% Asso</span>` : ''}
                ${p.bicolor ? `<span class="badge-bicolor">🧩 Multi-pièces</span>` : ''}
                <img src="${p.image}" alt="${p.nom}" onerror="this.src='CG/Logo.svg'">
            </div>
            <div class="infos-produit">
                <h3 onclick="ouvrirModale(${p.id})">${p.nom}</h3>
                <p class="description-courte">${p.description_courte || ''}</p>
                <div class="bas-carte">
                    <span class="prix">${Number(p.prix).toFixed(2)} €</span>
                    <button class="btn btn-secondaire" onclick="ouvrirModale(${p.id})">👁️ Aperçu</button>
                </div>
            </div>
        </div>
    `).join('');
}

// 3. APERÇU / MODALE PRODUIT
function ouvrirModale(idProduit) {
    fermerModale(); // Ferme toute modale déjà ouverte

    const p = donneesBoutique.produits.find(item => item.id === idProduit);
    if (!p) return;

    const filaments = donneesBoutique.filaments_disponibles || [];
    const optionsCouleurs = filaments.length > 0 
        ? filaments.map(f => `<option value="${f.nom}">${f.nom} (${f.matiere})</option>`).join('')
        : `<option value="Violet Pasteur">Violet Pasteur (PLA)</option><option value="Noir Profond">Noir Profond (PLA)</option>`;

    const modaleHTML = `
        <div id="modale-produit" class="modale-overlay" onclick="siClicExterieurFermer(event)">
            <div class="modale-contenu">
                <button class="btn-fermer" onclick="fermerModale()">✖</button>
                <div class="modale-grille">
                    <div class="modale-col-image">
                        <img src="${p.image}" alt="${p.nom}" onerror="this.src='CG/Logo.svg'">
                    </div>
                    <div class="modale-col-infos">
                        <h2>${p.nom}</h2>
                        <p class="prix-modale">${Number(p.prix).toFixed(2)} €</p>
                        ${p.don_asso ? `<div class="encadre-asso"><span>🎗️</span><p>Produit Solidaire : 50% des bénéfices reversés.</p></div>` : ''}
                        <p style="margin: 10px 0; color: var(--texte-doux);">${p.description_longue || 'Fabriqué à la commande avec du filament de haute qualité.'}</p>
                        
                        <div style="margin: 15px 0;">
                            <label style="font-weight:bold; display:block; margin-bottom:5px;">Choix de la couleur :</label>
                            <select id="choix-couleur" style="width:100%; padding:10px; border-radius:8px; border:1px solid #ccc; font-size:0.95rem;">
                                ${optionsCouleurs}
                            </select>
                        </div>
                        
                        <button class="btn btn-primary" style="width:100%;" onclick="ajouterAuPanierDepuisModale(${p.id})">Ajouter au panier 🛒</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modaleHTML);
}

function siClicExterieurFermer(e) {
    if (e.target.classList.contains('modale-overlay')) {
        fermerModale();
    }
}

function fermerModale() {
    const m = document.getElementById('modale-produit');
    if (m) m.remove();
}

// 4. GESTION DU PANIER
function ajouterAuPanierDepuisModale(idProduit) {
    const p = donneesBoutique.produits.find(item => item.id === idProduit);
    if (!p) return;

    const couleurSelect = document.getElementById('choix-couleur') ? document.getElementById('choix-couleur').value : 'Défaut';
    const indexExistant = panier.findIndex(item => item.id === idProduit && item.couleur === couleurSelect);

    if (indexExistant > -1) {
        panier[indexExistant].quantite += 1;
    } else {
        panier.push({ 
            id: p.id, 
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

function viderLePanier() {
    if (panier.length === 0) return;
    if (confirm("Es-tu sûr(e) de vouloir vider tout ton panier ?")) {
        panier = [];
        sauvegarderPanier();
    }
}

function sauvegarderPanier() {
    localStorage.setItem('panierTheina3D', JSON.stringify(panier));
    rafraichirPanierUI();
}

function rafraichirPanierUI() {
    // Mettre à jour tous les badges de compteur du panier
    const compteurs = document.querySelectorAll('.compteur-panier, #panier-compteur, .badge-panier');
    const totalArticles = panier.reduce((sum, item) => sum + item.quantite, 0);
    compteurs.forEach(c => c.textContent = totalArticles);

    // Mettre à jour la liste des articles dans le tiroir
    const conteneurArticles = document.getElementById('panier-liste-articles');
    if (conteneurArticles) {
        if (panier.length === 0) {
            conteneurArticles.innerHTML = `<p style="text-align:center; padding:40px 10px; color: var(--texte-doux);">Votre panier est vide 🛒</p>`;
        } else {
            conteneurArticles.innerHTML = panier.map((item, index) => `
                <div class="ligne-panier">
                    <img src="${item.image}" alt="${item.nom}" onerror="this.src='CG/Logo.svg'">
                    <div style="flex:1;">
                        <h4 style="margin:0; font-size:0.95rem; color: var(--texte-sombre);">${item.nom}</h4>
                        <p style="margin:2px 0; font-size:0.8rem; color: var(--texte-doux);">Couleur: <strong>${item.couleur}</strong></p>
                        <p style="margin:0; font-weight:bold; color: var(--violet-principal);">${(item.prix * item.quantite).toFixed(2)} €</p>
                    </div>
                    <div style="display:flex; align-items:center; gap:6px;">
                        <button class="btn-secondaire" style="padding:2px 8px;" onclick="modifierQuantite(${index}, -1)">-</button>
                        <span style="font-weight:bold; font-size:0.9rem;">${item.quantite}</span>
                        <button class="btn-secondaire" style="padding:2px 8px;" onclick="modifierQuantite(${index}, 1)">+</button>
                    </div>
                    <button onclick="supprimerArticle(${index})" style="background:none; border:none; cursor:pointer; font-size:1.1rem; margin-left:8px;" title="Supprimer">🗑️</button>
                </div>
            `).join('');
        }
    }

    // Calcul du prix total
    const affichageTotal = document.getElementById('panier-total-prix');
    if (affichageTotal) {
        const total = panier.reduce((sum, item) => sum + (item.prix * item.quantite), 0);
        affichageTotal.textContent = `${total.toFixed(2)} €`;
    }
}

// Ouvrir / Fermer le tiroir du panier
function ouvrirTiroirPanier() {
    const tiroir = document.getElementById('tiroir-panier');
    if (tiroir) tiroir.classList.add('actif');
}

function fermerTiroirPanier() {
    const tiroir = document.getElementById('tiroir-panier');
    if (tiroir) tiroir.classList.remove('actif');
}