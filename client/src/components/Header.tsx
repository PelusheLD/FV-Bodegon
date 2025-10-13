import { ShoppingCart, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  cartCount: number;
  cartTotal: number;
  onCartClick: () => void;
  onMenuClick?: () => void;
  siteName?: string;
}

export default function Header({ cartCount, cartTotal, onCartClick, onMenuClick, siteName = "FV BODEGONES" }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-black/80 border-b border-black/40 text-white">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20 gap-4">
          {onMenuClick && (
            <Button
              size="icon"
              variant="ghost"
              onClick={onMenuClick}
              className="md:hidden"
              data-testid="button-menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          
          <div className="flex-1 md:flex-none">
            <div className="flex items-center gap-3 select-none">
              <img
                src="/logo.png"
                alt="FV Bodegones"
                className="h-8 w-8 md:h-10 md:w-10 object-contain"
                onError={(e) => {
                  // Oculta la imagen si no existe /logo.png aún
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                }}
              />
              <h1 className="font-display font-bold text-xl md:text-2xl text-white">
                {siteName}
              </h1>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={onCartClick}
            className="relative gap-2 border-2 [--button-outline:#5ab535] border-[#5ab535] text-white hover:bg-[#5ab535]/10 shadow-none"
            data-testid="button-cart"
          >
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <>
                <Badge 
                  variant="default" 
                  className="absolute -top-2 -right-2 h-5 min-w-5 px-1 flex items-center justify-center bg-[#5ab535] text-white"
                >
                  {cartCount}
                </Badge>
                <span className="hidden sm:inline font-semibold text-white">
                  ${cartTotal.toFixed(2)}
                </span>
              </>
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
