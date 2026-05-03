// --- CONFIGURATION ---
const CONFIG = { 
    electricity: 0.22, 
    material_kg: 25, 
    machine_wear: 0.16, 
    charge_rate: 0.212 
};

const DATABASE = {
    materials: ["PLA", "PETG", "ASA", "ABS", "TPU", "Résine Standard"],
    colors: ["Noir", "Blanc", "Gris", "Rouge", "Bleu", "Silk Gold", "Argent", "Vert"]
};

// --- INITIALISATION ---
function init() {
    const matSelect = document.getElementById('mat_custom');
    const colSelect = document.getElementById('color_custom');
    
    // Récupérer le stock actuel
    const stock = JSON.parse(localStorage.getItem('t3d_stock')) || {};
    
    // On vide les sélecteurs actuels
    matSelect.innerHTML = "";
    colSelect.innerHTML = "";

    // Extraire les matières et couleurs uniques du stock
    let matieresUniques = new Set();
    let couleursUniques = new Set();

    for (let id in stock) {
        matieresUniques.add(stock[id].mat);
        couleursUniques.add(stock[id].col);
    }

    // Remplir le menu Matières
    if (matieresUniques.size === 0) {
        let opt = document.createElement('option');
        opt.text = "⚠️ Aucun stock enregistré";
        matSelect.add(opt);
    } else {
        matieresUniques.forEach(m => {
            let o = document.createElement('option');
            o.value = m; o.text = m;
            matSelect.add(o);
        });
    }

    // Remplir le menu Couleurs
    couleursUniques.forEach(c => {
        let o = document.createElement('option');
        o.value = c; o.text = c;
        colSelect.add(o);
    });

    refreshClientList();
    toggleFormMode();
}

// --- LOGIQUE DE CALCUL ---
function update(source) {
    const mode = document.getElementById('mode_projet').value;
    const qty = parseFloat(document.getElementById('qty').value) || 1;
    const shipping = parseFloat(document.getElementById('shipping_cost').value) || 0;
    const techZone = document.getElementById('tech_details');
    
    let dElec = 0, dMat = 0, dUsure = 0, fGest = 0, dConception = 0;
    let techHtml = "";

    if (mode === 'conception') {
        dConception = parseFloat(document.getElementById('concep_complex').value) || 0;
        const nbEchanges = parseFloat(document.getElementById('nb_echanges').value) || 3;
        fGest = (nbEchanges > 3) ? (nbEchanges - 3) * 2 : 0;
        
        techHtml = `<div class="cost-line" style="color:#666; font-size:0.8rem;"><span>🎨 Complexité design</span><span>${dConception.toFixed(2)}€</span></div>`;
        if(fGest > 0) techHtml += `<div class="cost-line" style="color:#666; font-size:0.8rem;"><span>💬 Révisions sup.</span><span>${fGest.toFixed(2)}€</span></div>`;
    } else {
        const h = parseFloat(document.getElementById('h_imp').value) || 0;
        const p = parseFloat(document.getElementById('p_imp').value) || 0;
        dElec = h * 0.15 * CONFIG.electricity;
        dMat = (p / 1000) * CONFIG.material_kg;
        dUsure = h * CONFIG.machine_wear;
        fGest = 3.00; // Frais fixe gestion par impression

        techHtml = `
            <div class="cost-line" style="color:#666; font-size:0.8rem;"><span>⚡ Électricité</span><span>${dElec.toFixed(2)}€</span></div>
            <div class="cost-line" style="color:#666; font-size:0.8rem;"><span>🧵 Matière</span><span>${dMat.toFixed(2)}€</span></div>
            <div class="cost-line" style="color:#666; font-size:0.8rem;"><span>⚙️ Usure</span><span>${dUsure.toFixed(2)}€</span></div>
            <div class="cost-line" style="color:#666; font-size:0.8rem;"><span>🛠️ Fixe Gestion</span><span>${fGest.toFixed(2)}€</span></div>`;
    }

    techZone.innerHTML = techHtml;
    const baseProdHT = dElec + dMat + dUsure + fGest + dConception;
    
    let totalFinal;
    if (source === 'params') {
        // Applique une marge automatique de 1.5 sur la prod quand on change les inputs
        const totalHTPresta = (baseProdHT * 1.5) / (1 - CONFIG.charge_rate);
        totalFinal = totalHTPresta + shipping;
        document.getElementById('input_total_ht').value = totalFinal.toFixed(2);
    } else {
        // Prend la valeur saisie manuellement dans le gros chiffre orange
        totalFinal = parseFloat(document.getElementById('input_total_ht').value) || 0;
    }

    const chargesUrssaf = totalFinal * CONFIG.charge_rate;
    const netBenefice = totalFinal - chargesUrssaf - baseProdHT - shipping;

    // Affichage des résultats
    document.getElementById('res_base').innerText = baseProdHT.toFixed(2) + "€";
    document.getElementById('res_shipping').innerText = shipping.toFixed(2) + "€";
    document.getElementById('res_charges').innerText = chargesUrssaf.toFixed(2) + "€";
    document.getElementById('res_revient').innerText = (baseProdHT + chargesUrssaf + shipping).toFixed(2) + "€";
    document.getElementById('res_net').innerText = netBenefice.toFixed(2) + "€";
    document.getElementById('display_unit').innerText = `soit ${(totalFinal / qty).toFixed(2)}€ / pièce`;

    // Couleur du bénéfice
    document.getElementById('net_container').style.background = netBenefice < 0 ? "#4a2a2a" : "#3d342d";
}

