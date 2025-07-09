import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Copy, Check, Heart } from 'lucide-react';
import { BitcoinIcon } from './BitcoinIcon';
import { useToast } from '@/hooks/use-toast';

interface DonateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DonateModal: React.FC<DonateModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  
  const bitcoinAddress = "BC1Q5H0V9GHS89ST9CZ3WXLD48FPCF8N3CUDR9G83U";

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(bitcoinAddress);
      setCopied(true);
      toast({
        title: "Endereço copiado!",
        description: "O endereço Bitcoin foi copiado para a área de transferência.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o endereço. Tente selecionar e copiar manualmente.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-primary flex items-center gap-2">
            <Heart className="w-6 h-6 text-red-500" />
            Apoie o Sir BAP AI
          </DialogTitle>
          <DialogDescription>
            Se esta ferramenta te ajudou, considere fazer uma doação em Bitcoin
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <BitcoinIcon className="w-16 h-16 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">
              Suas doações ajudam a manter o Sir BAP AI sempre atualizado 
              e com novas funcionalidades!
            </p>
          </div>

          <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">Endereço Bitcoin:</span>
                <BitcoinIcon className="w-5 h-5 text-primary" />
              </div>
              
              <div className="p-3 bg-background rounded-lg border">
                <code className="text-xs font-mono break-all text-foreground">
                  {bitcoinAddress}
                </code>
              </div>
              
              <Button 
                onClick={copyToClipboard} 
                className="w-full"
                variant={copied ? "default" : "outline"}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar Endereço
                  </>
                )}
              </Button>
            </div>
          </Card>

          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              ⚡ Use a rede Bitcoin (não confundir com outras redes)
            </p>
            <p className="text-xs text-muted-foreground">
              Qualquer valor é bem-vindo e muito apreciado! 🙏
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Fechar
            </Button>
            <Button 
              onClick={() => window.open(`bitcoin:${bitcoinAddress}`, '_blank')}
              className="flex-1"
            >
              Abrir Carteira
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};