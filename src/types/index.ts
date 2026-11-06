export type ProductCategory = 'individual' | 'combo';

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  description: string;
  price: number;
  imageUrl: string;
  active: boolean;
  highlight?: string;
  includedItems?: string[];
}

export interface CartItem {
  cartId: string;
  productId: string;
  product: Product;
  quantity: number;
  notes?: string;
}

export type OrderType = 'entrega' | 'retirada';
export type PaymentMethod = 'pix' | 'dinheiro' | 'debito' | 'credito';

export interface CustomerData {
  name: string;
  phone?: string;
  orderType: OrderType;
  address: {
    street: string;
    number: string;
    neighborhood: string;
    reference?: string;
  };
  paymentMethod: PaymentMethod;
  needsChange: boolean;
  changeFor?: string;
}

export interface StoreConfig {
  storeName: string;
  slogan: string;
  whatsappNumber: string; // Brazilian format: DDD + number (e.g. 92981234567)
  openingHours: string;
  address: string;
  deliveryEstimate: string;
  deliveryFeeNote: string;
  isOpen: boolean;
  adminPassword: string;
}
