import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getProductByPriceId } from '@/stripe-config';

interface SubscriptionData {
  subscription_status: string;
  price_id: string;
  current_period_end: number;
  cancel_at_period_end: boolean;
}

export const SubscriptionStatus: React.FC = () => {
  const { user } = useAuth();

  const { data: subscription, isLoading, error } = useQuery<SubscriptionData | null>({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('stripe_user_subscriptions')
        .select('subscription_status, price_id, current_period_end, cancel_at_period_end')
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  if (!user) return null;

  if (isLoading) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-24" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-destructive">Erro</CardTitle>
          <CardDescription>
            Não foi possível carregar informações da assinatura
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!subscription || !subscription.price_id) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Status da Assinatura</CardTitle>
          <CardDescription>Você não possui uma assinatura ativa</CardDescription>
        </CardHeader>
        <CardContent>
          <Badge variant="outline">Sem Assinatura</Badge>
        </CardContent>
      </Card>
    );
  }

  const product = getProductByPriceId(subscription.price_id);
  const statusMap: Record<string, { label: string; variant: "default" | "destructive" | "outline" | "secondary" }> = {
    active: { label: 'Ativa', variant: 'default' },
    trialing: { label: 'Período de Teste', variant: 'secondary' },
    past_due: { label: 'Pagamento Pendente', variant: 'destructive' },
    canceled: { label: 'Cancelada', variant: 'outline' },
    incomplete: { label: 'Incompleta', variant: 'destructive' },
    incomplete_expired: { label: 'Expirada', variant: 'destructive' },
    unpaid: { label: 'Não Paga', variant: 'destructive' },
    paused: { label: 'Pausada', variant: 'outline' },
  };

  const status = statusMap[subscription.subscription_status] || { label: subscription.subscription_status, variant: 'outline' as const };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Status da Assinatura</CardTitle>
        <CardDescription>
          {product ? product.name : 'Plano Desconhecido'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Status:</span>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
        
        {subscription.current_period_end && subscription.subscription_status === 'active' && (
          <div className="text-sm text-muted-foreground">
            {subscription.cancel_at_period_end ? 'Cancela em: ' : 'Renova em: '}
            {new Date(subscription.current_period_end * 1000).toLocaleDateString('pt-BR')}
          </div>
        )}
      </CardContent>
    </Card>
  );
};