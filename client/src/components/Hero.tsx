import { ArrowDown, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";

interface HeroProps {
  // Carrusel data
  carouselData?: {
    enableCarousel1?: boolean;
    enableCarousel2?: boolean;
    enableCarousel3?: boolean;
    title1?: string;
    subtitle1?: string;
    description1?: string;
    image1?: string;
    background1?: string;
    button1?: string;
    url1?: string;
    title2?: string;
    subtitle2?: string;
    description2?: string;
    image2?: string;
    background2?: string;
    button2?: string;
    url2?: string;
    title3?: string;
    subtitle3?: string;
    description3?: string;
    image3?: string;
    background3?: string;
    button3?: string;
    url3?: string;
  };
}

export default function Hero({ carouselData }: HeroProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [nextSlide, setNextSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Datos del carrusel con valores por defecto
  const allSlides = [
    {
      title: carouselData?.title1 || "FV BODEGONES",
      subtitle: carouselData?.subtitle1 || "Tu bodega de confianza",
      description: carouselData?.description1 || "Productos de consumo diario, Abierto las 24 horas, los 365 días del año",
      image: carouselData?.image1,
      background: carouselData?.background1,
      buttonText: carouselData?.button1 || "Ir a Bodega",
      buttonUrl: carouselData?.url1,
      enabled: carouselData?.enableCarousel1 ?? true,
    },
    {
      title: carouselData?.title2 || "ZONA LONNGE",
      subtitle: carouselData?.subtitle2 || "Tu zona de entretenimiento",
      description: carouselData?.description2 || "Productos para tu diversión y entretenimiento, siempre disponibles",
      image: carouselData?.image2,
      background: carouselData?.background2,
      buttonText: carouselData?.button2 || "Ir a Lounge",
      buttonUrl: carouselData?.url2,
      enabled: carouselData?.enableCarousel2 ?? true,
    },
    {
      title: carouselData?.title3 || "FV FARMACIA",
      subtitle: carouselData?.subtitle3 || "Tu farmacia de confianza",
      description: carouselData?.description3 || "Medicamentos y productos de salud, cuidado personal y bienestar",
      image: carouselData?.image3,
      background: carouselData?.background3,
      buttonText: carouselData?.button3 || "Ir a Farmacia",
      buttonUrl: carouselData?.url3,
      enabled: carouselData?.enableCarousel3 ?? true,
    }
  ];

  // Filtrar solo los slides habilitados
  const enabledSlides = allSlides.filter(slide => slide.enabled);
  
  // Verificar si hay slides habilitados
  const hasEnabledSlides = enabledSlides.length > 0;
  
  // Si no hay slides habilitados, usar el primer slide como fallback
  const slides = hasEnabledSlides ? enabledSlides : [allSlides[0]];

  // Precargar todas las imágenes de fondo
  useEffect(() => {
    const preloadImages = slides
      .map(slide => slide.background || '/fondo.png')
      .filter((url, index, self) => self.indexOf(url) === index); // Eliminar duplicados
    
    preloadImages.forEach(url => {
      const img = new Image();
      img.src = url;
    });
  }, [slides]);

  // Manejar transición suave entre slides
  useEffect(() => {
    if (nextSlide !== currentSlide) {
      setIsTransitioning(true);
      // Esperar a que termine la transición completa antes de actualizar currentSlide
      const timer = setTimeout(() => {
        setCurrentSlide(nextSlide);
        setIsTransitioning(false);
      }, 2000); // Duración completa de la transición (2000ms)
      return () => clearTimeout(timer);
    }
  }, [nextSlide, currentSlide]);

  // Función para manejar clics de botones
  const handleButtonClick = useCallback((slideIndex: number) => {
    const slide = slides[slideIndex];
    const buttonNumber = slideIndex + 1;
    const buttonNames = ['FV BODEGONES', 'ZONA LONNGE', 'FV FARMACIA'];
    
    console.log(`🔘 BOTÓN ${buttonNumber} (${buttonNames[slideIndex]}) clickeado`);
    console.log('📝 Texto del botón:', slide.buttonText);
    console.log('🔗 URL configurada:', slide.buttonUrl);
    
    if (slide.buttonUrl) {
      console.log('✅ Abriendo URL externa:', slide.buttonUrl);
      window.open(slide.buttonUrl, '_blank', 'noopener,noreferrer');
    } else {
      console.log('⚠️ No hay URL configurada, haciendo scroll a categorías');
      // Fallback: scroll a categorías si no hay URL
      document.getElementById('categories')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [slides]);

  // Debug: mostrar datos del carrusel
  console.log('🎠 Hero carouselData:', carouselData);
  console.log('🎯 Slide actual:', currentSlide + 1, 'de', slides.length);
  console.log('📊 Datos del slide actual:', slides[currentSlide]);

  // Rotación automática cada 10 segundos (solo si hay más de un slide habilitado)
  useEffect(() => {
    if (slides.length <= 1) return;
    
    const interval = setInterval(() => {
      setNextSlide((prev) => (prev + 1) % slides.length);
    }, 10000);

    return () => clearInterval(interval);
  }, [slides.length]);

  const goToSlide = (index: number) => {
    if (slides.length <= 1 || index === currentSlide) return;
    console.log('🔄 Cambiando a slide:', index + 1, 'de', slides.length);
    setNextSlide(index);
  };

  const goToPrevious = () => {
    if (slides.length <= 1) return;
    const newSlide = (currentSlide - 1 + slides.length) % slides.length;
    console.log('⬅️ Slide anterior:', newSlide + 1, 'de', slides.length);
    setNextSlide(newSlide);
  };

  const goToNext = () => {
    if (slides.length <= 1) return;
    const newSlide = (currentSlide + 1) % slides.length;
    console.log('➡️ Slide siguiente:', newSlide + 1, 'de', slides.length);
    setNextSlide(newSlide);
  };
  // Determinar qué slide mostrar en cada capa
  const currentBackground = slides[currentSlide].background || '/fondo.png';
  const nextBackground = slides[nextSlide].background || '/fondo.png';
  const needsTransition = nextSlide !== currentSlide;
  const displaySlide = needsTransition ? nextSlide : currentSlide;

  return (
    <div className="relative h-[80vh] md:h-[90vh] overflow-hidden">
      {/* Capa de fondo actual */}
      <div
        className="absolute inset-0 transition-opacity duration-[2000ms] ease-in-out"
        style={{
          backgroundImage: `url(${currentBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 70%',
          filter: 'blur(6px)',
          transform: 'scale(1.05)',
          opacity: needsTransition ? 0 : 1,
          zIndex: needsTransition ? 1 : 2,
        }}
      />
      {/* Capa de fondo siguiente (para transición suave) */}
      <div
        className="absolute inset-0 transition-opacity duration-[2000ms] ease-in-out"
        style={{
          backgroundImage: `url(${nextBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 70%',
          filter: 'blur(6px)',
          transform: 'scale(1.05)',
          opacity: needsTransition ? 1 : 0,
          zIndex: needsTransition ? 2 : 1,
          pointerEvents: needsTransition ? 'auto' : 'none',
        }}
      />
      {/* Overlay oscuro + degradado para mejorar contraste */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/55 to-black/70 z-10" />
      
      {/* Contenido del carrusel */}
      <div className="relative h-full flex flex-col items-center justify-center px-4 text-center z-20">
        {/* Slide actual del carrusel */}
        <div className="relative w-full max-w-4xl">
          <div className="flex flex-col items-center justify-center transition-opacity duration-[1500ms] ease-in-out">
            {/* Imagen del carrusel */}
            {slides[displaySlide].image && (
              <div className="mb-6">
                <img
                  src={slides[displaySlide].image}
                  alt={slides[displaySlide].title}
                  className="w-24 h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 rounded-full object-cover border-4 border-white/20 shadow-2xl"
                />
              </div>
            )}
            
            <h1 className="font-display font-bold text-3xl md:text-5xl lg:text-6xl mb-4 text-white text-center">
              {slides[displaySlide].title}
        </h1>
            <p className="text-lg md:text-xl text-gray-200/90 mb-2 max-w-2xl text-center">
              {slides[displaySlide].subtitle}
            </p>
            <p className="text-base md:text-lg text-gray-300/80 mb-6 max-w-3xl text-center">
              {slides[displaySlide].description}
            </p>
            
            {/* Botón Ir al Sitio */}
          <Button 
              id={`carousel-button-${displaySlide + 1}`}
              onClick={() => handleButtonClick(displaySlide)}
            size="lg"
              className="bg-[#5ab535] hover:bg-[#4a9e2c] text-white font-semibold px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              data-testid={`carousel-button-${displaySlide + 1}`}
            >
              <ExternalLink className="h-5 w-5 mr-2" />
              {slides[displaySlide].buttonText}
          </Button>
          </div>
        </div>
        
        
        {/* Controles del carrusel - Solo se muestran si hay más de un slide habilitado */}
        {slides.length > 1 && (
          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 flex items-center gap-4">
            {/* Botón anterior */}
            <button
              onClick={goToPrevious}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
              aria-label="Slide anterior"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            
            {/* Indicadores de slides */}
            <div className="flex gap-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === displaySlide ? 'bg-white' : 'bg-white/40'
                  }`}
                  aria-label={`Ir al slide ${index + 1}`}
                />
              ))}
            </div>
            
            {/* Botón siguiente */}
            <button
              onClick={goToNext}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
              aria-label="Slide siguiente"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
