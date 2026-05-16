const SHEETDB_URL = "https://sheetdb.io/api/v1/4kexbmu4y8qtc";

const CONFIG = { 
    electricity: 0.22, 
    material_kg: 25, 
    machine_wear: 0.16, 
    charge_rate: 0.212,
    // Grille tarifaire HT pour chaque transporteur et format
    shipping_rates: {
        standard: {
            name: "Colissimo",
            formats: { xs: 4.50, small: 5.90, medium: 7.50, large: 10.20 }
        },
        relay: {
            name: "Mondial Relay",
            formats: { xs: 3.20, small: 3.90, medium: 4.90, large: 6.80 }
        },
        express: {
            name: "Chronopost",
            formats: { xs: 11.90, small: 14.50, medium: 17.90, large: 22.00 }
        }
    }
};

// --- INITIALISATION ---
async function init() {
    const matSelect = document.getElementById('mat_custom');
    const colSelect = document.getElementById('color_custom');
    
    try {
        const res = await fetch(`${SHEETDB_URL}?sheet=Stocks`);
        const stocks = await res.json();
        let matieres = [...new Set(stocks.map(s => s.mat))];
        let couleurs = [...new Set(stocks.map(s => s.col))];
        
        matSelect.innerHTML = ""; colSelect.innerHTML = "";
        matieres.forEach(m => { if(m) { let o = document.createElement('option'); o.text = m; o.value = m; matSelect.add(o); } });
        couleurs.forEach(c => { if(c) { let o = document.createElement('option'); o.text = c; o.value = c; colSelect.add(o); } });
    } catch (e) { console.error("Erreur stocks", e); }

    refreshClientList();
    toggleFormMode();
    updateShippingFormats(); // Génère les formats de livraison initiaux
    update('params');
}

// --- GESTION DYNAMIQUE DE L'EXPÉDITION ---
function updateShippingFormats() {
    const provider = document.getElementById('shipping_provider').value;
    const formatSelect = document.getElementById('shipping_format');
    const formats = CONFIG.shipping_rates[provider].formats;
    
    formatSelect.innerHTML = '';
    
    formatSelect.options[formatSelect.options.length] = new Option(`Très Petit (max 250g) — ${formats.xs.toFixed(2)}€ HT`, 'xs');
    formatSelect.options[formatSelect.options.length] = new Option(`Petit (max 500g) — ${formats.small.toFixed(2)}€ HT`, 'small');
    formatSelect.options[formatSelect.options.length] = new Option(`Moyen (max 1kg) — ${formats.medium.toFixed(2)}€ HT`, 'medium');
    formatSelect.options[formatSelect.options.length] = new Option(`Grand (max 5kg) — ${formats.large.toFixed(2)}€ HT`, 'large');
}

function getSelectedShippingCost() {
    const provider = document.getElementById('shipping_provider').value;
    const format = document.getElementById('shipping_format').value;
    return CONFIG.shipping_rates[provider].formats[format] || 0;
}

// --- CONVERSION HH:mm EN DÉCIMAL ---
function parseTimeToDecimal(timeStr) {
    if (!timeStr) return 0;
    if (!isNaN(timeStr) && !timeStr.toString().includes(':')) return parseFloat(timeStr);
    let clean = timeStr.toString().replace('h', ':').replace('H', ':');
    let parts = clean.split(':');
    if (parts.length >= 2) {
        return (parseInt(parts[0]) || 0) + ((parseInt(parts[1]) || 0) / 60);
    }
    return parseFloat(clean) || 0;
}

