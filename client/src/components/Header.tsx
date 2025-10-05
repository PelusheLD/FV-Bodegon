import { ShoppingCart, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  cartCount: number;
  cartTotal: number;
  onCartClick: () => void;
  onMenuClick?: () => void;
}

export default function Header({ cartCount, cartTotal, onCartClick, onMenuClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-background/90 border-b">
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
            <h1 className="font-display font-bold text-xl md:text-2xl text-primary">
              FV BODEGONES
            </h1>
          </div>

          <Button
            variant="outline"
            onClick={onCartClick}
            className="relative gap-2"
            data-testid="button-cart"
          >
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <>
                <Badge 
                  variant="default" 
                  className="absolute -top-2 -right-2 h-5 min-w-5 px-1 flex items-center justify-center"
                >
                  {cartCount}
                </Badge>
                <span className="hidden sm:inline font-semibold text-primary">
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
