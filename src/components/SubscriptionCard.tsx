import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { StripeProduct } from '@/stripe-config';

interface SubscriptionCardProps {
  product: StripeProduct;
  isLoading: boolean;
  onSubscribe: (priceId: string) => void;
  currentSubscription?: {
    subscription_status: string;
    price_id: string;
  } | null;
}

export const SubscriptionCard: React.FC<SubscriptionCardProps> = ({
  product,
  isLoading,
  onSubscribe,
  currentSubscription,
}) => {
  const isCurrentPlan = currentSubscription?.price_id === product.priceId;
  const hasActiveSubscription = currentSubscription?.subscription_status === 'active';

  const getStatusBadge = () => {
    if (isCurrentPlan && hasActiveSubscription) {
      return <Badge variant="default">Plano Atual</Badge>;
    }
    if (hasActiveSubscription && !isCurrentPlan) {
      return <Badge variant="secondary">Disponível</Badge>;
    }
    return <Badge variant="outline">Disponível</Badge>;
  };

  const getButtonText = () => {
    if (isCurrentPlan && hasActiveSubscription) {
      return 'Plano Ativo';
    }
    if (product.mode === 'subscription') {
      return 'Assinar Agora';
    }
    return 'Comprar Agora';
  };

  const isButtonDisabled = isLoading || (isCurrentPlan && hasActiveSubscription);

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl">{product.name}</CardTitle>
          {getStatusBadge()}
        </div>
        <CardDescription className="text-sm text-muted-foreground">
          {product.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          R$ 17,90
          {product.mode === 'subscription' && <span className="text-sm font-normal">/mês</span>}
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={() => onSubscribe(product.priceId)}
          disabled={isButtonDisabled}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processando...
            </>
          ) : (
            getButtonText()
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};