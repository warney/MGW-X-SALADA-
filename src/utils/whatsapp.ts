import { CartItem, CustomerData, StoreConfig } from '../types';
import { formatCurrency, cleanPhoneNumber } from './formatters';

export interface WhatsAppOrderPayload {
  customer: CustomerData;
  cart: CartItem[];
  total: number;
  config: StoreConfig;
}

export const generateOrderMessage = ({
  customer,
  cart,
  total,
  config
}: WhatsAppOrderPayload): string => {
  const paymentLabels: Record<CustomerData['paymentMethod'], string> = {
    pix: 'Pix',
    dinheiro: 'Dinheiro',
    debito: 'Cartão de Débito',
    credito: 'Cartão de Crédito',
  };

  const lines: string[] = [];

  lines.push(`🍔 *PEDIDO — ${config.storeName || 'MGW X-SALADA'}*`);
  lines.push(`_${config.slogan || 'Sempre uma boa escolha!'}_`);
  lines.push('────────────────────────');
  lines.push(`👤 *Nome do Cliente:* ${customer.name.trim()}`);
  lines.push(`🛵 *Modalidade:* ${customer.orderType === 'entrega' ? 'Entrega em Domicílio' : 'Retirada no Balcão'}`);

  if (customer.orderType === 'entrega') {
    lines.push('');
    lines.push('📍 *Endereço para Entrega:*');
    lines.push(`• *Rua/Av:* ${customer.address.street.trim()}, Nº ${customer.address.number.trim()}`);
    lines.push(`• *Bairro:* ${customer.address.neighborhood.trim()}`);
    if (customer.address.reference?.trim()) {
      lines.push(`• *Ponto de Ref:* ${customer.address.reference.trim()}`);
    }
  } else {
    lines.push('');
    lines.push('📍 *Local para Retirada:*');
    lines.push(`• ${config.address || 'Balcão de Atendimento MGW X-Salada'}`);
  }

  lines.push('');
  lines.push('📋 *ITENS DO PEDIDO:*');
  cart.forEach((item, index) => {
    const itemTotal = item.product.price * item.quantity;
    lines.push(
      `${index + 1}. *${item.quantity}x ${item.product.name}* — ${formatCurrency(item.product.price)} cada | Subtotal: *${formatCurrency(itemTotal)}*`
    );
    if (item.product.description) {
      lines.push(`   _${item.product.description}_`);
    }
    if (item.notes && item.notes.trim()) {
      lines.push(`   ⚠️ *Obs:* ${item.notes.trim()}`);
    }
  });

  lines.push('');
  lines.push('────────────────────────');
  lines.push(`💳 *Forma de Pagamento:* ${paymentLabels[customer.paymentMethod]}`);

  if (customer.paymentMethod === 'dinheiro') {
    if (customer.needsChange && customer.changeFor?.trim()) {
      lines.push(`💵 *Troco Solicitado:* Sim (Troco para ${customer.changeFor.trim()})`);
    } else {
      lines.push('💵 *Troco Solicitado:* Não (Valor exato, não precisa de troco)');
    }
  }

  lines.push('────────────────────────');
  lines.push(`💰 *VALOR TOTAL: ${formatCurrency(total)}*`);
  lines.push('────────────────────────');
  lines.push('Olá! Gostaria de confirmar o envio deste pedido para a MGW X-Salada.');

  return lines.join('\n');
};

export const buildWhatsAppUrl = (
  rawNumber: string,
  message: string
): { url: string; isValidNumber: boolean } => {
  const digitsOnly = cleanPhoneNumber(rawNumber);

  // If phone starts with 55 and has at least 12 digits (55 + 2 DDD + 8 or 9 digits)
  // or if it's just the Brazilian national number (10 or 11 digits)
  let fullNumber = digitsOnly;
  if (!fullNumber.startsWith('55') && (fullNumber.length === 10 || fullNumber.length === 11)) {
    fullNumber = `55${fullNumber}`;
  }

  const isValidNumber = fullNumber.length >= 12; // 55 + DDD (2) + 8 or 9 digits
  const encodedText = encodeURIComponent(message);
  const targetNumber = isValidNumber ? fullNumber : '559281112510';

  return {
    url: `https://wa.me/${targetNumber}?text=${encodedText}`,
    isValidNumber: true,
  };
};
