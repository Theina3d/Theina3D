const SHEETDB_URL = "https://sheetdb.io/api/v1/4kexbmu4y8qtc";
const CONFIG = { electricity: 0.22, material_kg: 25, machine_wear: 0.16, charge_rate: 0.212 };

// --- INITIALISATION ---
async function init() {
    const matSelect = document.getElementById('mat_custom');
    const colSelect = document.getElementById('color_custom');
    
    try {
        const res = await fetch(`${SHEETDB_URL}?sheet=Stocks`);
        const stocks = await res.json();
        
        // Extraction des matières et couleurs pour remplir les menus
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
    } catch (e) { console.log("Mode hors-ligne ou erreur Cloud"); }

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
    if(!data.name) return alert("Le nom du client est obligatoire.");

    await fetch(`${SHEETDB_URL}?sheet=Clients`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ data: [data] })
    });
    alert("Client enregistré dans la base !");
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
    } catch(e) { console.log("Erreur liste clients"); }
}

function loadClient() {
    const val = document.getElementById('client_list').value;
    if(!val) return;
    const c = JSON.parse(val);
    document.getElementById('client_name').value = c.name;
    document.getElementById('client_contact').value = c.contact;
    document.getElementById('client_address').value = c.address;
}

// --- CALCULS ---
function update(source) {
    const mode = document.getElementById('mode_projet').value;
    const qty = parseFloat(document.getElementById('qty').value) || 1;
    const shipping = parseFloat(document.getElementById('shipping_cost').value) || 0;
    
    let baseProdHT = 0;

    if (mode === 'impression') {
        const h = parseFloat(document.getElementById('h_imp').value) || 0;
        const p = parseFloat(document.getElementById('p_imp').value) || 0;
        baseProdHT = (h * 0.15 * CONFIG.electricity) + ((p / 1000) * CONFIG.material_kg) + (h * CONFIG.machine_wear) + 3.00;
    } else {
        const complex = parseFloat(document.getElementById('concep_complex').value) || 0;
        const echanges = parseFloat(document.getElementById('nb_echanges').value) || 0;
        baseProdHT = complex + (echanges * 5);
    }

    const totalHT_unitaire = (baseProdHT * 1.5) / (1 - CONFIG.charge_rate);
    const totalSuggere = (totalHT_unitaire * qty) + shipping;

    if (source === 'params') {
        document.getElementById('input_total_ht').value = totalSuggere.toFixed(2);
    }

    const totalHTVal = parseFloat(document.getElementById('input_total_ht').value) || 0;
    const charges = totalHTVal * CONFIG.charge_rate;
    const revient = (baseProdHT * qty) + shipping + charges;
    const benef = totalHTVal - revient;

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

// --- GÉNÉRATION PDF & ENVOI STOCK ---
async function genererPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Variables de nommage
    const numDevis = "D-" + Date.now().toString().slice(-6);
    const rawNom = document.getElementById('client_name').value || "Client_Anonyme";
    const nomClient = rawNom.replace(/[^a-z0-9]/gi, '_');
    const dateLabel = new Date().toISOString().slice(0,10);
    const fileName = `DEVIS_${dateLabel}_${nomClient}_${numDevis}.pdf`;

    // 1. Envoi à l'onglet "Attentes" pour le stock
    if(document.getElementById('mode_projet').value === 'impression') {
        const dataAttente = {
            numDevis: numDevis,
            mat: document.getElementById('mat_custom').value,
            col: document.getElementById('color_custom').value,
            poids: parseFloat(document.getElementById('p_imp').value) * parseFloat(document.getElementById('qty').value)
        };

        try {
            await fetch(`${SHEETDB_URL}?sheet=Attentes`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ data: [dataAttente] })
            });
        } catch (e) { console.error("Erreur Cloud Stock"); }
    }

    // 2. Construction visuelle du PDF
    doc.setFontSize(22);
    doc.setTextColor(100, 80, 160); 
    doc.text("THEINA 3D - DEVIS", 20, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Devis n° : ${numDevis}`, 20, 30);
    doc.text(`Date : ${new Date().toLocaleDateString('fr-FR')}`, 20, 35);
    
    doc.line(20, 40, 190, 40);

    doc.setFont("helvetica", "bold");
    doc.text("DESTINATAIRE :", 20, 50);
    doc.setFont("helvetica", "normal");
    doc.text(document.getElementById('client_name').value, 20, 57);
    doc.text(document.getElementById('client_address').value, 20, 64);

    doc.setFont("helvetica", "bold");
    doc.text("OBJET DU DEVIS :", 20, 85);
    doc.setFont("helvetica", "normal");
    doc.text(document.getElementById('designation_custom').value, 20, 92);

    doc.setFontSize(14);
    doc.text(`Montant Total HT : ${document.getElementById('input_total_ht').value} EUR`, 20, 120);
    
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text("TVA non applicable, article 293 B du Code général des impôts.", 20, 130);

    // 3. Sorties : Téléchargement + Ouverture
    doc.save(fileName); // Télécharge directement
    window.open(doc.output('bloburl'), '_blank'); // Ouvre l'aperçu
}

window.onload = init;