import { useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export const PWAInstallPrompt = () => {
  const isMobile = useIsMobile();
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Check if already installed
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches;
    
    // Check if user already dismissed the prompt
    const isDismissed = localStorage.getItem('pwa-install-dismissed');
    
    if (isInstalled || isDismissed || !isMobile) {
      return;
    }

    // Capture the beforeinstallprompt event
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // For iOS Safari (doesn't support beforeinstallprompt)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS && !isInstalled && !isDismissed) {
      setShowPrompt(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, [isMobile]);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa-install-dismissed', 'true');
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-5">
      <div className="bg-card border border-border rounded-lg shadow-lg p-4 flex items-start gap-3">
        <img 
          src="/tecwork-pwa-icon.png" 
          alt="TecWork" 
          className="h-12 w-12 rounded-lg flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm mb-1">Instala TecWork</h3>
          <p className="text-xs text-muted-foreground mb-3">
            {isIOS 
              ? "Toca el botón de compartir y selecciona 'Añadir a pantalla de inicio'"
              : "Instala la app en tu dispositivo para un acceso rápido"}
          </p>
          {!isIOS && deferredPrompt && (
            <Button 
              size="sm" 
              onClick={handleInstall}
              className="w-full mb-2"
            >
              Instalar Ahora
            </Button>
          )}
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={handleDismiss}
            className="w-full"
          >
            Ahora no
          </Button>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 flex-shrink-0"
          onClick={handleDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
