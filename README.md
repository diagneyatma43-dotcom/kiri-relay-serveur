# Serveur relais KIRI Engine

Ce petit serveur se place entre l'application (le prototype HTML, puis la vraie app)
et l'API KIRI Engine. Il est le **seul** endroit qui connaît la clé API — le client
(navigateur du testeur/client) ne la voit jamais, même en inspectant le code.

## 1. Installation

```
cd kiri-relay-server
npm install
```

## 2. Configuration

```
cp .env.example .env
```

Puis ouvre `.env` et colle ta vraie clé KIRI Engine (créée sur kiriengine.app) :

```
KIRI_API_KEY=ta_vraie_cle_ici
```

## 3. Lancer le serveur

```
npm start
```

Tu dois voir : `Serveur relais KIRI Engine démarré sur http://localhost:3001`

Teste qu'il tourne bien en ouvrant http://localhost:3001/api/health dans un navigateur —
tu dois voir `{"ok":true,"kiriConfigured":true}`.

## 4. Brancher le prototype dessus

Dans `prototype-complet.html`, tout en haut du `<script>`, il y a :

```js
const RELAY_BASE = 'http://localhost:3001';
```

- **Pour tester depuis l'ordinateur qui fait tourner le serveur** : laisse tel quel.
- **Pour tester depuis un téléphone** (le cas des testeurs) : `localhost` ne fonctionnera
  pas sur leur téléphone, il faut que le serveur soit accessible depuis internet. Deux options :
  - **Rapide pour un test ponctuel** : utilise [ngrok](https://ngrok.com) (`ngrok http 3001`),
    qui te donne une URL publique temporaire à coller dans `RELAY_BASE`.
  - **Pour une phase de test plus longue / la vraie appli** : déploie ce dossier sur un
    hébergeur gratuit ou pas cher (Render, Railway, Fly.io...), et mets l'URL qu'il te donne
    dans `RELAY_BASE`. N'oublie pas d'y configurer la variable d'environnement `KIRI_API_KEY`
    dans les réglages de l'hébergeur (pas de fichier `.env` en ligne).

## Endpoints exposés

- `POST /api/scan/video` — reçoit la vidéo filmée (champ `videoFile`) + `isMask` (0 ou 1),
  renvoie `{ ok, serialize }`.
- `GET /api/scan/status/:serialize` — renvoie `{ ok, status }` (statut KIRI Engine).
- `GET /api/scan/download/:serialize` — renvoie `{ ok, modelUrl }` une fois le statut à 2 (succès).

La clé API ne sort jamais de ce serveur.
