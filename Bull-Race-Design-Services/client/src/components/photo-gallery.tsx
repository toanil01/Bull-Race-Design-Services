import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import type { Photo } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

export function PhotoGallery() {
  const { data: photos = [], isLoading } = useQuery<Photo[]>({
    queryKey: ["/api/photos"],
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // ... (existing effects)

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrevious();
    }
  };

  // Use up to 10 latest photos, or fallback to placeholder if none
  const displayPhotos = photos.length > 0 ? photos.slice(0, 10) : [];

  useEffect(() => {
    if (displayPhotos.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % displayPhotos.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [displayPhotos.length]);

  const goToPrevious = () => {
    if (displayPhotos.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + displayPhotos.length) % displayPhotos.length);
  };

  const goToNext = () => {
    if (displayPhotos.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % displayPhotos.length);
  };

  if (isLoading) {
    return <Skeleton className="w-full aspect-[16/9] rounded-md" />;
  }

  if (displayPhotos.length === 0) {
    return (
      <div className="w-full aspect-[16/9] bg-muted flex flex-col items-center justify-center rounded-md text-muted-foreground p-8">
        <ImageIcon className="h-12 w-12 mb-4 opacity-50" />
        <p>No photos added yet</p>
      </div>
    );
  }

  const currentPhoto = displayPhotos[currentIndex];

  return (
    <>
      <div
        className="relative w-full aspect-[16/9] rounded-md overflow-hidden bg-muted group touch-pan-y"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="absolute inset-0 flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
          {displayPhotos.map((photo, index) => (
            <div
              key={photo.id || index}
              className="min-w-full h-full flex-shrink-0 cursor-pointer"
              onClick={() => setIsModalOpen(true)}
            >
              <img
                src={photo.url}
                alt={photo.caption || "Gallery Image"}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>

        {displayPhotos.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
              data-testid="button-gallery-prev"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => { e.stopPropagation(); goToNext(); }}
              data-testid="button-gallery-next"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {displayPhotos.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => { e.stopPropagation(); setCurrentIndex(index); }}
                  className={cn(
                    "w-2 h-2 rounded-full transition-colors backdrop-blur-sm",
                    index === currentIndex ? "bg-white" : "bg-white/50"
                  )}
                  data-testid={`button-gallery-dot-${index}`}
                />
              ))}
            </div>
          </>
        )}

        {(currentPhoto.caption || currentPhoto.category) && (
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-12">
            {currentPhoto.caption && (
              <p className="text-white text-lg font-medium">{currentPhoto.caption}</p>
            )}
            {currentPhoto.category && (
              <p className="text-white/80 text-sm mt-1 uppercase tracking-wide">{currentPhoto.category}</p>
            )}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/10"
            onClick={() => setIsModalOpen(false)}
            data-testid="button-gallery-close"
          >
            <X className="h-8 w-8" />
          </Button>

          {displayPhotos.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/10 p-2 h-12 w-12"
                onClick={goToPrevious}
                data-testid="button-modal-prev"
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/10 p-2 h-12 w-12"
                onClick={goToNext}
                data-testid="button-modal-next"
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            </>
          )}

          <div className="relative max-w-full max-h-screen flex flex-col items-center">
            <img
              src={currentPhoto.url}
              alt={currentPhoto.caption || "Gallery"}
              className="max-w-full max-h-[85vh] object-contain rounded-md"
            />

            {(currentPhoto.caption || currentPhoto.category) && (
              <div className="mt-4 text-center">
                {currentPhoto.caption && <p className="text-white text-xl font-medium">{currentPhoto.caption}</p>}
                {currentPhoto.category && <p className="text-white/70 text-sm">{currentPhoto.category}</p>}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
