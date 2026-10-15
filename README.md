# Spaghetti-App

## Projectstatus

Deze repository bevat momenteel een statische HTML-, CSS- en JavaScript-app. De ratings worden in de browser opgeslagen met `localStorage`. De kaart gebruikt Leaflet en OpenStreetMap; plaatszoeken is optioneel en gebruikt een Geoapify-sleutel die lokaal in de browser wordt bewaard.

### Supabase

Supabase is in deze checkout nog niet aangesloten. Er zijn geen Supabase-clientaanroepen, projectconfiguratie, database-migraties, Edge Functions, authenticatie of redirect-URL's aanwezig. Er staan ook geen Supabase-projectsleutels in deze map. Ratings synchroniseren dus niet tussen apparaten of gebruikers.

### Docker Desktop

Deze app gebruikt momenteel geen Docker. Er is geen `Dockerfile`, `docker-compose.yml`/`compose.yaml` of lokale Supabase-containerconfiguratie. Docker Desktop is voor de huidige lokale preview niet nodig.

## Lokaal starten

Installeer Node.js en voer vanuit deze map uit:

```sh
node serve.js
```

Open daarna <http://localhost:8765/>. Dit start een eenvoudige previewserver; het is geen productiehosting of databaseserver.

## Veilig omgaan met configuratie

Commit geen Supabase-service-role-sleutels, wachtwoorden of andere geheimen. `.env`-bestanden worden door `.gitignore` uitgesloten; `.env.example` is toegestaan voor niet-geheime voorbeeldnamen en placeholders. Als Supabase later wordt toegevoegd, documenteer dan hier de lokale startstappen, migraties, vereiste variabelen en geconfigureerde productie-redirect-URL's zonder geheime waarden op te nemen.

## GitHub

De projectrepository is `wolfdehulsre/Spaghetti-App`, branch `main`. De bronbestanden in deze map zijn gecontroleerd tegen die branch. Deze README beschrijft expliciet welke database- en Docker-onderdelen nog ontbreken.
