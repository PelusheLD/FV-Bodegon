import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from "lucide-react";
import type { SiteSettings } from "@shared/schema";

interface FooterProps {
  settings?: SiteSettings;
}

export default function Footer({ settings }: FooterProps) {
  return (
    <footer className="bg-[hsl(40,15%,94%)] dark:bg-card border-t mt-auto">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-display font-semibold text-lg mb-4">Contacto</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary flex-shrink-0" />
                <span>{settings?.contactPhone || '+1 (555) 123-4567'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary flex-shrink-0" />
                <span>{settings?.contactEmail || 'contacto@fvbodegones.com'}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                <span>{settings?.contactAddress || 'Calle Principal #123, Ciudad'}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-display font-semibold text-lg mb-4">Redes Sociales</h3>
            <div className="flex gap-4">
              <a
                href={settings?.facebookUrl || '#'}
                className="h-10 w-10 rounded-md bg-background flex items-center justify-center hover-elevate active-elevate-2 transition-colors"
                aria-label="Facebook"
                data-testid="link-facebook"
              >
                <Facebook className="h-5 w-5 text-primary" />
              </a>
              <a
                href={settings?.instagramUrl || '#'}
                className="h-10 w-10 rounded-md bg-background flex items-center justify-center hover-elevate active-elevate-2 transition-colors"
                aria-label="Instagram"
                data-testid="link-instagram"
              >
                <Instagram className="h-5 w-5 text-primary" />
              </a>
              <a
                href={settings?.twitterUrl || '#'}
                className="h-10 w-10 rounded-md bg-background flex items-center justify-center hover-elevate active-elevate-2 transition-colors"
                aria-label="Twitter"
                data-testid="link-twitter"
              >
                <Twitter className="h-5 w-5 text-primary" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-display font-semibold text-lg mb-4">Legal</h3>
            <div className="space-y-2 text-sm">
              <a href="#" className="block hover:text-primary transition-colors" data-testid="link-privacy">
                Política de Privacidad
              </a>
              <a href="#" className="block hover:text-primary transition-colors" data-testid="link-terms">
                Términos y Condiciones
              </a>
              <a href="#" className="block hover:text-primary transition-colors" data-testid="link-returns">
                Política de Devoluciones
              </a>
            </div>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} {settings?.siteName || 'FV BODEGONES'}. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
