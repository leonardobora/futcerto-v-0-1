export interface StripeProduct {
  priceId: string;
  name: string;
  description: string;
  mode: 'payment' | 'subscription';
}

export const stripeProducts: StripeProduct[] = [
  {
    priceId: 'price_1RRKyRCdZxla5RSso1nxJSsa',
    name: 'JOIN BORA LABS',
    description: 'Acesso completo à plataforma Bora Labs com todas as funcionalidades premium.',
    mode: 'subscription',
  },
];

export const getProductByPriceId = (priceId: string): StripeProduct | undefined => {
  return stripeProducts.find(product => product.priceId === priceId);
};