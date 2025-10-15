import { useState, useRef, useEffect } from 'react';
import { useIntersectionObserver } from '@/hooks/use-intersection-observer';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
  placeholder?: string;
}

export function LazyImage({ src, alt, className, fallbackSrc, placeholder }: LazyImageProps) {
  const [imageSrc, setImageSrc] = useState(placeholder || '');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [error, setError] = useState(false);
  const { elementRef, hasIntersected } = useIntersectionObserver({
    rootMargin: '50px',
  });

  useEffect(() => {
    if (hasIntersected && !imageLoaded && !error) {
      const img = new Image();
      img.onload = () => {
        setImageSrc(src);
        setImageLoaded(true);
      };
      img.onerror = () => {
        if (fallbackSrc) {
          const fallbackImg = new Image();
          fallbackImg.onload = () => {
            setImageSrc(fallbackSrc);
            setImageLoaded(true);
          };
          fallbackImg.onerror = () => setError(true);
          fallbackImg.src = fallbackSrc;
        } else {
          setError(true);
        }
      };
      img.src = src;
    }
  }, [hasIntersected, src, fallbackSrc, imageLoaded, error]);

  if (error) {
    return (
      <div className={`bg-gray-800 flex items-center justify-center ${className || ''}`}>
        <span className="text-gray-400 text-sm">Image unavailable</span>
      </div>
    );
  }

  return (
    <div ref={elementRef as any} className={className}>
      {imageSrc ? (
        <img
          src={imageSrc}
          alt={alt}
          className={`transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-50'} w-full h-full object-cover`}
          onLoad={() => setImageLoaded(true)}
        />
      ) : (
        <div className="w-full h-full bg-gray-800 animate-pulse"></div>
      )}
    </div>
  );
}