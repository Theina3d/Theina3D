import pandas as pd
import json
import os

def exporter():
    nom_fichier_excel = 'Gestion_Theina3D.xlsx'
    
    if not os.path.exists(nom_fichier_excel):
        print(f"❌ Erreur : Le fichier '{nom_fichier_excel}' n'existe pas dans ce dossier.")
        return

    try:
        # Lecture de la première feuille de l'Excel
        df = pd.read_excel(nom_fichier_excel, sheet_name=0)
        
        produits = []
        for idx, row in df.iterrows():
            # On passe les lignes sans nom de produit
            if pd.isna(row.get('Produit')):
                continue

            # 1. Nettoyage du prix (PVU)
            prix_brut = str(row.get('PVU', 0)).replace(',', '.').replace('€', '').strip()
            try:
                prix = float(prix_brut)
            except ValueError:
                prix = 0.0

            # 2. Gestion de l'image (dossier CG/)
            img_val = str(row.get('image', '')).strip()
            if not img_val or img_val.lower() == 'nan':
                img_path = 'CG/Logo.svg'
            else:
                img_path = img_val if img_val.startswith('CG/') else f"CG/{img_val}"

            # 3. Récupération des dons et options bicolor
            pct_don = row.get('% dons', 0)
            try:
                pct_don_num = float(pct_don)
            except (ValueError, TypeError):
                pct_don_num = 0.0

            est_don = True if (pct_don_num >= 0.5 or str(row.get('dont asso', '')).strip() == '0,42 €') else False
            
            val_bicolor = str(row.get('bicolor', '')).upper()
            est_bicolor = True if (val_bicolor == 'TRUE' or val_bicolor == '1') else False

            # Construction du produit
            produits.append({
                "id": idx + 1,
                "sku": str(row.get('SKU', '')).strip() if not pd.isna(row.get('SKU')) else f"PROD-00{idx+1}",
                "nom": str(row.get('Produit', '')).strip(),
                "prix": prix,
                "description_courte": "Objet imprimé en 3D avec précision.",
                "description_longue": "Fabriqué à la commande avec du filament de haute qualité.",
                "image": img_path,
                "bicolor": est_bicolor,
                "don_asso": est_don
            })

        # Données globales avec les filaments
        data = {
            "filaments_disponibles": [
                { "id": 1, "nom": "Violet Pasteur", "matiere": "PLA", "en_stock": True },
                { "id": 2, "nom": "Noir Profond", "matiere": "PLA", "en_stock": True },
                { "id": 3, "nom": "Blanc Pur", "matiere": "PLA", "en_stock": True },
                { "id": 4, "nom": "Orange Pastel", "matiere": "PLA", "en_stock": True }
            ],
            "produits": produits
        }

        # Écriture dans le fichier produits.json
        with open('produits.json', 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        print("✅ Réussite ! Le fichier 'produits.json' a été généré avec succès.")

    except Exception as e:
        print(f"❌ Une erreur est survenue lors de l'export : {e}")

if __name__ == "__main__":
    exporter()