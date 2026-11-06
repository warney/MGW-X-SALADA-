import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// High limit for base64 images uploaded from phone/camera
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.resolve(DATA_DIR, 'store-data.json');

const OFFICIAL_LOGO_URL = '/assets/aistudio/file_000000007d38820eb94512f2855fdde9_ef02d89c.png';
const XSALADA_IMAGE = '/src/assets/images/mgw_xsalada_burger_1793924627575.jpg';
const COMBO_TUCHAUA_IMAGE = '/src/assets/images/mgw_combo_tuchaua_1793924628366.jpg';

const DEFAULT_PRODUCTS = [
  {
    id: 'xsalada-tradicional',
    name: 'X-Salada Tradicional',
    category: 'individual',
    description: 'Pão Brioche, carne de hambúrguer, queijo, presunto de peru, alface, tomate e ovo.',
    price: 12.00,
    imageUrl: XSALADA_IMAGE,
    active: true,
    highlight: 'O Mais Pedido',
    includedItems: [
      'Pão Brioche selado na chapa',
      'Carne de hambúrguer suculenta',
      'Queijo derretido',
      'Presunto de peru fatiado',
      'Alface e tomate frescos',
      'Ovo frito no ponto'
    ]
  },
  {
    id: 'combo-1',
    name: 'Combo 1',
    category: 'combo',
    description: '1 X-Salada + 1 refrigerante Tuchaua de 250 ml.',
    price: 12.00,
    imageUrl: COMBO_TUCHAUA_IMAGE,
    active: true,
    highlight: 'Individual Perfeito',
    includedItems: [
      '1 X-Salada Tradicional completo',
      '1 Refrigerante Guaraná Tuchaua 250ml geladinho'
    ]
  },
  {
    id: 'combo-2',
    name: 'Combo 2',
    category: 'combo',
    description: '2 X-Saladas + 1 refrigerante Tuchaua de 1 litro.',
    price: 21.50,
    imageUrl: COMBO_TUCHAUA_IMAGE,
    active: true,
    highlight: 'Ideal para 2 Pessoas',
    includedItems: [
      '2 X-Saladas Tradicionais completos',
      '1 Refrigerante Guaraná Tuchaua 1 Litro bem gelado'
    ]
  },
  {
    id: 'combo-3',
    name: 'Combo 3',
    category: 'combo',
    description: '3 X-Saladas + 1 refrigerante Tuchaua de 1 litro.',
    price: 29.50,
    imageUrl: COMBO_TUCHAUA_IMAGE,
    active: true,
    highlight: 'Super Econômico',
    includedItems: [
      '3 X-Saladas Tradicionais completos',
      '1 Refrigerante Guaraná Tuchaua 1 Litro'
    ]
  },
  {
    id: 'combo-4',
    name: 'Combo 4',
    category: 'combo',
    description: '4 X-Saladas + 1 refrigerante Tuchaua de 1 litro.',
    price: 37.00,
    imageUrl: COMBO_TUCHAUA_IMAGE,
    active: true,
    highlight: 'Para a Família',
    includedItems: [
      '4 X-Saladas Tradicionais completos',
      '1 Refrigerante Guaraná Tuchaua 1 Litro'
    ]
  },
  {
    id: 'combo-5',
    name: 'Combo 5',
    category: 'combo',
    description: '5 X-Saladas + 1 refrigerante Tuchaua de 1,5 litro.',
    price: 55.50,
    imageUrl: COMBO_TUCHAUA_IMAGE,
    active: true,
    highlight: 'Combo Galera',
    includedItems: [
      '5 X-Saladas Tradicionais completos',
      '1 Refrigerante Guaraná Tuchaua 1,5 Litro'
    ]
  }
];

const DEFAULT_CONFIG = {
  storeName: 'MGW X-SALADA',
  slogan: 'Sempre uma boa escolha!',
  whatsappNumber: '559281112510',
  openingHours: 'Terça a Domingo: 18h00 às 23h30',
  address: 'Rua Principal, Balcão de Retirada MGW',
  deliveryEstimate: '35 - 50 min',
  deliveryFeeNote: 'Taxa de entrega calculada de acordo com o bairro',
  isOpen: true,
  adminPassword: 'admin'
};

// Ensure data folder and file exist
const initStoreData = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DATA_FILE)) {
    const initialData = {
      products: DEFAULT_PRODUCTS,
      config: DEFAULT_CONFIG,
      updatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }

  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Erro ao ler store-data.json, recriando padrão:', err);
    const initialData = {
      products: DEFAULT_PRODUCTS,
      config: DEFAULT_CONFIG,
      updatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }
};

const getStoreData = () => {
  return initStoreData();
};

const saveStoreData = (data: any) => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const payload = {
    ...data,
    updatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(DATA_FILE, JSON.stringify(payload, null, 2), 'utf-8');
  return payload;
};

// API: Retorna cardápio público oficial e configurações
app.get('/api/menu', (req, res) => {
  try {
    const data = getStoreData();
    res.json({
      success: true,
      products: data.products || DEFAULT_PRODUCTS,
      config: data.config || DEFAULT_CONFIG,
      updatedAt: data.updatedAt,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Atualiza produtos ou configurações da loja
app.post('/api/menu/update', (req, res) => {
  try {
    const current = getStoreData();
    const { products, config } = req.body;

    const updated = {
      products: products ? products : current.products,
      config: config ? { ...current.config, ...config } : current.config,
    };

    saveStoreData(updated);

    res.json({
      success: true,
      products: updated.products,
      config: updated.config,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Atualiza imagem específica de um produto
app.post('/api/menu/product-image', (req, res) => {
  try {
    const { productId, imageUrl } = req.body;
    if (!productId || !imageUrl) {
      res.status(400).json({ success: false, error: 'productId e imageUrl são obrigatórios' });
      return;
    }

    const current = getStoreData();
    const products = (current.products || DEFAULT_PRODUCTS).map((p: any) => {
      if (p.id === productId) {
        return { ...p, imageUrl };
      }
      return p;
    });

    saveStoreData({ ...current, products });

    res.json({ success: true, productId, imageUrl });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Remove imagem de um produto e volta para a logo oficial
app.delete('/api/menu/product-image/:id', (req, res) => {
  try {
    const productId = req.params.id;
    const current = getStoreData();

    const products = (current.products || DEFAULT_PRODUCTS).map((p: any) => {
      if (p.id === productId) {
        return { ...p, imageUrl: OFFICIAL_LOGO_URL };
      }
      return p;
    });

    saveStoreData({ ...current, products });

    res.json({ success: true, productId, imageUrl: OFFICIAL_LOGO_URL });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// API: Restaura valores de fábrica
app.post('/api/menu/reset', (req, res) => {
  try {
    const resetData = {
      products: DEFAULT_PRODUCTS,
      config: DEFAULT_CONFIG,
    };
    saveStoreData(resetData);
    res.json({ success: true, products: DEFAULT_PRODUCTS, config: DEFAULT_CONFIG });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Start dev or production server
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`MGW X-SALADA Server running on port ${PORT}`);
  });
}

startServer();
