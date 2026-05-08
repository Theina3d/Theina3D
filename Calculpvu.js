const SHEETDB_URL = "https://sheetdb.io/api/v1/4kexbmu4y8qtc";
const CONFIG = { electricity: 0.22, material_kg: 25, machine_wear: 0.16, charge_rate: 0.212 };

// --- INITIALISATION ---
async function init() {
    const matSelect = document.getElementById('mat_custom');
    const colSelect = document.getElementById('color_custom');
    
    try {
        // Récupérer le stock depuis Google Sheets
        const res = await fetch(`${SHEETDB_URL}?sheet=Stocks`);
        const stocks = await res.json();
        
        // Extraire les matières et couleurs uniques
        let matieres = [...new Set(stocks.map(s => s.mat))];
        let couleurs = [...new Set(stocks.map(s => s.col))];

        matSelect.innerHTML = "";
        colSelect.innerHTML = "";

        matieres.forEach(m => {
            let o = document.createElement('option'); o.text = m; o.value = m;
            matSelect.add(o);
        });
        couleurs.forEach(c => {
            let o = document.createElement('option'); o.text = c; o.value = c;
            colSelect.add(o);
        });
    } catch (e) { console.log("Erreur chargement stocks cloud"); }

    refreshClientList();
    toggleFormMode();
    update('params');
}

// --- GESTION DES CLIENTS ---
async function saveClient() {
    const data = {
        name: document.getElementById('client_name').value,
        contact: document.getElementById('client_contact').value,
        address: document.getElementById('client_address').value
    };
    if(!data.name) return alert("Nom client requis");

    await fetch(`${SHEETDB_URL}?sheet=Clients`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ data: [data] })
    });
    alert("Client synchronisé avec succès !");
    refreshClientList();
}

async function refreshClientList() {
    const list = document.getElementById('client_list');
    try {
        const res = await fetch(`${SHEETDB_URL}?sheet=Clients`);
        const clients = await res.json();
        list.innerHTML = '<option value="">📂 Charger un client...</option>';
        clients.forEach(c => {
            let o = document.createElement('option');
            o.value = JSON.stringify(c); o.text = c.name;
            list.add(o);
        });
    } catch(e) { console.log("Erreur clients"); }
}

function loadClient() {
    const val = document.getElementById('client_list').value;
    if(!val) return;
    const c = JSON.parse(val);
    document.getElementById('client_name').value = c.name;
    document.getElementById('client_contact').value = c.contact;
    document.getElementById('client_address').value = c.address;
}

// --- LOGIQUE DE CALCUL ---
function update(source) {
    const mode = document.getElementById('mode_projet').value;
    const qty = parseFloat(document.getElementById('qty').value) || 1;
    const shipping = parseFloat(document.getElementById('shipping_cost').value) || 0;
    
    let baseProdHT = 0;

    if (mode === 'impression') {
        const h = parseFloat(document.getElementById('h_imp').value) || 0;
        const p = parseFloat(document.getElementById('p_imp').value) || 0;
        // Calcul : (Élec * h) + (Matière * kg) + (Usure * h) + Frais fixes 3€
        baseProdHT = (h * 0.15 * CONFIG.electricity) + ((p / 1000) * CONFIG.material_kg) + (h * CONFIG.machine_wear) + 3.00;
    } else {
        const complex = parseFloat(document.getElementById('concep_complex').value) || 0;
        const echanges = parseFloat(document.getElementById('nb_echanges').value) || 0;
        baseProdHT = complex + (echanges * 5);
    }

    const totalHT_unitaire = (baseProdHT * 1.5) / (1 - CONFIG.charge_rate);
    const totalFinal = (totalHT_unitaire * qty) + shipping;

    if (source === 'params') {
        document.getElementById('input_total_ht').value = totalFinal.toFixed(2);
    }

    const totalAffiche = parseFloat(document.getElementById('input_total_ht').value) || 0;
    const charges = totalAffiche * CONFIG.charge_rate;
    const revient = (baseProdHT * qty) + shipping + charges;
    const benef = totalAffiche - revient;

    document.getElementById('res_base').innerText = (baseProdHT * qty).toFixed(2) + "€";
    document.getElementById('res_shipping').innerText = shipping.toFixed(2) + "€";
    document.getElementById('res_charges').innerText = charges.toFixed(2) + "€";
    document.getElementById('res_revient').innerText = revient.toFixed(2) + "€";
    document.getElementById('res_net').innerText = benef.toFixed(2) + "€";
    document.getElementById('net_container').style.background = benef > 0 ? "#2d3d34" : "#3d2d2d";
}

function toggleFormMode() {
    const m = document.getElementById('mode_projet').value;
    document.getElementById('form_conception').classList.toggle('hidden', m !== 'conception');
    document.getElementById('form_impression').classList.toggle('hidden', m !== 'impression');
    document.getElementById('row_mat_color').classList.toggle('hidden', m !== 'impression');
    update('params');
}

// --- GÉNÉRATION PDF & STOCK ---
async function genererPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const numDevis = "D-" + Date.now().toString().slice(-6);
    
    // Ajout à l'onglet Attentes de SheetDB
    if(document.getElementById('mode_projet').value === 'impression') {
        const dataAttente = {
            numDevis: numDevis,
            mat: document.getElementById('mat_custom').value,
            col: document.getElementById('color_custom').value,
            poids: parseFloat(document.getElementById('p_imp').value) * parseFloat(document.getElementById('qty').value)
        };

        await fetch(`${SHEETDB_URL}?sheet=Attentes`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ data: [dataAttente] })
        });
    }

    // PDF Simple
    doc.setFontSize(20);
    doc.text("DEVIS THEINA3D", 20, 20);
    doc.setFontSize(12);
    doc.text(`Devis n° : ${numDevis}`, 20, 30);
    doc.text(`Client : ${document.getElementById('client_name').value}`, 20, 40);
    doc.text(`Projet : ${document.getElementById('designation_custom').value}`, 20, 50);
    doc.text(`TOTAL HT : ${document.getElementById('input_total_ht').value} EUR`, 20, 70);
    
    doc.save(`Devis_${numDevis}.pdf`);
    alert("Devis généré et envoyé en attente de stock !");
}

window.onload = init;