const SHEETDB_URL = "https://sheetdb.io/api/v1/4kexbmu4y8qtc"; 

document.addEventListener('DOMContentLoaded', refreshUI);

// --- 1. ENREGISTRER UNE ENTRÉE (ACHAT) ---
async function uiAjouterStock() {
    const data = {
        date: new Date().toLocaleDateString('fr-FR'),
        mat: document.getElementById('add_mat').value.trim(),
        col: document.getElementById('add_col').value.trim(),
        qte: parseFloat(document.getElementById('add_qty').value),
        price: document.getElementById('add_price').value,
        supplier: document.getElementById('add_supplier').value,
        type: "ENTREE"
    };

    if(!data.mat || !data.col || isNaN(data.qte)) return alert("Champs invalides");

    try {
        await fetch(`${SHEETDB_URL}?sheet=Stocks`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ data: [data] })
        });
        alert("Achat enregistré !");
        refreshUI();
    } catch (e) { alert("Erreur de connexion au Cloud"); }
}

// --- 2. REFRESH ET REGROUPEMENT DYNAMIQUE ---
async function refreshUI() {
    const body = document.getElementById('stock_body');
    const attenteZone = document.getElementById('attente_list');

    try {
        // A. On récupère TOUT l'historique de l'onglet Stocks
        const resStock = await fetch(`${SHEETDB_URL}?sheet=Stocks`);
        const allEntries = await resStock.json();

        // LOGIQUE DE REGROUPEMENT (On additionne les ENTREE et on soustrait les SORTIE)
        const inventaire = allEntries.reduce((acc, entry) => {
            const key = `${entry.mat}_${entry.col}`.toLowerCase();
            if (!acc[key]) {
                acc[key] = { mat: entry.mat, col: entry.col, qte: 0, price: entry.price };
            }
            const val = parseFloat(entry.qte) || 0;
            acc[key].qte += (entry.type === "SORTIE") ? -val : val;
            return acc;
        }, {});

        // Affichage de l'inventaire consolidé
        body.innerHTML = "";
        Object.values(inventaire).forEach(item => {
            if (item.qte <= 0) return; // On cache les stocks à zéro
            const isLow = item.qte < 200;
            body.innerHTML += `
                <tr class="${isLow ? 'status-low' : ''}">
                    <td>${item.mat} - ${item.col}</td>
                    <td><strong>${item.qte.toFixed(0)}g</strong></td>
                    <td>${item.price}€</td>
                    <td><button class="btn-action btn-suppr" onclick="supprimerFlux('${item.mat}', '${item.col}')">🗑️ Vider</button></td>
                </tr>`;
        });

        // B. Charger les devis en attente (onglet Attentes)
        const resAtt = await fetch(`${SHEETDB_URL}?sheet=Attentes`);
        const attentes = await resAtt.json();
        attenteZone.innerHTML = attentes.length === 0 ? "<p>Rien en attente.</p>" : "";
        attentes.forEach(m => {
            attenteZone.innerHTML += `
                <div style="background:#f9f9f9; padding:15px; border-radius:8px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center; border:1px solid #ddd;">
                    <span><strong>${m.numDevis}</strong> : ${m.mat} ${m.col} (${m.poids}g)</span>
                    <button class="btn-action btn-valider" onclick="confirmerMouvement('${m.numDevis}', '${m.mat}', '${m.col}', ${m.poids})">Valider Sortie ✅</button>
                </div>`;
        });
    } catch (e) { console.error("Erreur de chargement", e); }
}

// --- 3. VALIDER UNE SORTIE DE STOCK ---
async function confirmerMouvement(numDevis, mat, col, poids) {
    try {
        // On crée une ligne de type "SORTIE" dans Stocks
        const sortie = {
            date: new Date().toLocaleDateString('fr-FR'),
            mat: mat, col: col, qte: poids,
            type: "SORTIE",
            supplier: "DEVIS " + numDevis
        };

        await fetch(`${SHEETDB_URL}?sheet=Stocks`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ data: [sortie] })
        });

        // On supprime la ligne de l'onglet Attentes
        await fetch(`${SHEETDB_URL}/numDevis/${numDevis}?sheet=Attentes`, { method: 'DELETE' });

        alert("Stock mis à jour !");
        refreshUI();
    } catch (e) { alert("Erreur validation"); }
}

// --- 4. SUPPRIMER TOUT L'HISTORIQUE D'UNE RÉFÉRENCE ---
async function supprimerFlux(mat, col) {
    if(confirm(`Supprimer tout l'historique pour ${mat} ${col} ?`)) {
        // Supprime toutes les lignes ayant cette matière et cette couleur
        await fetch(`${SHEETDB_URL}/mat/${mat}?sheet=Stocks`, { method: 'DELETE' });
        refreshUI();
    }
}