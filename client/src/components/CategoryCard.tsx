import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface CategoryCardProps {
  name: string;
  imageUrl?: string | null;
  icon?: LucideIcon;
  leySeca?: boolean;
  onClick: () => void;
}

export default function CategoryCard({ name, imageUrl, icon: Icon, leySeca = false, onClick }: CategoryCardProps) {
  return (
    <Card
      onClick={onClick}
      className="group h-32 md:h-36 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 hover:-translate-y-1 bg-gradient-to-br from-white to-gray-50 border-2 border-transparent hover:border-[#5ab535]/20 hover-elevate active-elevate-2 p-4 relative overflow-hidden"
      data-testid={`card-category-${name.toLowerCase().replace(/\s+/g, '-')}`}
    >
      {/* Efecto de brillo sutil */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#5ab535]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Banner de Ley Seca */}
      {leySeca && (
        <div className="absolute top-2 right-2 z-20">
          <div className="bg-red-600 text-white px-2 py-1 rounded-md text-xs font-bold shadow-lg border border-red-700">
            LEY SECA
          </div>
        </div>
      )}
      
      {/* Contenido */}
      <div className="relative z-10 flex flex-col items-center justify-center gap-3">
        {imageUrl ? (
          <div className="relative">
            <img
              src={imageUrl}
              alt={name}
              className="h-16 w-16 md:h-18 md:w-18 rounded-full object-cover shadow-md group-hover:shadow-lg transition-shadow duration-300"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
            {/* Anillo decorativo */}
            <div className="absolute inset-0 rounded-full border-2 border-[#5ab535]/20 group-hover:border-[#5ab535]/40 transition-colors duration-300" />
          </div>
        ) : (
          Icon && (
            <div className="relative">
              <div className="h-16 w-16 md:h-18 md:w-18 rounded-full bg-gradient-to-br from-[#5ab535]/10 to-[#5ab535]/5 flex items-center justify-center group-hover:from-[#5ab535]/20 group-hover:to-[#5ab535]/10 transition-all duration-300">
                <Icon className="h-8 w-8 md:h-9 md:w-9 text-[#5ab535] group-hover:scale-110 transition-transform duration-300" />
              </div>
            </div>
          )
        )}
        
        <span className="text-sm md:text-base font-semibold text-center line-clamp-2 text-gray-800 group-hover:text-[#5ab535] transition-colors duration-300">
        {name}
      </span>
      </div>
      
      {/* Indicador de hover */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-1 bg-[#5ab535] group-hover:w-8 transition-all duration-300 rounded-full" />
    </Card>
  );
}
