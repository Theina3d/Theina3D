const SHEETDB_URL = "https://sheetdb.io/api/v1/4kexbmu4y8qtc";
const CONFIG = { electricity: 0.22, material_kg: 25, machine_wear: 0.16, charge_rate: 0.212 };

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
        matieres.forEach(m => { let o = document.createElement('option'); o.text = m; o.value = m; matSelect.add(o); });
        couleurs.forEach(c => { let o = document.createElement('option'); o.text = c; o.value = c; colSelect.add(o); });
    } catch (e) { console.error("Erreur stocks"); }

    refreshClientList();
    toggleFormMode();
    update('params');
}

// --- GESTION CLIENTS (SYNCHRO ADDRESS 2 "D") ---
async function saveClient() {
    const name = document.getElementById('client_name').value;
    const contact = document.getElementById('client_contact').value;
    const address = document.getElementById('client_address').value;

    if(!name) return alert("Veuillez entrer au moins un nom.");

    // IMPORTANT : On utilise "address" avec deux 'd' comme dans ton Sheet
    const data = { name, contact, address };

    try {
        const response = await fetch(`${SHEETDB_URL}?sheet=Clients`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ data: [data] })
        });
        if (response.ok) {
            alert("Client sauvegardé !");
            refreshClientList();
        }
    } catch (e) { console.error("Erreur sauvegarde client", e); }
}

async function refreshClientList() {
    const datalist = document.getElementById('client_suggestions');
    try {
        const res = await fetch(`${SHEETDB_URL}?sheet=Clients`);
        const clients = await res.json();
        datalist.innerHTML = "";
        clients.forEach(c => {
            let o = document.createElement('option');
            o.value = c.name;
            // On sauvegarde l'objet complet pour handleClientSearch
            o.setAttribute('data-full', JSON.stringify(c));
            datalist.appendChild(o);
        });
    } catch(e) { console.error("Erreur liste clients", e); }
}

function handleClientSearch(input) {
    const datalist = document.getElementById('client_suggestions');
    const options = datalist.options;
    for (let i = 0; i < options.length; i++) {
        if (options[i].value === input.value) {
            const data = JSON.parse(options[i].getAttribute('data-full'));
            document.getElementById('client_name').value = data.name || "";
            document.getElementById('client_contact').value = data.contact || "";
            
            // On cherche l'adresse avec 2 'd', et on met 1 'd' en secours
            document.getElementById('client_address').value = data.address || data.adress || "";
            return;
        }
    }
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
    document.getElementById('net_container').style.background = benef > 0 ? "#2d3d34" : "#3d2d2d";
}

function toggleFormMode() {
    const m = document.getElementById('mode_projet').value;
    document.getElementById('form_conception').classList.toggle('hidden', m !== 'conception');
    document.getElementById('form_impression').classList.toggle('hidden', m !== 'impression');
    document.getElementById('row_mat_color').classList.toggle('hidden', m !== 'impression');
    update('params');
}

// --- PDF ---
async function genererPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // --- 1. CONFIGURATION & VARIABLES ---
    const numDevis = "D-" + Date.now().toString().slice(-6);
    const dateLabel = new Date().toLocaleDateString('fr-FR');
    const clientName = document.getElementById('client_name').value || "Client";
    const clientContact = document.getElementById('client_contact').value || "";
    const clientAddr = document.getElementById('client_address').value || "";
    const objet = document.getElementById('designation_custom').value || "Prestation 3D";
    const totalHT = document.getElementById('input_total_ht').value;
    const shipping = document.getElementById('shipping_cost').value || "0";

    // --- 2. ENTÊTE AVEC BANDEAU VIOLET ---
    doc.setFillColor(100, 80, 160); // Ton violet
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor(255, 255, 255);
    doc.text("THEINA 3D", 20, 25);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Solutions d'Impression 3D & Conception", 20, 33);

    // Numéro et Date de devis (dans le bandeau)
    doc.setFontSize(12);
    doc.text(`DEVIS : ${numDevis}`, 150, 20);
    doc.text(`Date : ${dateLabel}`, 150, 28);

    // --- 3. COORDONNÉES (Émetteur vs Destinataire) ---
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    
    // Ton entreprise
    doc.setFont("helvetica", "bold");
    doc.text("ÉMETTEUR :", 20, 55);
    doc.setFont("helvetica", "normal");
    doc.text("THEINA 3D", 20, 62);
    doc.text("33240 Saint-André-de-Cubzac", 20, 67);
    doc.text("France", 20, 72);

    // Le Client (à droite)
    doc.setFont("helvetica", "bold");
    doc.text("DESTINATAIRE :", 120, 55);
    doc.setFont("helvetica", "normal");
    doc.text(clientName, 120, 62);
    doc.text(clientContact, 120, 67);
    const splitAddr = doc.splitTextToSize(clientAddr, 70);
    doc.text(splitAddr, 120, 72);

    // --- 4. TABLEAU DES PRESTATIONS ---
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 95, 190, 95); // Ligne de séparation

    // Entêtes du tableau
    doc.setFillColor(245, 245, 245);
    doc.rect(20, 105, 170, 8, 'F');
    doc.setFont("helvetica", "bold");
    doc.text("Désignation", 25, 110);
    doc.text("Qté", 140, 110);
    doc.text("Prix HT", 165, 110);

    // Ligne de l'objet
    doc.setFont("helvetica", "normal");
    doc.text(objet, 25, 122);
    doc.text(document.getElementById('qty').value || "1", 142, 122);
    const prixSansPort = (parseFloat(totalHT) - parseFloat(shipping)).toFixed(2);
    doc.text(`${prixSansPort} €`, 165, 122);

    // Ligne des frais de port (si > 0)
    if (parseFloat(shipping) > 0) {
        doc.text("Frais d'expédition", 25, 130);
        doc.text("1", 142, 130);
        doc.text(`${shipping} €`, 165, 130);
    }

    // --- 5. TOTAL ---
    doc.setDrawColor(100, 80, 160);
    doc.setLineWidth(0.5);
    doc.line(120, 145, 190, 145);
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("NET À PAYER :", 120, 155);
    doc.text(`${totalHT} € HT`, 160, 155);

    // --- 6. MENTIONS LÉGALES ---
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100);
    const mentions = [
        "TVA non applicable, article 293 B du Code général des impôts.",
        "Devis valable 30 jours à compter de la date d'émission.",
        "Auto-entrepreneur - Siret : [TON_NUMERO_SIRET]"
    ];
    doc.text(mentions, 20, 270);

    // Sauvegarde et ouverture
    const fileName = `DEVIS_${clientName.replace(/\s+/g, '_')}_${numDevis}.pdf`;
    doc.save(fileName);
}

window.onload = init;