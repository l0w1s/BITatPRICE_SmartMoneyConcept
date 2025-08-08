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
import { TrendingUp, TrendingDown, Target, Shield, Clock, Zap, Activity, AlertTriangle, CheckCircle, Bell } from 'lucide-react';

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

          {/* Classificações de Força */}
          <section>
            <h3 className="text-lg font-semibold mb-3 text-foreground">Zone Strength Classifications</h3>
            <div className="grid gap-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-orange-500/10 border border-orange-500/30">
                <Zap className="w-5 h-5 text-orange-500 mt-0.5" />
                <div>
                  <Badge className="mb-2 bg-orange-500 text-white">🔥 STRONG</Badge>
                  <p className="text-sm text-muted-foreground">
                    High-quality zones with multiple confluences. Distance from price 0.5-3%. Maximum reliability.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <Activity className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <Badge className="mb-2 bg-blue-500 text-white">⚡ MODERATE</Badge>
                  <p className="text-sm text-muted-foreground">
                    Good zones with some confluences. Distance from price 1-5%. Good reliability.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-500/10 border border-gray-500/30">
                <Target className="w-5 h-5 text-gray-500 mt-0.5" />
                <div>
                  <Badge className="mb-2 bg-gray-500 text-white">📊 WEAK</Badge>
                  <p className="text-sm text-muted-foreground">
                    Basic zones without major confluences. Distance from price {'>'} 3%. Lower reliability.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <Separator />

          {/* Classificações de Idade */}
          <section>
            <h3 className="text-lg font-semibold mb-3 text-foreground">Zone Age Classifications</h3>
            <div className="grid gap-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <Badge className="mb-2 bg-green-500 text-white">🆕 FRESH</Badge>
                  <p className="text-sm text-muted-foreground">
                    Recently formed zones (last 5-10 candles). Higher reaction probability.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <Badge className="mb-2 bg-yellow-600 text-white">📅 RECENT</Badge>
                  <p className="text-sm text-muted-foreground">
                    Moderately aged zones (10-20 candles). Good reaction probability.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                <div>
                  <Badge className="mb-2 bg-red-500 text-white">⏰ OLD</Badge>
                  <p className="text-sm text-muted-foreground">
                    Older zones (more than 20 candles). Lower reaction probability.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <Separator />

          {/* Status das Zonas */}
          <section>
            <h3 className="text-lg font-semibold mb-3 text-foreground">Zone Test Status</h3>
            <div className="grid gap-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5" />
                <div>
                  <Badge className="mb-2 bg-emerald-500 text-white">✅ UNTESTED</Badge>
                  <p className="text-sm text-muted-foreground">
                    Zone has not been retested since formation. Higher reliability and reaction probability.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <Badge className="mb-2 bg-amber-600 text-white">⚠️ TESTED</Badge>
                  <p className="text-sm text-muted-foreground">
                    Zone has been retested at least once. Lower reliability but still valid.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <Separator />

          {/* Múltiplos Planos de Trade */}
          <section>
            <h3 className="text-lg font-semibold mb-3 text-foreground">Multiple Trade Plans</h3>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Sir BAP AI now provides up to 3 trade plans for each direction (buy/sell), ranked by quality and probability.
              </p>
              
              <div className="grid gap-3">
                <div className="flex items-start gap-3">
                  <Target className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <strong>Plan Selection:</strong>
                    <p className="text-sm text-muted-foreground">Choose plans with higher strength zones and better R/R ratios.</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-bullish mt-0.5" />
                  <div>
                    <strong>Entry Types:</strong>
                    <p className="text-sm text-muted-foreground">
                      <Badge variant="outline" className="mr-2">Pullback</Badge> Entry at zone retest
                      <br />
                      <Badge variant="outline" className="mt-1">Breakout</Badge> Entry at level break
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-destructive mt-0.5" />
                  <div>
                    <strong>Risk Management:</strong>
                    <p className="text-sm text-muted-foreground">Always use stop losses and respect R/R ratios.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <Separator />

          {/* R/R Ratio */}
          <section>
            <h3 className="text-lg font-semibold mb-3 text-foreground">Risk/Reward Ratio (R/R)</h3>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                R/R ratio shows how much profit you can make for each dollar risked.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-emerald-500/10 text-center border border-emerald-500/30">
                  <p className="font-bold text-emerald-600">1:3+</p>
                  <p className="text-xs text-muted-foreground">Excellent</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-500/10 text-center border border-blue-500/30">
                  <p className="font-bold text-blue-600">1:2</p>
                  <p className="text-xs text-muted-foreground">Good</p>
                </div>
                <div className="p-3 rounded-lg bg-amber-500/10 text-center border border-amber-500/30">
                  <p className="font-bold text-amber-600">1:1</p>
                  <p className="text-xs text-muted-foreground">Minimum</p>
                </div>
              </div>
              
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-sm font-medium">Example:</p>
                <p className="text-xs text-muted-foreground">
                  R/R 1:3 means: Risk $100 to potentially gain $300. If you win 30% of trades, you break even.
                </p>
              </div>
            </div>
          </section>

          <Separator />

          {/* Distância das Zonas */}
          <section>
            <h3 className="text-lg font-semibold mb-3 text-foreground">Zone Distance Interpretation</h3>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Distance shows how far zones are from current price as a percentage.
              </p>
              
              <div className="grid gap-3">
                <div className="flex items-center gap-3 p-2 rounded bg-emerald-500/10">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                  <span className="text-sm"><strong>0-1%:</strong> Very close, immediate relevance</span>
                </div>
                <div className="flex items-center gap-3 p-2 rounded bg-blue-500/10">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm"><strong>1-3%:</strong> Close, short-term relevance</span>
                </div>
                <div className="flex items-center gap-3 p-2 rounded bg-amber-500/10">
                  <div className="w-3 h-3 bg-amber-600 rounded-full"></div>
                  <span className="text-sm"><strong>3-5%:</strong> Moderate distance, medium-term</span>
                </div>
                <div className="flex items-center gap-3 p-2 rounded bg-red-500/10">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm"><strong>5%+:</strong> Far, long-term relevance</span>
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
                <p className="text-sm"><strong>Mid timeframe (30m):</strong> Valid for 2-6 hours</p>
                <p className="text-xs text-muted-foreground">
                  Signals lose validity when there's a break of identified structure or formation of new SMC patterns.
                </p>
              </div>
            </div>
          </section>

          <Separator />

          {/* New Features */}
          <section>
            <h3 className="text-lg font-semibold mb-3 text-foreground">🆕 New Features</h3>
            <div className="space-y-4">
              <div className="grid gap-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <Bell className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <Badge className="mb-2 bg-primary text-primary-foreground">🚨 Zone Alerts</Badge>
                    <p className="text-sm text-muted-foreground">
                      Automatically monitors price proximity to demand/supply zones. Get notifications when price approaches critical levels within 0.5%. Toggle alerts on/off for each zone.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                  <Activity className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div>
                    <Badge className="mb-2 bg-blue-500 text-white">📊 Multi-Timeframe</Badge>
                    <p className="text-sm text-muted-foreground">
                      Analyze multiple timeframes simultaneously. Detect confluences when 2+ timeframes show the same bias. Stronger signals when multiple TFs align.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                  <Target className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <Badge className="mb-2 bg-green-500 text-white">🧮 Position Calculator</Badge>
                    <p className="text-sm text-muted-foreground">
                      Calculate exact position sizes based on your account capital and risk percentage. Shows USD and BTC amounts for each trade plan with proper risk management.
                    </p>
                  </div>
                </div>
                
                 <div className="flex items-start gap-3 p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
                   <Clock className="w-5 h-5 text-purple-500 mt-0.5" />
                   <div>
                     <Badge className="mb-2 bg-purple-500 text-white">📈 Performance History</Badge>
                     <p className="text-sm text-muted-foreground">
                       Track your analysis history and success rates. View statistics like total analyses, most used timeframes, bias distribution, and recent signals performance.
                     </p>
                   </div>
                 </div>
                 
                 <div className="flex items-start gap-3 p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/30">
                   <Activity className="w-5 h-5 text-indigo-500 mt-0.5" />
                   <div>
                     <Badge className="mb-2 bg-indigo-500 text-white">📊 Wyckoff Method</Badge>
                     <p className="text-sm text-muted-foreground">
                       <strong>🆕 New Update:</strong> Advanced Wyckoff analysis with adaptive criteria! Detects Accumulation/Distribution phases, key events (Spring, UpThrust), and provides specialized trade setups. Now works with smaller ranges and different timeframes.
                     </p>

                     <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                       <p className="font-medium text-foreground">Phase Detection (A–E)</p>
                       <ul className="list-disc pl-5 space-y-1">
                         <li><strong>Phase A:</strong> Stopping action do movimento anterior. Marca <em>SC</em> (Selling Climax) e <em>AR</em> (Automatic Rally) em Acumulação, ou <em>BC</em> (Buying Climax) e <em>AR</em> em Distribuição. Primeiras <em>ST</em> (Secondary Tests) definem a faixa.</li>
                         <li><strong>Phase B:</strong> Construção de causa. Preço oscila dentro da faixa para absorver oferta/demanda. Múltiplos <em>ST</em> e falsos rompimentos podem ocorrer.</li>
                         <li><strong>Phase C:</strong> Teste decisivo. Em Acumulação surge o <em>Spring</em> (falso rompimento abaixo) com retorno rápido; em Distribuição, o <em>UpThrust</em> (ou <em>UTAD</em>) acima da faixa.</li>
                         <li><strong>Phase D:</strong> Confirmação. Após o Spring, aparecem <em>SOS</em> (Sign of Strength) e <em>LPS</em> (Last Point of Support). Na Distribuição, <em>SOW</em> (Sign of Weakness) e <em>LPSY</em> (Last Point of Supply).</li>
                         <li><strong>Phase E:</strong> Tendência efetiva. <em>Markup</em> após SOS (Acumulação) ou <em>Markdown</em> após SOW (Distribuição).</li>
                       </ul>

                       <p className="font-medium text-foreground">Key Events Detectados</p>
                       <ul className="list-disc pl-5 space-y-1">
                         <li><strong>SC (Selling Climax):</strong> Ponto de exaustão vendedora com forte reacção.</li>
                         <li><strong>BC (Buying Climax):</strong> Exaustão compradora com rejeição acentuada.</li>
                         <li><strong>AR (Automatic Rally/Reaction):</strong> Contra‑movimento automático que ajuda a definir a faixa.</li>
                         <li><strong>ST (Secondary Test):</strong> Retestes de SC/BC para validar oferta/demanda remanescente.</li>
                         <li><strong>Spring / Test:</strong> Falso rompimento abaixo da faixa com retorno rápido; o Test confirma (volume/espalhamento).</li>
                         <li><strong>UpThrust / UTAD:</strong> Falso rompimento acima da faixa; UTAD é a variante tardia.</li>
                         <li><strong>LPS:</strong> Último ponto de suporte antes do avanço (Acumulação).</li>
                         <li><strong>LPSY:</strong> Último ponto de oferta antes da queda (Distribuição).</li>
                         <li><strong>SOS / SOW:</strong> Sinal de força (alta) ou fraqueza (baixa) após o evento chave.</li>
                       </ul>

                       <p className="text-xs">Critérios adaptativos por timeframe e volatilidade para evitar falsos positivos e melhorar a robustez dos sinais.</p>
                     </div>
                   </div>
                 </div>
                
                 <div className="flex items-start gap-3 p-3 rounded-lg bg-orange-500/10 border border-orange-500/30">
                   <Zap className="w-5 h-5 text-orange-500 mt-0.5" />
                   <div>
                     <Badge className="mb-2 bg-orange-500 text-white">⚙️ Advanced Settings</Badge>
                     <p className="text-sm text-muted-foreground">
                       Customize analysis parameters, default account settings, auto-refresh intervals (30s-5min), and theme preferences. Enable/disable auto-refresh and set default timeframes.
                     </p>
                   </div>
                 </div>
               </div>
               
               <div className="bg-muted/50 p-4 rounded-lg border-l-4 border-l-primary">
                 <h4 className="font-medium mb-2">📊 How to Read Zone Classifications</h4>
                 <ul className="space-y-2 text-sm text-muted-foreground">
                   <li>• <strong>Zone Strength:</strong> 💪 Strong (high volume reaction), 🔥 Moderate (good reaction), ⚡ Weak (limited reaction)</li>
                   <li>• <strong>Zone Age:</strong> 🆕 Fresh (recently formed), 🕐 Recent (1-5 candles old), 🕰️ Old (5+ candles old)</li>
                   <li>• <strong>Test Status:</strong> ✅ Tested zones have been touched before, ❌ Untested zones are pristine</li>
                   <li>• <strong>Distance:</strong> Shows percentage distance from current price to zone levels</li>
                 </ul>
               </div>
               
               <div className="bg-muted/50 p-4 rounded-lg border-l-4 border-l-accent">
                 <h4 className="font-medium mb-2">⚡ Multi-Timeframe Analysis Guide</h4>
                 <ul className="space-y-2 text-sm text-muted-foreground">
                   <li>• <strong>Confluences:</strong> When multiple timeframes show the same bias (all bullish or bearish)</li>
                   <li>• <strong>Divergences:</strong> When timeframes disagree - use higher timeframe bias as primary direction</li>
                   <li>• <strong>Best Entries:</strong> Look for confluences between your selected timeframe and higher timeframes</li>
                   <li>• <strong>Trend Hierarchy:</strong> Daily {'>'} 4H {'>'} 1H {'>'} 15M (higher timeframes have more weight)</li>
                 </ul>
               </div>
               
               <div className="bg-muted/50 p-4 rounded-lg border-l-4 border-l-destructive">
                 <h4 className="font-medium mb-2">💰 Position Sizing & Risk Management</h4>
                 <ul className="space-y-2 text-sm text-muted-foreground">
                   <li>• <strong>2% Rule:</strong> Never risk more than 2% of your account on a single trade</li>
                   <li>• <strong>Position Size Formula:</strong> (Account × Risk%) ÷ (Entry Price - Stop Loss) = Position Size</li>
                   <li>• <strong>Risk/Reward:</strong> Always aim for minimum 1:2 R:R (risk $1 to make $2)</li>
                   <li>• <strong>Stop Loss Placement:</strong> Place stops beyond the nearest opposing zone (supply for longs, demand for shorts)</li>
                 </ul>
               </div>
               
                <div className="bg-muted/50 p-4 rounded-lg border-l-4 border-l-secondary">
                  <h4 className="font-medium mb-2">🔔 Alert System Guide</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• <strong>Critical Distance:</strong> Alerts trigger when price is within 0.5% of zone levels</li>
                    <li>• <strong>Zone Status:</strong> Green = triggered, Blue = near (approaching), Gray = inactive</li>
                    <li>• <strong>Toggle Control:</strong> Click the switch to enable/disable alerts for specific zones</li>
                    <li>• <strong>Browser Notifications:</strong> Make sure to allow notifications for real-time alerts</li>
                  </ul>
                </div>
                
                <div className="bg-muted/50 p-4 rounded-lg border-l-4 border-l-indigo-500">
                  <h4 className="font-medium mb-2">📊 Wyckoff Analysis Guide</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• <strong>Adaptive Criteria:</strong> Analysis adapts to timeframe (15+ candles for 1m, 7+ for 1d)</li>
                    <li>• <strong>Range Requirements:</strong> Minimum 0.5-2.5% volatility based on timeframe</li>
                    <li>• <strong>Phase Detection:</strong> Identifies all 5 phases (A-E) with specific characteristics</li>
                    <li>• <strong>Key Events:</strong> Detects Spring, UpThrust, SC, BC, LPS, LPSY</li>
                    <li>• <strong>Best Usage:</strong> Most effective in sideways markets with sufficient volume</li>
                    <li>• <strong>Debug Mode:</strong> Shows range formation progress and criteria status</li>
                  </ul>
                </div>
               
               <div className="p-3 rounded-lg bg-muted/30">
                 <p className="text-sm font-medium mb-1">💡 Pro Tips:</p>
                 <ul className="text-xs text-muted-foreground space-y-1">
                   <li>• Use alerts to catch price movements while away from charts</li>
                   <li>• Check multi-timeframe confluences for higher probability setups</li>
                   <li>• Always calculate position sizes before entering trades</li>
                   <li>• Review performance history to improve your analysis skills</li>
                   <li>• Focus on confluences: when multiple timeframes and zones align</li>
                   <li>• Use desktop layout to compare zones and FVGs side-by-side</li>
                 </ul>
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