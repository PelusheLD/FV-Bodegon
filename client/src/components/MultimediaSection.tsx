import { useQuery } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { Loader2, Instagram, ExternalLink, Heart, MessageCircle, Play } from "lucide-react";

interface InstagramPost {
  id: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url: string;
  permalink: string;
  caption?: string;
  timestamp: string;
  thumbnail_url?: string;
  like_count?: number;
  comments_count?: number;
}

interface MultimediaSectionProps {
  instagramUrl?: string | null;
}

// Componente de video personalizado
function VideoPlayer({ post }: { post: InstagramPost }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVideoClick = () => {
    togglePlay();
  };

  const handleMouseEnter = () => {
    setShowControls(true);
  };

  const handleMouseLeave = () => {
    setShowControls(false);
  };

  return (
    <div 
      className="relative w-full h-full cursor-pointer"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleVideoClick}
    >
      <video
        ref={videoRef}
        src={post.media_url}
        poster={post.thumbnail_url}
        className="w-full h-full object-cover"
        preload="metadata"
        playsInline
        muted
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
      />
      
      {/* Botón de reproducción personalizado */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-10">
          <div className="bg-white bg-opacity-90 rounded-full p-6 shadow-lg hover:bg-opacity-100 transition-all duration-500">
            <Play className="h-12 w-12 text-gray-800 ml-1" fill="currentColor" />
          </div>
        </div>
      )}
      
      {/* Controles personalizados */}
      {showControls && (
        <div className="absolute bottom-3 left-3 right-3 bg-black bg-opacity-80 rounded-lg px-3 py-2">
          <div className="flex items-center justify-between text-white text-sm">
            <span className="font-medium">{isPlaying ? 'Reproduciendo' : 'Pausado'}</span>
            <div className="flex items-center space-x-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlay();
                }}
                className="hover:bg-white hover:bg-opacity-20 rounded p-1"
              >
                {isPlaying ? '⏸️' : '▶️'}
              </button>
              <a
                href={post.permalink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="hover:bg-white hover:bg-opacity-20 rounded p-1"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MultimediaSection({ instagramUrl }: MultimediaSectionProps) {
  const { data: posts = [], isLoading, error } = useQuery<InstagramPost[]>({
    queryKey: ["/api/instagram/posts"],
    enabled: !!instagramUrl,
    refetchInterval: 300000, // Refetch every 5 minutes
    staleTime: 300000, // Data is considered fresh for 5 minutes
  });

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      if (diffInHours < 1) {
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
        return diffInMinutes < 1 ? 'Ahora' : `Hace ${diffInMinutes}m`;
      }
      return `Hace ${diffInHours}h`;
    } else if (diffInHours < 168) { // 7 días
      const diffInDays = Math.floor(diffInHours / 24);
      return `Hace ${diffInDays}d`;
    } else {
      return date.toLocaleDateString('es-VE', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const truncateCaption = (caption: string, maxLength: number = 100) => {
    if (caption.length <= maxLength) return caption;
    return caption.substring(0, maxLength) + '...';
  };

  const formatNumber = (num: number | undefined): string => {
    if (!num) return '0';
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const getEngagementLevel = (likes: number | undefined, comments: number | undefined): string => {
    const totalEngagement = (likes || 0) + (comments || 0);
    if (totalEngagement >= 1000) return '🔥'; // Alto engagement
    if (totalEngagement >= 500) return '⭐'; // Medio engagement
    if (totalEngagement >= 100) return '👍'; // Bajo engagement
    return '📱'; // Muy bajo engagement
  };

  return (
    <section className="py-12 md:py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Instagram className="h-8 w-8 text-pink-500 mr-3" />
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Nuestro Instagram
            </h2>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Descubre nuestras últimas publicaciones y mantente al día con nuestras novedades
          </p>
          {instagramUrl && (
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center mt-4 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg transition-colors"
            >
              <Instagram className="h-5 w-5 mr-2" />
              Síguenos en Instagram
              <ExternalLink className="h-4 w-4 ml-2" />
            </a>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-pink-500" />
            <p className="text-gray-600">Cargando publicaciones de Instagram...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
              <p className="text-red-800 font-medium mb-2">Error al cargar Instagram</p>
              <p className="text-red-600 text-sm">
                No se pudieron cargar las publicaciones. Verifica la configuración de Instagram en el panel de administración.
              </p>
            </div>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 max-w-md mx-auto">
              <Instagram className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-medium mb-2">No hay publicaciones disponibles</p>
              <p className="text-gray-500 text-sm">
                Las publicaciones de Instagram aparecerán aquí una vez configuradas.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {posts.map((post) => (
              <div
                key={post.id}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-500 transform hover:scale-102"
              >
                {/* Media */}
                <div className="relative aspect-square overflow-hidden">
                  {post.media_type === 'VIDEO' ? (
                    <VideoPlayer post={post} />
                  ) : (
                    <>
                      <img
                        src={post.media_url}
                        alt={post.caption || 'Publicación de Instagram'}
                        className="w-full h-full object-cover hover:scale-102 transition-transform duration-500"
                      />
                      
                      {/* Overlay para imágenes */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-500 flex items-center justify-center">
                        <a
                          href={post.permalink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="opacity-0 hover:opacity-100 transition-opacity duration-500"
                        >
                          <div className="bg-white rounded-full p-3 shadow-lg">
                            <ExternalLink className="h-5 w-5 text-gray-800" />
                          </div>
                        </a>
                      </div>
                    </>
                  )}
                  
                  {/* Media Type Badge */}
                  <div className="absolute top-3 right-3 flex space-x-2 z-10">
                    <div className="bg-black bg-opacity-80 text-white text-sm px-3 py-1 rounded-full font-medium">
                      {post.media_type === 'VIDEO' ? '🎥' : post.media_type === 'CAROUSEL_ALBUM' ? '📷' : '📸'}
                    </div>
                    <div className="bg-black bg-opacity-80 text-white text-sm px-3 py-1 rounded-full font-medium">
                      {getEngagementLevel(post.like_count, post.comments_count)}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  {post.caption && (
                    <p className="text-gray-700 text-base mb-4 line-clamp-2 leading-relaxed">
                      {truncateCaption(post.caption, 80)}
                    </p>
                  )}
                  
                  {/* Stats */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      {post.like_count !== undefined && (
                        <div className="flex items-center group relative">
                          <Heart className="h-4 w-4 mr-1 text-red-500" />
                          <span className="font-medium">{formatNumber(post.like_count)}</span>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                            {post.like_count.toLocaleString()} me gusta
                          </div>
                        </div>
                      )}
                      {post.comments_count !== undefined && (
                        <div className="flex items-center group relative">
                          <MessageCircle className="h-4 w-4 mr-1 text-blue-500" />
                          <span className="font-medium">{formatNumber(post.comments_count)}</span>
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                            {post.comments_count.toLocaleString()} comentarios
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Instagram className="h-4 w-4 mr-1" />
                      <span className="capitalize font-medium">{post.media_type.toLowerCase()}</span>
                    </div>
                  </div>
                  
                  {/* Date */}
                  <div className="text-sm text-gray-400 font-medium">
                    {formatDate(post.timestamp)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
