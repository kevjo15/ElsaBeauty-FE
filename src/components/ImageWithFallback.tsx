import { useEffect, useState } from "react";
import { ImageOff } from "lucide-react";

type ImageWithFallbackProps = {
  src?: string;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
  fallbackText?: string;
  width?: number;
  height?: number;
};

const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  alt,
  className = "",
  loading = "lazy",
  fallbackText = "Bild kunde inte laddas",
  width,
  height,
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Nollställ vid ny källa — annars fastnar en tidigare felad bild i fallback
  // även när en ny giltig src ges (t.ex. byt bild i admin, eller ny SAS-URL).
  useEffect(() => {
    setHasError(false);
    setIsLoaded(false);
  }, [src]);

  if (!src || hasError) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-base-200 text-base-content/40 ${className}`}
        role="img"
        aria-label={alt}
      >
        <ImageOff className="h-8 w-8 mb-1" />
        <span className="text-xs">{fallbackText}</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {!isLoaded && (
        <div className="absolute inset-0 skeleton" aria-hidden="true" />
      )}
      <img
        src={src}
        alt={alt}
        loading={loading}
        width={width}
        height={height}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`${className} transition-opacity duration-300 ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
};

export default ImageWithFallback;
