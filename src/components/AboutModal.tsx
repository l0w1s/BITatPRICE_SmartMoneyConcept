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
            How to Use Sir BAP AI
          </DialogTitle>
          <DialogDescription>
            Complete guide to interpret Smart Money Concepts analysis
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Como usar */}
          <section>
            <h3 className="text-lg font-semibold mb-3 text-foreground">How to Use the App</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>1. <strong>Select Timeframe:</strong> Choose the analysis period (15m, 1h, 4h, etc.)</p>
              <p>2. <strong>Wait for Analysis:</strong> The algorithm will process real-time data</p>
              <p>3. <strong>Interpret Results:</strong> Use the information below to understand the signals</p>
            </div>
          </section>

          <Separator />

          {/* Interpretação do Viés */}
          <section>
            <h3 className="text-lg font-semibold mb-3 text-foreground">Market Bias Interpretation</h3>
            <div className="grid gap-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-bullish/10 border border-bullish/30">
                <TrendingUp className="w-5 h-5 text-bullish mt-0.5" />
                <div>
                  <Badge className="mb-2 bg-bullish text-bullish-foreground">BULLISH</Badge>
                  <p className="text-sm">Confirmed upward trend. Look for buying opportunities in discount zones.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 rounded-lg bg-bearish/10 border border-bearish/30">
                <TrendingDown className="w-5 h-5 text-bearish mt-0.5" />
                <div>
                  <Badge className="mb-2 bg-bearish text-bearish-foreground">BEARISH</Badge>
                  <p className="text-sm">Confirmed downward trend. Look for selling opportunities in premium zones.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 rounded-lg bg-neutral/10 border border-neutral/30">
                <div className="w-5 h-5 bg-neutral rounded mt-0.5" />
                <div>
                  <Badge className="mb-2 bg-neutral text-neutral-foreground">SIDEWAYS</Badge>
                  <p className="text-sm">Market without clear direction. Wait for breakout confirmation.</p>
                </div>
              </div>
            </div>
          </section>

          <Separator />

          {/* Eventos SMC */}
          <section>
            <h3 className="text-lg font-semibold mb-3 text-foreground">SMC Events</h3>
            <div className="space-y-3">
              <div>
                <Badge variant="outline" className="mb-1">BOS (Break of Structure)</Badge>
                <p className="text-sm text-muted-foreground">
                  Structure break that confirms the continuation of the current trend.
                </p>
              </div>
              <div>
                <Badge variant="outline" className="mb-1">CHoCH (Change of Character)</Badge>
                <p className="text-sm text-muted-foreground">
                  Character change that indicates possible trend reversal.
                </p>
              </div>
            </div>
          </section>

          <Separator />

          {/* Planos de Trade */}
          <section>
            <h3 className="text-lg font-semibold mb-3 text-foreground">Trade Plans</h3>
            <div className="grid gap-3">
              <div className="flex items-start gap-3">
                <Target className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <strong>Entry:</strong>
                  <p className="text-sm text-muted-foreground">Ideal price to open position based on zones of interest.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-bullish mt-0.5" />
                <div>
                  <strong>Target:</strong>
                  <p className="text-sm text-muted-foreground">Profit objective based on market structure.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-destructive mt-0.5" />
                <div>
                  <strong>Stop Loss:</strong>
                  <p className="text-sm text-muted-foreground">Exit point to limit losses.</p>
                </div>
              </div>
            </div>
          </section>

          <Separator />

          {/* Probabilidades */}
          <section>
            <h3 className="text-lg font-semibold mb-3 text-foreground">Success Probability</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-bullish/10 text-center">
                  <p className="font-bold text-bullish">85-95%</p>
                  <p className="text-xs text-muted-foreground">Confirmed BOS</p>
                </div>
                <div className="p-3 rounded-lg bg-primary/10 text-center">
                  <p className="font-bold text-primary">70-85%</p>
                  <p className="text-xs text-muted-foreground">CHoCH + confluence</p>
                </div>
                <div className="p-3 rounded-lg bg-neutral/10 text-center">
                  <p className="font-bold text-neutral">50-70%</p>
                  <p className="text-xs text-muted-foreground">Sideways market</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                *Probabilities based on historical backtests of identified SMC patterns.
              </p>
            </div>
          </section>

          <Separator />

          {/* Validade */}
          <section>
            <h3 className="text-lg font-semibold mb-3 text-foreground">Signal Validity</h3>
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-primary mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm"><strong>Lower timeframes (15m-1h):</strong> Valid for 1-4 hours</p>
                <p className="text-sm"><strong>Higher timeframes (4h-1d):</strong> Valid for 1-7 days</p>
                <p className="text-xs text-muted-foreground">
                  Signals lose validity when there's a break of identified structure or formation of new SMC patterns.
                </p>
              </div>
            </div>
          </section>

          <Separator />

          {/* Disclaimer */}
          <section className="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
            <h3 className="text-lg font-semibold mb-2 text-destructive">⚠️ Important Warning</h3>
            <p className="text-sm text-muted-foreground">
              This tool is for educational purposes. Cryptocurrency trading involves significant risks. 
              Always do your own analysis and never invest more than you can afford to lose.
            </p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
};