const SHEETDB_URL = "https://sheetdb.io/api/v1/4kexbmu4y8qtc"; // ⚠️ REMPLACE PAR TON ID

document.addEventListener('DOMContentLoaded', refreshUI);

// 1. ENREGISTRER UNE ENTRÉE (Nouvelle ligne dans Google Sheets)
async function uiAjouterStock() {
    const data = {
        date: new Date().toLocaleDateString('fr-FR'),
        mat: document.getElementById('add_mat').value.trim(),
        col: document.getElementById('add_col').value.trim(),
        qte: parseFloat(document.getElementById('add_qty').value),
        price: document.getElementById('add_price').value,
        supplier: document.getElementById('add_supplier').value,
        type: "ENTREE" // Pour différencier les flux
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
    } catch (e) { alert("Erreur Cloud"); }
}

// 2. REFRESH ET REGROUPEMENT (Le fameux "Tableau Croisé Dynamique")
async function refreshUI() {
    const body = document.getElementById('stock_body');
    const attenteZone = document.getElementById('attente_list');

    try {
        // A. Récupérer TOUTES les lignes de l'onglet Stocks
        const resStock = await fetch(`${SHEETDB_URL}?sheet=Stocks`);
        const allEntries = await resStock.json();

        // LOGIQUE DE FUSION : On regroupe par Matière + Couleur
        const inventaire = allEntries.reduce((acc, entry) => {
            const key = `${entry.mat}_${entry.col}`.toLowerCase();
            if (!acc[key]) {
                acc[key] = { mat: entry.mat, col: entry.col, qte: 0, price: entry.price };
            }
            // Si c'est une ENTREE on ajoute, si c'est une SORTIE on soustrait
            const val = parseFloat(entry.qte);
            acc[key].qte += (entry.type === "SORTIE") ? -val : val;
            return acc;
        }, {});

        // Affichage de l'inventaire calculé
        body.innerHTML = "";
        Object.values(inventaire).forEach(item => {
            if (item.qte <= 0) return; // On n'affiche pas les stocks vides
            const isLow = item.qte < 200;
            body.innerHTML += `
                <tr class="${isLow ? 'status-low' : ''}">
                    <td>${item.mat} - ${item.col}</td>
                    <td><strong>${item.qte.toFixed(0)}g</strong></td>
                    <td>${item.price}€</td>
                    <td><button class="btn-action btn-suppr" onclick="supprimerFlux('${item.mat}', '${item.col}')">🗑️ Vider</button></td>
                </tr>`;
        });

        // B. Charger les mouvements à valider (onglet Attentes)
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
    } catch (e) { console.error(e); }
}

// 3. VALIDER UNE SORTIE (Crée une ligne négative dans Stocks)
async function confirmerMouvement(numDevis, mat, col, poids) {
    try {
        // On crée une ligne de type "SORTIE"
        const sortie = {
            date: new Date().toLocaleDateString('fr-FR'),