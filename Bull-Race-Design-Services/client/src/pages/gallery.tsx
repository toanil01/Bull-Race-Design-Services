import { useQuery } from "@tanstack/react-query";
import { Navigation } from "@/components/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Photo } from "@shared/schema";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X } from "lucide-react";

export default function GalleryPage() {
    const { data: photos = [], isLoading } = useQuery<Photo[]>({
        queryKey: ["/api/photos"],
    });

    const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

    return (
        <div className="min-h-screen bg-background pb-12">
            <Navigation />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-24">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-4">
                        Photo Gallery
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Capturing the spirit and intensity of traditional bull racing events.
                    </p>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <Skeleton key={i} className="aspect-[4/3] rounded-lg" />
                        ))}
                    </div>
                ) : photos.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        No photos uploaded yet.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {photos.map((photo) => (
                            <Card
                                key={photo.id}
                                className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                                onClick={() => setSelectedPhoto(photo)}
                            >
                                <div className="aspect-[4/3] overflow-hidden">
                                    <img
                                        src={photo.url}
                                        alt={photo.caption || "Bull race photo"}
                                        className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
                                        loading="lazy"
                                    />
                                </div>
                                {photo.caption && (
                                    <CardContent className="p-4">
                                        <p className="text-sm font-medium leading-none">{photo.caption}</p>
                                        {photo.category && (
                                            <p className="text-xs text-muted-foreground mt-2 capitalize">{photo.category}</p>
                                        )}
                                    </CardContent>
                                )}
                            </Card>
                        ))}
                    </div>
                )}
            </main>

            {selectedPhoto && (
                <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
                    <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/95 border-none">
                        <div className="relative w-full h-full max-h-[90vh] flex items-center justify-center p-4">
                            <img
                                src={selectedPhoto.url}
                                alt={selectedPhoto.caption || "Full size"}
                                className="max-w-full max-h-full object-contain"
                            />
                            {selectedPhoto.caption && (
                                <div className="absolute bottom-4 left-0 right-0 text-center text-white/90 bg-black/50 p-2">
                                    <p className="text-lg font-medium">{selectedPhoto.caption}</p>
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
