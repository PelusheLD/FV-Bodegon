import { useQuery } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import type { Sponsor } from "@shared/schema";

export default function SponsorsSection() {
  const { data: sponsors = [], isLoading } = useQuery<Sponsor[]>({
    queryKey: ['/api/sponsors'],
  });

  if (isLoading || sponsors.length === 0) {
    return null;
  }

  return (
    <section id="sponsors" className="py-16 bg-gradient-to-br from-green-50 via-white to-green-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Heart className="h-8 w-8 text-emerald-600" />
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
              Nuestros Patrocinadores
            </h2>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Agradecemos a nuestros patrocinadores por su apoyo constante
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-8">
          {sponsors.map((sponsor) => (
            <div
              key={sponsor.id}
              className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center"
            >
              {sponsor.websiteUrl ? (
                <a
                  href={sponsor.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-full flex items-center justify-center"
                >
                  {sponsor.logoUrl ? (
                    <img
                      src={sponsor.logoUrl}
                      alt={sponsor.name}
                      className="max-w-full max-h-20 object-contain filter hover:brightness-110 transition-all"
                    />
                  ) : (
                    <span className="text-gray-700 font-semibold text-center">{sponsor.name}</span>
                  )}
                </a>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  {sponsor.logoUrl ? (
                    <img
                      src={sponsor.logoUrl}
                      alt={sponsor.name}
                      className="max-w-full max-h-20 object-contain"
                    />
                  ) : (
                    <span className="text-gray-700 font-semibold text-center">{sponsor.name}</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

