import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { INITIAL_MAIN_MENUS, INITIAL_CATEGORIES, INITIAL_TEMPLATES } from './src/data/initialData';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Path to persistent data storage file inside container
  const DATA_FILE = path.join(process.cwd(), 'rinjani_db_store.json');

  // Helper to load stored data or fallback to seed with automatic migration/normalization
  function loadData() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw);

        // Always use standard system Main Menus
        const mainMenus = INITIAL_MAIN_MENUS;
        const validMenuIds = new Set(mainMenus.map((m: any) => m.id));

        // Normalize Categories
        const categories = Array.isArray(parsed.categories)
          ? parsed.categories
          : [];

        const normalizedCategories = categories.map((c: any) => ({
          ...c,
          mainMenuId: (c.mainMenuId && validMenuIds.has(c.mainMenuId)) ? c.mainMenuId : 'menu-pk-live-chat',
        }));

        const catMainMap = new Map(normalizedCategories.map((c: any) => [c.id, c.mainMenuId]));

        // Normalize Templates
        const templates = Array.isArray(parsed.templates)
          ? parsed.templates
          : [];

        const normalizedTemplates = templates.map((t: any) => ({
          ...t,
          mainMenuId: t.mainMenuId || catMainMap.get(t.categoryId) || 'menu-pk-live-chat',
        }));

        return {
          mainMenus,
          categories: normalizedCategories,
          templates: normalizedTemplates,
          reports: parsed.reports || [],
        };
      }
    } catch (e) {
      console.error('Failed to read database file:', e);
    }
    return {
      mainMenus: INITIAL_MAIN_MENUS,
      categories: [],
      templates: [],
      reports: [],
    };
  }

  // Helper to save stored data
  function saveData(data: any) {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to write database file:', e);
    }
  }

  // --- API ROUTES ---
  app.get('/api/data', (req, res) => {
    const data = loadData();
    res.json(data);
  });

  app.post('/api/data', (req, res) => {
    const { mainMenus, categories, templates, reports } = req.body;
    if (!categories || !templates) {
      return res.status(400).json({ error: 'Invalid payload' });
    }
    const payload = {
      mainMenus: mainMenus || INITIAL_MAIN_MENUS,
      categories,
      templates,
      reports: reports || [],
    };
    saveData(payload);
    res.json({ status: 'ok', message: 'Data saved successfully' });
  });

  app.get('/api/health', (req, res) => {
    res.json({ status: 'online', service: 'Rinjani System Backend', version: '2.5 LIVE' });
  });

  // Serve static public folder explicitly for zip downloads
  app.use(express.static(path.join(process.cwd(), 'public')));

  // Dedicated endpoint for downloading production zip file
  app.get('/api/download-zip', (req, res) => {
    const zipPath = path.join(process.cwd(), 'public', 'rinjani-infinityfree.zip');
    
    // Auto re-generate zip if missing
    if (!fs.existsSync(zipPath)) {
      try {
        const { execSync } = require('child_process');
        execSync('python3 build_zip.py');
      } catch (err) {
        console.error('Failed to run build_zip.py:', err);
      }
    }

    if (fs.existsSync(zipPath)) {
      return res.download(zipPath, 'rinjani-infinityfree.zip');
    } else {
      return res.status(500).send('File zip belum siap.');
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