// --- CALCULS ---
function update(source) {
    const mode = document.getElementById('mode_projet').value;
    const qty = parseFloat(document.getElementById('qty').value) || 1;
    
    // Récupération dynamique du tarif de transport sélectionné
    const shipping = getSelectedShippingCost(); 
    let baseProdHT = 0;

    if (mode === 'impression') {
        const h = parseTimeToDecimal(document.getElementById('h_imp').value);
        const p = parseFloat(document.getElementById('p_imp').value) || 0;
        baseProdHT = (h * 0.15 * CONFIG.electricity) + ((p / 1000) * CONFIG.material_kg) + (h * CONFIG.machine_wear) + 3.00;
    } else {
        const complex = parseFloat(document.getElementById('concep_complex').value) || 0;
        const echanges = parseFloat(document.getElementById('nb_echanges').value) || 0;
        baseProdHT = complex + (echanges * 5);
    }

    const totalHT_unitaire = (baseProdHT * 1.5) / (1 - CONFIG.charge_rate);
    const totalSuggere = (totalHT_unitaire * qty) + shipping;

    if (source === 'params') document.getElementById('input_total_ht').value = totalSuggere.toFixed(2);

    const totalHTVal = parseFloat(document.getElementById('input_total_ht').value) || 0;
    const charges = totalHTVal * CONFIG.charge_rate;
    const revient = (baseProdHT * qty) + shipping + charges;
    const benef = totalHTVal - revient;

    document.getElementById('res_base').innerText = (baseProdHT * qty).toFixed(2) + "€";
    document.getElementById('res_shipping').innerText = shipping.toFixed(2) + "€";
    document.getElementById('res_charges').innerText = charges.toFixed(2) + "€";
    document.getElementById('res_revient').innerText = revient.toFixed(2) + "€";
    document.getElementById('res_net').innerText = benef.toFixed(2) + "€";
}

// --- ENREGISTREMENT EN ATTENTE ---
async function enregistrerEnAttente(numDevis) {
    const mode = document.getElementById('mode_projet').value;
    if (mode !== 'impression') return;

    const poidsTotal = (parseFloat(document.getElementById('p_imp').value) || 0) * (parseFloat(document.getElementById('qty').value) || 1);
    
    const data = {
        id_devis: Date.now(), 
        numDevis: numDevis,
        mat: document.getElementById('mat_custom').value,
        col: document.getElementById('color_custom').value,
        poids: poidsTotal
    };

    try {
        await fetch(`${SHEETDB_URL}?sheet=Attentes`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ data: [data] })
        });
        console.log("Donnée envoyée à la feuille Attentes");
    } catch (e) { console.error("Erreur SheetDB", e); }
}

// --- PDF & ACTION ---
async function genererPDF() {
    const numDevis = "D-" + Date.now().toString().slice(-6);
    
    await enregistrerEnAttente(numDevis);

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const clientName = document.getElementById('client_name').value || "Client";
    
    doc.text(`THEINA 3D - DEVIS ${numDevis}`, 20, 20);
    doc.text(`Client : ${clientName}`, 20, 30);
    doc.text(`Poids total : ${(parseFloat(document.getElementById('p_imp').value)*parseFloat(document.getElementById('qty').value))}g`, 20, 40);
    doc.text(`TOTAL : ${document.getElementById('input_total_ht').value} € HT`, 20, 50);
    
    doc.save(`DEVIS_${numDevis}_${clientName.replace(/\s+/g, '_')}.pdf`);
}

// --- CLIENTS & UI ---
async function refreshClientList() {
    const datalist = document.getElementById('client_suggestions');
    try {
        const res = await fetch(`${SHEETDB_URL}?sheet=Clients`);
        const clients = await res.json();
        datalist.innerHTML = "";
        clients.forEach(c => {
            let o = document.createElement('option');
            o.value = c.name;
            o.setAttribute('data-full', JSON.stringify(c));
            datalist.appendChild(o);
        });
    } catch(e) { console.error(e); }
}

function handleClientSearch(input) {
    const options = document.getElementById('client_suggestions').options;
    for (let i = 0; i < options.length; i++) {
        if (options[i].value === input.value) {
            const data = JSON.parse(options[i].getAttribute('data-full'));
            document.getElementById('client_name').value = data.name || "";
            document.getElementById('client_contact').value = data.contact || "";
            document.getElementById('client_address').value = data.address || data.adress || "";
            return;
        }
    }
}

function toggleFormMode() {
    const m = document.getElementById('mode_projet').value;
    document.getElementById('form_conception').classList.toggle('hidden', m !== 'conception');
    document.getElementById('form_impression').classList.toggle('hidden', m !== 'impression');
    document.getElementById('row_mat_color').classList.toggle('hidden', m !== 'impression');
    update('params');
}

window.onload = init;