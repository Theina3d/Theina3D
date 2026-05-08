const SHEETDB_URL = "https://sheetdb.io/api/v1/4kexbmu4y8qtc"; 

document.addEventListener('DOMContentLoaded', refreshUI);

async function uiAjouterStock() {
    const data = {
        id: `${document.getElementById('add_mat').value}_${document.getElementById('add_col').value}`.toLowerCase(),
        mat: document.getElementById('add_mat').value,
        col: document.getElementById('add_col').value,
        qte: parseFloat(document.getElementById('add_qty').value),
        price: document.getElementById('add_price').value,
        supplier: document.getElementById('add_supplier').value
    };

    await fetch(`${SHEETDB_URL}?sheet=Stocks`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ data: [data] })
    });
    refreshUI();
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