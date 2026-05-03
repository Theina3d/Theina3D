// Initialisation au chargement
document.addEventListener('DOMContentLoaded', () => {
    refreshUI();
});

// Ajouter au stock
function uiAjouterStock() {
    const mat = document.getElementById('add_mat').value;
    const col = document.getElementById('add_col').value;
    const qty = parseFloat(document.getElementById('add_qty').value);
    const price = parseFloat(document.getElementById('add_price').value);
    const supplier = document.getElementById('add_supplier').value;

    if(!mat || !col || isNaN(qty)) return alert("Remplissez les champs");

    let stock = JSON.parse(localStorage.getItem('t3d_stock')) || {};
    const id = `${mat}_${col}`.toLowerCase();

    if(!stock[id]) {
        stock[id] = { mat, col, qte: 0, price: 0, supplier: "" };
    }

    stock[id].qte += qty;
    stock[id].price = price;
    stock[id].supplier = supplier;

    localStorage.setItem('t3d_stock', JSON.stringify(stock));
    refreshUI();
}

// Afficher les données
function refreshUI() {
    const body = document.getElementById('stock_body');
    const stock = JSON.parse(localStorage.getItem('t3d_stock')) || {};
    body.innerHTML = "";

    for(let id in stock) {
        const item = stock[id];
        const isLow = item.qte < 200; // Alerte sous 200g
        body.innerHTML += `
            <tr class="${isLow ? 'status-low' : ''}">
                <td>${item.mat} - ${item.col}</td>
                <td>${item.qte}g</td>
                <td>${item.price}€</td>
                <td><button class="btn-action btn-suppr" onclick="supprimerRef('${id}')">🗑️</button></td>
            </tr>
        `;
    }

    // Afficher les attentes
    const attenteZone = document.getElementById('attente_list');
    const attentes = JSON.parse(localStorage.getItem('t3d_attentes')) || [];
    attenteZone.innerHTML = attentes.length === 0 ? "<p>Aucune validation en attente.</p>" : "";

    attentes.forEach((m, index) => {
        attenteZone.innerHTML += `
            <div style="background:#f9f9f9; padding:10px; border-radius:8px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
                <span><strong>${m.numDevis}</strong> : ${m.mat} ${m.col} (${m.poids}g)</span>
                <button class="btn-action btn-valider" onclick="confirmerMouvement(${index})">Valider Sortie ✅</button>
            </div>
        `;
    });
}

function confirmerMouvement(index) {
    let attentes = JSON.parse(localStorage.getItem('t3d_attentes')) || [];
    let stock = JSON.parse(localStorage.getItem('t3d_stock')) || {};
    const m = attentes[index];
    const id = `${m.mat}_${m.col}`.toLowerCase();

    if(stock[id]) {
        stock[id].qte -= m.poids;
        attentes.splice(index, 1);
        localStorage.setItem('t3d_stock', JSON.stringify(stock));
        localStorage.setItem('t3d_attentes', JSON.stringify(attentes));
        refreshUI();
    } else {
        alert("Cette référence n'existe pas en stock !");
    }
}

function supprimerRef(id) {
    if(confirm("Supprimer cette référence ?")) {
        let stock = JSON.parse(localStorage.getItem('t3d_stock')) || {};
        delete stock[id];
        localStorage.setItem('t3d_stock', JSON.stringify(stock));
        refreshUI();
    }
}