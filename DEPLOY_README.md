# WorkRadar

Dashboard personale per lavori freelance. Legge Gmail e register.it via IMAP.

## Struttura repo

```
workradar/ 
├── webapp/          ← React app (deploy su GitHub Pages)
├── server/          ← Node.js proxy IMAP (deploy su Railway)
└── .github/
    └── workflows/
        └── deploy.yml
```

## Deploy

### 1. GitHub Pages (webapp)

1. Vai su repo → Settings → Pages
2. Source: **GitHub Actions**
3. Push su `main` → deploy automatico

### 2. Railway (server)

1. railway.app → New Project → Deploy from GitHub
2. Seleziona il repo, cartella **root: server**
3. Aggiungi variabile d'ambiente:
   - `WORKRADAR_SECRET` = una stringa segreta a tua scelta (es. una password lunga)
   - `ALLOWED_ORIGIN` = URL del tuo GitHub Pages (es. https://tuonome.github.io)
4. Railway ti dà un URL tipo: `https://workradar-server-xyz.railway.app`

### 3. Configura la webapp

Nella webapp, clicca `+ register.it` e inserisci:
- **URL server**: l'URL di Railway
- **Secret token**: la stringa segreta che hai impostato
- Email, password, API key Anthropic

## Sviluppo locale

```bash
# Server
cd server && npm install && npm start

# Webapp
cd webapp && npm install && npm run dev
```
