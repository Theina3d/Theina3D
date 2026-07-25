document.addEventListener('DOMContentLoaded', () => {
    // Si on est sur la page boutique
    if (document.getElementById('liste-produits')) {
        chargerBoutique();
    }
    
    // Si on est sur la page détail produit
    if (document.getElementById('detail-produit')) {
        chargerDetailProduit();
    }
});

// 1. Chargement de la boutique
async function chargerBoutique() {
    const conteneur = document.getElementById('liste-produits');

    try {
        const response = await fetch('produits.json');
        if (!response.ok) throw new Error(`Erreur HTTP : ${response.status}`);
        
        const produits = await response.json();
        conteneur.innerHTML = ''; 

        produits.forEach(produit => {
            const carte = document.createElement('div');
            carte.className = 'card carte-produit';
            
            carte.innerHTML = `
                <div class="image-wrapper">
                    <img src="${produit.image}" alt="${produit.nom}" loading="lazy">
                </div>
                <div class="infos-produit">
                    <h3>${produit.nom}</h3>
                    <p class="description">${produit.description_courte || produit.description || ''}</p>
                    <div class="bas-carte">
                        <span class="prix">${produit.prix} €</span>
                        <a href="produit.html?id=${produit.id}" class="btn btn-primary btn-sm">Voir le produit</a>
                    </div>
                </div>
            `;
            
            conteneur.appendChild(carte);
        });
    } catch (erreur) {
        console.error('Erreur chargement boutique :', erreur);
        conteneur.innerHTML = `<p class="text-center" style="grid-column: 1/-1;">Impossible de charger les produits actuellement.</p>`;
    }
}

// 2. Chargement de la page de détail d'un produit
async function chargerDetailProduit() {
    const conteneur = document.getElementById('detail-produit');
    
    // Récupération de l'ID dans l'URL (ex: produit.html?id=2)
    const urlParams = new URLSearchParams(window.location.search);
    const produitId = parseInt(urlParams.get('id'));

    if (!produitId) {
        conteneur.innerHTML = `<p>Produit introuvable.</p>`;
        return;
    }

    try {
        const response = await fetch('produits.json');
        if (!response.ok) throw new Error(`Erreur HTTP : ${response.status}`);
        
        const produits = await response.json();
        const produit = produits.find(p => p.id === produitId);

        if (!produit) {
            conteneur.innerHTML = `<h2>Produit non trouvé</h2>`;
            return;
        }

        // Modification du titre de la page
        document.title = `${produit.nom} - Theina3D`;

        // Affichage du produit
        conteneur.innerHTML = `
            <div class="hero-image">
                <img src="${produit.image}" alt="${produit.nom}" style="width: 100%; border-radius: var(--radius-grand); box-shadow: var(--ombre-douce); max-height: 450px; object-fit: cover;">
            </div>
            
            <div class="card" style="padding: 35px;">
                <span class="badge-tag" style="width: fit-content;">${produit.categorie || 'Impression 3D'}</span>
                <h1 style="font-size: 2.4rem; margin: 10px 0;">${produit.nom}</h1>
                <p class="prix" style="font-size: 2rem; margin-bottom: 20px;">${produit.prix} €</p>
                
                <p style="margin-bottom: 25px; line-height: 1.7;">
                    ${produit.description_longue || produit.description}
                </p>

                <div style="background: var(--violet-pastel); padding: 15px 20px; border-radius: var(--radius-moyen); margin-bottom: 25px;">
                    <p style="margin: 0; font-size: 0.9rem; color: var(--violet-fonce);">
                        🌱 <strong>Matière :</strong> ${produit.materiau || 'PLA Écoresponsable'}<br>
                        🇫🇷 <strong>Fabrication :</strong> Imprimé en France à la commande
                    </p>
                </div>

                <div style="display: flex; gap: 15px; flex-wrap: wrap;">
                    <a href="projets.html" class="btn btn-primary" style="flex: 1; text-align: center;">Commander ce produit</a>
                </div>
            </div>
        `;
    } catch (erreur) {
        console.error('Erreur chargement détail :', erreur);
        conteneur.innerHTML = `<p>Erreur lors du chargement du produit.</p>`;
    }
}