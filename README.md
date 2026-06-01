# AUTO.DE Fahrzeugverkauf

Projet web statique adapte en site de vente/catalogue.

## Lancer

```powershell
npm run start
```

Puis ouvrir `http://localhost:4173`.

## Catalogue local

Les vehicules importes depuis `Auto.zip` sont charges depuis `cars.json`.

Les galeries completes sont dans `assets/cars/`. Chaque dossier `auto-001`, `auto-002`, etc. correspond a un vehicule.

Pour ajouter une voiture manuellement, ajouter un dossier images dans `assets/cars/`, puis ajouter une entree dans `cars.json` avec `bildUrl` et `images`.

## Flux de donnees futur

Le flux attendu peut etre JSON public en GET ou CSV brut public. Pour le JSON, la structure supportee est celle fournie :

- `id`
- `marke`
- `modell`
- `baujahr`
- `kraftstoff`
- `kilometerstand`
- `getriebe`
- `preis`
- `bildUrl`, injecte directement dans `<img src="...">`
- `status`

Pour brancher le endpoint final Sheety/Airtable, remplacer `FEED_URL` dans `app.js`.

## Contact

Le site utilise maintenant WhatsApp et e-mail pour les demandes client.

Dans `app.js`, les constantes sont :

- `WHATSAPP_NUMBER`
- `CONTACT_EMAIL`

Chaque voiture genere un message WhatsApp/e-mail avec :

- `vehicle_id`
- `vehicle_model`
- `vehicle_price`
- `subject`
