// --- PALETTE DE FILAMENTS COMMUNE ---
const PALETTE_FILAMENTS = [
    { code: "PLA-VIOLET-PRINCIPAL", nom: "Violet Principal", matiere: "PLA", suffixe: "_violet" },
    { code: "PLA-VIOLET-PASTEL",    nom: "Violet Pastel",    matiere: "PLA", suffixe: "_pastel" },
    { code: "PLA-ORANGE-PEPS",     nom: "Orange Peps",      matiere: "PLA", suffixe: "_orange" },
    { code: "PLA-NOIR",            nom: "Noir Intense",     matiere: "PLA", suffixe: "_noir" }
];

document.addEventListener('DOMContentLoaded', () => {
    const grille = document.getElementById('grille-produits');
    if (!grille) return; // Uniquement exécuté sur la page boutique

    let tousLesProduits = [];

    // 1. Récupération des données depuis produits.json
    fetch('produits.json')
        .then(response => response.json())
        .then(produits => {
            tousLesProduits = produits;
            afficherProduits(tousLesProduits);
        })
        .catch(error => {
            console.error('Erreur chargement catalogue :', error);
            grille.innerHTML = '<p class="text-center">Impossible de charger les produits pour le moment.</p>';
        });

    // 2. Génération des cartes produits
    function afficherProduits(liste) {
        grille.innerHTML = '';
        liste.forEach(item => {
            const carte = document.createElement('article');
            carte.className = 'card text-center';
            carte.style.display = 'flex';
            carte.style.flexDirection = 'column';
            carte.style.justify = 'space-between';

            // Options de couleurs pour le menu déroulant
            let optionsCouleursHtml = PALETTE_FILAMENTS.map(f => 
                `<option value="${f.matiere} - ${f.nom}" data-suffixe="${f.suffixe}">${f.matiere} — ${f.nom}</option>`
            ).join('');

            carte.innerHTML = `
                <div>
                    <img id="img-${item.id}" src="${item.image_base}" alt="${item.nom}" 
                         style="width:100%; height:180px; object-fit:contain; border-radius:12px; margin-bottom:15px;" 
                         onerror="this.src='Logo_complet_initial.png'">
                    
                    <span class="badge-tag" style="font-size:0.75rem;">${item.categorie}</span>
                    <h3 style="font-size:1.2rem; margin: 10px 0;">${item.nom}</h3>
                    <p style="font-size:0.85rem; color:var(--texte-doux); margin-bottom:15px;">${item.description}</p>
                </div>

                <div>
                    <div style="margin-bottom: 12px; text-align: left;">
                        <label style="font-size:0.8rem; font-weight:600; color:var(--violet-fonce);">Couleur & Matière :</label>
                        <select id="select-${item.id}" 
                                onchange="mettreAJourSelection('${item.id}', '${item.image_base}')" 
                                style="width:100%; padding:8px; border-radius:8px; border:1px solid #ddd; margin-top:4px; font-size:0.85rem;">
                            ${optionsCouleursHtml}
                        </select>
                    </div>

                    <p style="font-size:1.3rem; font-weight:bold; color:var(--orange-peps); margin-bottom:12px;">${item.prix.toFixed(2)} €</p>

                    <button class="snipcart-add-item btn btn-primary" style="width:100%;"
                        id="btn-snipcart-${item.id}"
                        data-item-id="${item.id}"
                        data-item-price="${item.prix}"
                        data-item-url="boutique.html"
                        data-item-description="${item.description}"
                        data-item-image="${item.image_base}"
                        data-item-name="${item.nom}"
                        data-item-custom1-name="Couleurs"
                        data-item-custom1-value="${PALETTE_FILAMENTS[0].matiere} - ${PALETTE_FILAMENTS[0].nom}">
                        🛒 Ajouter au panier
                    </button>
                </div>
            `;
            grille.appendChild(carte);
        });
    }

    // 3. Gestion des filtres de catégories
    const boutonsFiltre = document.querySelectorAll('.btn-filtre');
    boutonsFiltre.forEach(btn => {
        btn.addEventListener('click', () => {
            boutonsFiltre.forEach(b => {
                b.classList.remove('btn-primary');
                b.classList.add('btn-outline');
            });
            btn.classList.remove('btn-outline');
            btn.classList.add('btn-primary');

            const cat = btn.getAttribute('data-cat');
            if (cat === 'tous') {
                afficherProduits(tousLesProduits);
            } else {
                const produitsFiltres = tousLesProduits.filter(p => p.categorie === cat);
                afficherProduits(produitsFiltres);
            }
        });
    });
});

// 4. Fonction globale pour changer l'image et l'option Snipcart en direct
function mettreAJourSelection(idProduit, imageBase) {
    const select = document.getElementById(`select-${idProduit}`);
    const optionSelectionnee = select.options[select.selectedIndex];
    const couleurValeur = select.value;
    const suffixe = optionSelectionnee.getAttribute('data-suffixe');

    // Mise à jour du bouton d'achat Snipcart avec la couleur choisie
    const btn = document.getElementById(`btn-snipcart-${idProduit}`);
    if (btn) {
        btn.setAttribute('data-item-custom1-value', couleurValeur);
    }

    // Calcul et mise à jour du chemin de l'image (ex: images/E-001_orange.png)
    const imgElement = document.getElementById(`img-${idProduit}`);
    if (imgElement && imageBase) {
        const pointIndex = imageBase.lastIndexOf('.');
        if (pointIndex !== -1) {
            const nomBase = imageBase.substring(0, pointIndex);
            const ext = imageBase.substring(pointIndex);
            const nouvelleImage = `${nomBase}${suffixe}${ext}`;

            // Tester si l'image existe sinon garder l'image de base
            const testImg = new Image();
            testImg.onload = () => { imgElement.src = nouvelleImage; };
            testImg.onerror = () => { imgElement.src = imageBase; };
            testImg.src = nouvelleImage;
        }
    }
}