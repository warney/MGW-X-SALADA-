import { Product, StoreConfig } from '../types';

export const OFFICIAL_LOGO_URL = '/assets/aistudio/file_000000007d38820eb94512f2855fdde9_ef02d89c.png';
export const HERO_BURGER_IMAGE = '/src/assets/images/mgw_hero_burger_1793924628211.jpg';
export const XSALADA_IMAGE = '/src/assets/images/mgw_xsalada_burger_1793924627575.jpg';
export const COMBO_TUCHAUA_IMAGE = '/src/assets/images/mgw_combo_tuchaua_1793924628366.jpg';
export const TUCHAUA_DRINK_IMAGE = '/src/assets/images/mgw_tuchaua_guarana_1793924628509.jpg';

export const INITIAL_PRODUCTS: Product[] = [
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

export const INITIAL_STORE_CONFIG: StoreConfig = {
  storeName: 'MGW X-SALADA',
  slogan: 'Sempre uma boa escolha!',
  whatsappNumber: '559281112510', // Official store WhatsApp number
  openingHours: 'Terça a Domingo: 18h00 às 23h30',
  address: 'Rua Principal, Balcão de Retirada MGW',
  deliveryEstimate: '35 - 50 min',
  deliveryFeeNote: 'Taxa de entrega calculada de acordo com o bairro',
  isOpen: true,
};
