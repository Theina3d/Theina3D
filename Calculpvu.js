const SHEETDB_URL = "https://sheetdb.io/api/v1/4kexbmu4y8qtc"; 
const CONFIG = { electricity: 0.22, material_kg: 25, machine_wear: 0.16, charge_rate: 0.212 };

async function init() {
    const matSelect = document.getElementById('mat_custom');
    
    try {
        const res = await fetch(`${SHEETDB_URL}?sheet=Stocks`);
        const all = await res.json();
        
        // On crée une liste unique "Matière - Couleur" pour le menu
        let matieresUniques = [...new Set(all.map(s => `${s.mat} - ${s.col}`))];
        
        matSelect.innerHTML = "";
        matieresUniques.forEach(m => {
            let o = document.createElement('option');
            o.text = m; o.value = m;
            matSelect.add(o);
        });
    } catch (e) { console.log("Erreur de chargement des matières"); }

    refreshClientList();
}

// GESTION CLIENTS
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
    alert("Client enregistré !");
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

// GÉNÉRATION DEVIS ET ATTENTE DE STOCK
async function genererPDF() {
    const numDevis = "D-" + Date.now().toString().slice(-6);
    const fullMat = document.getElementById('mat_custom').value; 
    const parts = fullMat.split(' - '); // On sépare la matière de la couleur

    if(document.getElementById('mode_projet').value === 'impression') {
        const attente = {
            numDevis: numDevis,
            mat: parts[0] || "",
            col: parts[1] || "",
            poids: parseFloat(document.getElementById('p_imp').value) * parseFloat(document.getElementById('qty').value)
        };

        await fetch(`${SHEETDB_URL}?sheet=Attentes`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ data: [attente] })
        });
        alert("Devis généré. Sortie de stock en attente.");
    }
    // Ici insérer ton code jsPDF pour le téléchargement...
}

window.onload = init;