// --- INTERFACE ---
function toggleFormMode() {
    const m = document.getElementById('mode_projet').value;
    document.getElementById('form_conception').classList.toggle('hidden', m !== 'conception');
    document.getElementById('form_impression').classList.toggle('hidden', m !== 'impression');
    
    // Masquer matière/couleur si conception
    const rowMat = document.getElementById('row_mat_color');
    if(m === 'conception') rowMat.classList.add('hidden');
    else rowMat.classList.remove('hidden');

    update('params');
}

// --- CLIENTS ---
function saveClient() {
    const name = document.getElementById('client_name').value;
    if(!name) return alert("Nom requis");
    let db = JSON.parse(localStorage.getItem('t3d_db')) || {};
    db[name] = { contact: document.getElementById('client_contact').value, address: document.getElementById('client_address').value };
    localStorage.setItem('t3d_db', JSON.stringify(db));
    refreshClientList();
    alert("Client enregistré !");
}

function refreshClientList() {
    const list = document.getElementById('client_list');
    const db = JSON.parse(localStorage.getItem('t3d_db')) || {};
    list.innerHTML = '<option value="">📂 Charger un client...</option>';
    for (let n in db) { let o = document.createElement('option'); o.value = n; o.text = n; list.add(o); }
}

function loadClient() {
    const name = document.getElementById('client_list').value;
    if(!name) return;
    const c = JSON.parse(localStorage.getItem('t3d_db'))[name];
    document.getElementById('client_name').value = name;
    document.getElementById('client_contact').value = c.contact;
    document.getElementById('client_address').value = c.address;
}

// --- PDF ---
function genererPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // --- BLOC DES VARIABLES ---
    const mode = document.getElementById('mode_projet').value;
    const shipping = parseFloat(document.getElementById('shipping_cost').value) || 0;
    const totalHT = parseFloat(document.getElementById('input_total_ht').value) || 0;
    const date = new Date();
    
    // Formatage de la date en AAAAMMJJ
    const dateStr = date.getFullYear() + 
                    String(date.getMonth() + 1).padStart(2, '0') + 
                    String(date.getDate()).padStart(2, '0');

    // Définition du préfixe et nettoyage des noms
    const prefixe = (mode === 'conception') ? 'CO' : 'IM';
    const projetNom = document.getElementById('designation_custom').value.trim() || "Projet";
    const clientNom = document.getElementById('client_name').value.trim() || "Client";
    const clientNettoyé = clientNom.replace(/\s+/g, ''); 

    // Construction du numéro de devis : PREFIXE-AAAAMMJJ-Client
    const numDevis = `${prefixe}-${dateStr}-${clientNettoyé}`;
    // ---------------------------

    // Entête du PDF
    doc.setFontSize(22); doc.setTextColor(144, 57, 205); doc.text("THEINA3D", 20, 20);
    doc.setFontSize(9); doc.setTextColor(80); 
    doc.text(["SIRET : [TON_SIRET]", "TVA non applicable, art. 293 B du CGI"], 20, 30);
    
    doc.setTextColor(0); 
    doc.text(`Devis n° : ${numDevis}`, 140, 25); 
    doc.text(`Date : ${date.toLocaleDateString()}`, 140, 32);
    doc.text(`Client : ${clientNom}`, 140, 42);

    // Tableau
    doc.setDrawColor(200);
    doc.line(20, 60, 190, 60);
    doc.setFontSize(10);
    doc.text("Description", 25, 68); doc.text("Total HT", 170, 68);
    doc.line(20, 72, 190, 72);
    
    let y = 82;
    const textePresta = (mode === 'impression' ? "Prestation Impression 3D : " : "Prestation Conception 3D : ") + projetNom;
    doc.text(textePresta, 25, y);
    doc.text(`${(totalHT - shipping).toFixed(2)} €`, 170, y);
    
    if(shipping > 0) {
        y += 10;
        doc.text("Frais de livraison", 25, y);
        doc.text(`${shipping.toFixed(2)} €`, 170, y);
    }
    
    // Total
    doc.setFontSize(14); 
    doc.text(`TOTAL À PAYER : ${totalHT.toFixed(2)} €`, 120, y + 20);
    
    // --- LIEN AVEC LE STOCK ---
    if(mode === 'impression') {
        let attentes = JSON.parse(localStorage.getItem('t3d_attentes')) || [];
        attentes.push({
            numDevis: numDevis,
            mat: document.getElementById('mat_custom').value,
            col: document.getElementById('color_custom').value,
            poids: parseFloat(document.getElementById('p_imp').value) * parseFloat(document.getElementById('qty').value),
            date: new Date().toLocaleDateString()
        });
        localStorage.setItem('t3d_attentes', JSON.stringify(attentes));
    }
    // Sauvegarde avec le nom au format souhaité
    doc.save(`${numDevis}.pdf`);
}

window.onload = init;