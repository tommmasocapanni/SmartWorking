# Notifiche Push – Guida di setup

## 1. Genera le chiavi VAPID (una tantum)

Sul tuo computer o direttamente sul server Railway apri la shell e lancia:

```bash
npx web-push generate-vapid-keys
```

Otterrai qualcosa del tipo:

```
Public Key:  BxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxA
Private Key: yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy
```

## 2. Imposta le variabili d'ambiente su Railway

Nel pannello Railway del tuo servizio server, vai in **Variables** e aggiungi:

| Variabile          | Valore                        |
|--------------------|-------------------------------|
| VAPID_PUBLIC_KEY   | (la chiave pubblica generata) |
| VAPID_PRIVATE_KEY  | (la chiave privata generata)  |
| VAPID_MAILTO       | mailto:tua@email.com          |

Poi fai **Redeploy** del server.

## 3. Installa la dipendenza

Il `package.json` del server è già aggiornato con `"web-push": "^3.6.7"`.
Railway esegue `npm install` automaticamente al deploy, quindi non serve altro.

## 4. Rebuilda e rideploya la webapp

```bash
cd webapp
npm install
npm run build
```

Poi deploya la cartella `dist/` come sempre.

## 5. Attiva le notifiche sull'iPhone

1. Apri WorkRadar dalla **Home Screen** (non da Safari direttamente).
2. Vai in **Impostazioni** (icona ingranaggio).
3. Tab **sync**.
4. Premi **🔔 Attiva notifiche push**.
5. Accetta il permesso quando iOS lo chiede.

## Requisiti

- **iOS 16.4** o superiore
- App **aggiunta alla Home Screen** tramite Safari → "Aggiungi alla schermata Home"
- Safari (non Chrome/Firefox su iOS, che non supportano Web Push)

## Come funziona

Quando il server sincronizza nuove email via `/sync`, invia automaticamente
una notifica push a tutti i dispositivi registrati. La notifica arriva anche
se l'app è chiusa, grazie al Service Worker (`sw.js`).
