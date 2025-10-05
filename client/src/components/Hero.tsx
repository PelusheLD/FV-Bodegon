import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface HeroProps {
  onSearch?: (query: string) => void;
}

export default function Hero({ onSearch }: HeroProps) {
  return (
    <div className="relative h-[50vh] md:h-[60vh] bg-gradient-to-br from-primary/20 via-accent to-secondary overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,hsl(var(--background))_100%)]" />
      
      <div className="relative h-full flex flex-col items-center justify-center px-4 text-center">
        <h1 className="font-display font-bold text-3xl md:text-5xl lg:text-6xl mb-4 text-foreground">
          FV BODEGONES
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl">
          Tu bodega de confianza para productos de consumo diario
        </p>
        
        <div className="w-full max-w-xl flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar productos..."
              className="pl-10 h-12"
              data-testid="input-search"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && onSearch) {
                  onSearch((e.target as HTMLInputElement).value);
                }
              }}
            />
          </div>
          <Button 
            size="lg"
            onClick={() => {
              const input = document.querySelector('[data-testid="input-search"]') as HTMLInputElement;
              if (input && onSearch) {
                onSearch(input.value);
              }
            }}
            data-testid="button-search"
          >
            Buscar
          </Button>
        </div>
      </div>
    </div>
  );
}
