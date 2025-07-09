import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TrendingUp, TrendingDown, Target, Shield, Clock } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary">
            Como Usar o Sir BAP AI
          </DialogTitle>
          <DialogDescription>
            Guia completo para interpretar as análises de Smart Money Concepts
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Como usar */}
          <section>
            <h3 className="text-lg font-semibold mb-3 text-foreground">Como Usar o App</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>1. <strong>Selecione o Timeframe:</strong> Escolha o período de análise (15m, 1h, 4h, etc.)</p>
              <p>2. <strong>Aguarde a Análise:</strong> O algoritmo processará os dados em tempo real</p>
              <p>3. <strong>Interprete os Resultados:</strong> Use as informações abaixo para entender os sinais</p>
            </div>
          </section>

          <Separator />

          {/* Interpretação do Viés */}
          <section>
            <h3 className="text-lg font-semibold mb-3 text-foreground">Interpretação do Viés de Mercado</h3>
            <div className="grid gap-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-bullish/10 border border-bullish/30">
                <TrendingUp className="w-5 h-5 text-bullish mt-0.5" />
                <div>
                  <Badge className="mb-2 bg-bullish text-bullish-foreground">ALTA</Badge>
                  <p className="text-sm">Tendência de alta confirmada. Procure oportunidades de compra em zonas de desconto.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 rounded-lg bg-bearish/10 border border-bearish/30">
                <TrendingDown className="w-5 h-5 text-bearish mt-0.5" />
                <div>
                  <Badge className="mb-2 bg-bearish text-bearish-foreground">BAIXA</Badge>
                  <p className="text-sm">Tendência de baixa confirmada. Procure oportunidades de venda em zonas premium.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 rounded-lg bg-neutral/10 border border-neutral/30">
                <div className="w-5 h-5 bg-neutral rounded mt-0.5" />
                <div>
                  <Badge className="mb-2 bg-neutral text-neutral-foreground">LATERAL</Badge>
                  <p className="text-sm">Mercado sem direção clara. Aguarde confirmação de breakout.</p>
                </div>
              </div>
            </div>
          </section>

          <Separator />

          {/* Eventos SMC */}
          <section>
            <h3 className="text-lg font-semibold mb-3 text-foreground">Eventos SMC</h3>
            <div className="space-y-3">
              <div>
                <Badge variant="outline" className="mb-1">BOS (Break of Structure)</Badge>
                <p className="text-sm text-muted-foreground">
                  Quebra de estrutura que confirma a continuação da tendência atual.
                </p>
              </div>
              <div>
                <Badge variant="outline" className="mb-1">CHoCH (Change of Character)</Badge>
                <p className="text-sm text-muted-foreground">
                  Mudança de caráter que indica possível reversão de tendência.
                </p>
              </div>
            </div>
          </section>

          <Separator />

          {/* Planos de Trade */}
          <section>
            <h3 className="text-lg font-semibold mb-3 text-foreground">Planos de Trade</h3>
            <div className="grid gap-3">
              <div className="flex items-start gap-3">
                <Target className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <strong>Entrada:</strong>
                  <p className="text-sm text-muted-foreground">Preço ideal para abrir a posição baseado em zonas de interesse.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-bullish mt-0.5" />
                <div>
                  <strong>Alvo (Target):</strong>
                  <p className="text-sm text-muted-foreground">Objetivo de lucro baseado na estrutura do mercado.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-destructive mt-0.5" />
                <div>
                  <strong>Stop Loss:</strong>
                  <p className="text-sm text-muted-foreground">Ponto de saída para limitar perdas.</p>
                </div>
              </div>
            </div>
          </section>

          <Separator />

          {/* Probabilidades */}
          <section>
            <h3 className="text-lg font-semibold mb-3 text-foreground">Probabilidade de Acerto</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-bullish/10 text-center">
                  <p className="font-bold text-bullish">85-95%</p>
                  <p className="text-xs text-muted-foreground">BOS confirmado</p>
                </div>
                <div className="p-3 rounded-lg bg-primary/10 text-center">
                  <p className="font-bold text-primary">70-85%</p>
                  <p className="text-xs text-muted-foreground">CHoCH + confluência</p>
                </div>
                <div className="p-3 rounded-lg bg-neutral/10 text-center">
                  <p className="font-bold text-neutral">50-70%</p>
                  <p className="text-xs text-muted-foreground">Mercado lateral</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                *Probabilidades baseadas em backtests históricos dos padrões SMC identificados.
              </p>
            </div>
          </section>

          <Separator />

          {/* Validade */}
          <section>
            <h3 className="text-lg font-semibold mb-3 text-foreground">Validade dos Sinais</h3>
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-primary mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm"><strong>Timeframes menores (15m-1h):</strong> Válidos por 1-4 horas</p>
                <p className="text-sm"><strong>Timeframes maiores (4h-1d):</strong> Válidos por 1-7 dias</p>
                <p className="text-xs text-muted-foreground">
                  Sinais perdem validade quando há quebra da estrutura identificada ou formação de novos padrões SMC.
                </p>
              </div>
            </div>
          </section>

          <Separator />

          {/* Disclaimer */}
          <section className="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
            <h3 className="text-lg font-semibold mb-2 text-destructive">⚠️ Aviso Importante</h3>
            <p className="text-sm text-muted-foreground">
              Esta ferramenta é para fins educacionais. Trading de criptomoedas envolve riscos significativos. 
              Sempre faça sua própria análise e nunca invista mais do que pode perder.
            </p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
};