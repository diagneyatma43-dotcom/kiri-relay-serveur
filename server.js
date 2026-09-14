require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 200 * 1024 * 1024 } });

// En prototype/tests, on autorise toutes les origines pour simplifier
// (ouverture du fichier HTML en local, tests depuis un téléphone, etc.).
// En production, restreins ceci au(x) domaine(s) réel(s) de l'application.
app.use(cors());

const KIRI_API_KEY = process.env.KIRI_API_KEY;
const KIRI_BASE = 'https://api.kiriengine.app/api/v1/open';

if (!KIRI_API_KEY) {
  console.warn('⚠️  KIRI_API_KEY manquant. Crée un fichier .env (voir .env.example) avec ta clé KIRI Engine.');
}

// Petite vérification de vie du serveur
app.get('/api/health', (req, res) => {
  res.json({ ok: true, kiriConfigured: !!KIRI_API_KEY });
});

// 1) Upload d'une vidéo de scan (pièce ou produit) → crée une tâche KIRI Engine
app.post('/api/scan/video', upload.single('videoFile'), async (req, res) => {
  try {
    if (!KIRI_API_KEY) {
      return res.status(500).json({ ok: false, error: 'Clé API KIRI Engine non configurée sur le serveur.' });
    }
    if (!req.file) {
      return res.status(400).json({ ok: false, error: 'Aucune vidéo reçue.' });
    }
    const isMask = req.body.isMask === '1' ? '1' : '0';

    const form = new FormData();
    form.append('videoFile', new Blob([req.file.buffer]), req.file.originalname || 'scan.webm');
    form.append('modelQuality', '1');
    form.append('textureQuality', '1');
    form.append('fileFormat', 'GLB');
    form.append('isMask', isMask);
    form.append('textureSmoothing', '1');

    const kiriRes = await fetch(`${KIRI_BASE}/photo/video`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${KIRI_API_KEY}` },
      body: form
    });
    const json = await kiriRes.json();
    if (!kiriRes.ok || !json.ok) {
      return res.status(502).json({ ok: false, error: json.msg || `Erreur KIRI Engine (${kiriRes.status})` });
    }
    res.json({ ok: true, serialize: json.data.serialize });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: 'Erreur serveur relais.' });
  }
});

// 2) Statut d'une tâche de modélisation en cours
app.get('/api/scan/status/:serialize', async (req, res) => {
  try {
    if (!KIRI_API_KEY) return res.status(500).json({ ok: false, error: 'Clé API non configurée.' });
    const kiriRes = await fetch(`${KIRI_BASE}/model/getStatus?serialize=${encodeURIComponent(req.params.serialize)}`, {
      headers: { Authorization: `Bearer ${KIRI_API_KEY}` }
    });
    const json = await kiriRes.json();
    res.json({ ok: !!json.ok, status: json.data && json.data.status });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: 'Erreur serveur relais.' });
  }
});

// 3) Lien de téléchargement du modèle une fois terminé
app.get('/api/scan/download/:serialize', async (req, res) => {
  try {
    if (!KIRI_API_KEY) return res.status(500).json({ ok: false, error: 'Clé API non configurée.' });
    const kiriRes = await fetch(`${KIRI_BASE}/model/getModelZip?serialize=${encodeURIComponent(req.params.serialize)}`, {
      headers: { Authorization: `Bearer ${KIRI_API_KEY}` }
    });
    const json = await kiriRes.json();
    res.json({ ok: !!json.ok, modelUrl: json.data && json.data.modelUrl });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: 'Erreur serveur relais.' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Serveur relais KIRI Engine démarré sur http://localhost:${PORT}`);
});
