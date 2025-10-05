import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface CategoryCardProps {
  name: string;
  icon: LucideIcon;
  onClick: () => void;
}

export default function CategoryCard({ name, icon: Icon, onClick }: CategoryCardProps) {
  return (
    <Card
      onClick={onClick}
      className="h-28 md:h-32 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all hover:shadow-md hover:scale-105 hover-elevate active-elevate-2 p-4"
      data-testid={`card-category-${name.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <Icon className="h-10 w-10 md:h-12 md:w-12 text-primary" />
      <span className="text-sm md:text-base font-medium text-center line-clamp-2">
        {name}
      </span>
    </Card>
  );
}
