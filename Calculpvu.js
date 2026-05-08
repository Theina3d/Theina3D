const SHEETDB_URL = "https://sheetdb.io/api/v1/4kexbmu4y8qtc"; 
const CONFIG = { electricity: 0.22, material_kg: 25, machine_wear: 0.16, charge_rate: 0.212 };

async function init() {
    const matSelect = document.getElementById('mat_custom');
    const colSelect = document.getElementById('color_custom');
    
    try {
        const res = await fetch(`${SHEETDB_URL}?sheet=Stocks`);
        const stocks = await res.json();
        matSelect.innerHTML = ""; colSelect.innerHTML = "";

        let matieres = [...new Set(stocks.map(s => s.mat))];
        let couleurs = [...new Set(stocks.map(s => s.col))];

        matieres.forEach(m => { let o = document.createElement('option'); o.text = m; matSelect.add(o); });
        couleurs.forEach(c => { let o = document.createElement('option'); o.text = c; colSelect.add(o); });
    } catch (e) { console.log("Erreur Cloud Stocks"); }

    refreshClientList();
    toggleFormMode();
}

async function saveClient() {
    const data = {
        name: document.getElementById('client_name').value,
        contact: document.getElementById('client_contact').value,
        address: document.getElementById('client_address').value
    };
    await fetch(`${SHEETDB_URL}?sheet=Clients`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ data: [data] })
    });
    alert("Client synchronisé !");
    refreshClientList();
}

async function refreshClientList() {
    const list = document.getElementById('client_list');
    const res = await fetch(`${SHEETDB_URL}?sheet=Clients`);
    const clients = await res.json();
    list.innerHTML = '<option value="">📂 Charger un client...</option>';
    clients.forEach(c => {
        let o = document.createElement('option');
        o.value = JSON.stringify(c); o.text = c.name;
        list.add(o);
    });
}

function loadClient() {
    const val = document.getElementById('client_list').value;
    if(!val) return;
    const c = JSON.parse(val);
    document.getElementById('client_name').value = c.name;
    document.getElementById('client_contact').value = c.contact;
    document.getElementById('client_address').value = c.address;
}

// Logique de calcul (simplifiée pour l'exemple, garde ta logique originale au besoin)
function update(source) {
    const qty = parseFloat(document.getElementById('qty').value) || 1;
    const shipping = parseFloat(document.getElementById('shipping_cost').value) || 0;
    const h = parseFloat(document.getElementById('h_imp').value) || 0;
    const p = parseFloat(document.getElementById('p_imp').value) || 0;

    const baseProdHT = (h * 0.15 * CONFIG.electricity) + ((p / 1000) * CONFIG.material_kg) + (h * CONFIG.machine_wear) + 3.00;
    
    let totalFinal = ((baseProdHT * 1.5) / (1 - CONFIG.charge_rate)) + shipping;
    document.getElementById('input_total_ht').value = totalFinal.toFixed(2);
    
    document.getElementById('res_base').innerText = baseProdHT.toFixed(2) + "€";
    document.getElementById('res_net').innerText = (totalFinal * 0.5).toFixed(2) + "€"; // Estimation simplifiée
}

async function genererPDF() {
    const numDevis = "D-" + Date.now().toString().slice(-6);
    const mode = document.getElementById('mode_projet').value;

    if(mode === 'impression') {
        const attente = {
            numDevis: numDevis,
            mat: document.getElementById('mat_custom').value,
            col: document.getElementById('color_custom').value,
            poids: parseFloat(document.getElementById('p_imp').value) * parseFloat(document.getElementById('qty').value)
        };
        await fetch(`${SHEETDB_URL}?sheet=Attentes`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ data: [attente] })
        });
    }
    alert("Devis envoyé en attente de stock !");
}

function toggleFormMode() {
    const m = document.getElementById('mode_projet').value;
    document.getElementById('form_conception').classList.toggle('hidden', m !== 'conception');
    document.getElementById('form_impression').classList.toggle('hidden', m !== 'impression');
    update('params');
}

window.onload = init;