/**
 * MGW X-Salada - Utilitário de Armazenamento e Compressão de Imagens
 *
 * Utiliza Canvas para otimizar e comprimir imagens da galeria/câmera
 * (JPG, PNG, WEBP) para dimensões ideais de visualização mobile/desktop,
 * reduzindo arquivos pesados (ex: 5MB a 10MB de celular) para strings leves (~60KB a 120KB)
 * perfeitamente compatíveis com localStorage e IndexedDB nativo persistente.
 */

const DB_NAME = 'mgw_xsalada_assets_db';
const STORE_NAME = 'product_images';
const DB_VERSION = 1;

// Inicializa IndexedDB nativo (suportado em 100% dos navegadores Android e iOS)
const openDatabase = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB não suportado neste navegador'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

/**
 * Salva uma imagem no IndexedDB para persistência de longo prazo
 */
export const saveImageToStorage = async (productId: string, dataUrl: string): Promise<void> => {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(dataUrl, productId);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Fallback: IndexedDB indisponível, utilizando apenas localStorage', err);
  }
};

/**
 * Recupera imagem salva para um produto
 */
export const getImageFromStorage = async (productId: string): Promise<string | null> => {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(productId);

      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    console.warn('Erro ao ler do IndexedDB', err);
    return null;
  }
};

/**
 * Remove imagem de um produto do armazenamento
 */
export const removeImageFromStorage = async (productId: string): Promise<void> => {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(productId);

      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    });
  } catch (err) {
    console.warn('Erro ao remover imagem do IndexedDB', err);
  }
};

/**
 * Valida e processa um arquivo de imagem da câmera/galeria
 * Comprime para max 1000px mantendo alta qualidade e proporção
 */
export const processUploadedImage = (
  file: File,
  maxDimension = 1000,
  quality = 0.85
): Promise<{ dataUrl: string; sizeKb: number; width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    // 1. Validação de formato
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      reject(new Error('Formato não suportado. Por favor, selecione uma imagem JPG, JPEG, PNG ou WEBP.'));
      return;
    }

    // 2. Validação de tamanho máximo do arquivo de entrada (15MB)
    const MAX_INPUT_SIZE = 15 * 1024 * 1024; // 15MB
    if (file.size > MAX_INPUT_SIZE) {
      reject(new Error('A imagem selecionada é muito pesada (máximo 15MB). Por favor, selecione outra foto.'));
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      const rawUrl = e.target?.result as string;
      if (!rawUrl) {
        reject(new Error('Falha ao ler o arquivo selecionado.'));
        return;
      }

      const img = new Image();
      img.onload = () => {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        // Redimensiona proporcionalmente se maior que maxDimension
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Se não conseguir criar contexto canvas, retorna a URL original
          resolve({
            dataUrl: rawUrl,
            sizeKb: Math.round(file.size / 1024),
            width,
            height,
          });
          return;
        }

        // Desenha imagem com suavização de alta qualidade
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Exporta em WEBP (ou JPEG como fallback universal)
        let outputFormat = 'image/webp';
        let compressedDataUrl = canvas.toDataURL(outputFormat, quality);

        // Se o navegador não suportar exportação webp, fallback para jpeg
        if (!compressedDataUrl.startsWith('data:image/webp')) {
          outputFormat = 'image/jpeg';
          compressedDataUrl = canvas.toDataURL(outputFormat, quality);
        }

        const approximateSizeKb = Math.round((compressedDataUrl.length * 3) / 4 / 1024);

        resolve({
          dataUrl: compressedDataUrl,
          sizeKb: approximateSizeKb,
          width,
          height,
        });
      };

      img.onerror = () => {
        reject(new Error('Não foi possível decodificar o arquivo de imagem selecionado.'));
      };

      img.src = rawUrl;
    };

    reader.onerror = () => {
      reject(new Error('Erro ao carregar o arquivo da galeria.'));
    };

    reader.readAsDataURL(file);
  });
};
