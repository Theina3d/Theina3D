const SHEETDB_URL = "https://sheetdb.io/api/v1/4kexbmu4y8qtc"; 

document.addEventListener('DOMContentLoaded', refreshUI);

async function uiAjouterStock() {
    const mat = document.getElementById('add_mat').value.trim();
    const col = document.getElementById('add_col').value.trim();
    const qtyToAdd = parseFloat(document.getElementById('add_qty').value);
    const price = document.getElementById('add_price').value;
    const supplier = document.getElementById('add_supplier').value;

    if(!mat || !col || isNaN(qtyToAdd)) return alert("Remplissez les champs");

    // L'ID unique qui permet de savoir si c'est le même produit
    const id = `${mat}_${col}`.toLowerCase().replace(/\s+/g, '');

    try {
        // 1. On vérifie si cette référence existe déjà dans le Google Sheet
        const response = await fetch(`${SHEETDB_URL}/search?id=${id}&sheet=Stocks`);
        const existingEntries = await response.json();

        if (existingEntries.length > 0) {
            // 2. Si elle existe, on additionne la nouvelle quantité à l'ancienne
            // On utilise la fonction INCREMENT de SheetDB pour éviter les erreurs de calcul local
            await fetch(`${SHEETDB_URL}/id/${id}?sheet=Stocks`, {
                method: 'PATCH',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    data: { 
                        "qte": `INCREMENT(${qtyToAdd})`,
                        "price": price, // On met à jour le prix avec le dernier achat
                        "supplier": supplier 
                    }
                })
            });
            alert(`Stock de ${mat} ${col} mis à jour (+${qtyToAdd}g) !`);
        } else {
            // 3. Si elle n'existe pas, on crée la ligne normalement
            const newData = { id, mat, col, qte: qtyToAdd, price, supplier };
            await fetch(`${SHEETDB_URL}?sheet=Stocks`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ data: [newData] })
            });
            alert("Nouvelle référence ajoutée au stock !");
        }
        
        refreshUI();
    } catch (e) {
        console.error("Erreur lors de l'ajout :", e);
        alert("Erreur de communication avec le Cloud.");
    }
}

async function refreshUI() {
    const body = document.getElementById('stock_body');
    const resStock = await fetch(`${SHEETDB_URL}?sheet=Stocks`);
    const stocks = await resStock.json();
    body.innerHTML = "";
    stocks.forEach(item => {
        body.innerHTML += `<tr><td>${item.mat} - ${item.col}</td><td>${item.qte}g</td><td>${item.price}€</td><td><button onclick="supprimerRef('${item.id}')">🗑️</button></td></tr>`;
    });

    const attenteZone = document.getElementById('attente_list');
    const resAtt = await fetch(`${SHEETDB_URL}?sheet=Attentes`);
    const attentes = await resAtt.json();
    attenteZone.innerHTML = attentes.length === 0 ? "<p>Rien en attente.</p>" : "";
    attentes.forEach(m => {
        attenteZone.innerHTML += `<div style="margin-bottom:10px; border:1px solid #ddd; padding:10px;">
            <span>${m.numDevis} : ${m.mat} (${m.poids}g)</span>
            <button onclick="confirmerMouvement('${m.numDevis}', '${m.mat}', '${m.col}', ${m.poids})">Valider ✅</button>
        </div>`;
    });
}

async function confirmerMouvement(numDevis, mat, col, poids) {
    const idStock = `${mat}_${col}`.toLowerCase();
    // Déduction (SheetDB gère l'incrément négatif)
    await fetch(`${SHEETDB_URL}/id/${idStock}?sheet=Stocks`, {
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ data: { "qte": `INCREMENT(-${poids})` } })
    });
    // Suppression de l'attente
    await fetch(`${SHEETDB_URL}/numDevis/${numDevis}?sheet=Attentes`, { method: 'DELETE' });
    refreshUI();
}