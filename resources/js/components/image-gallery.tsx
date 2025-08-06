import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ExternalLink, X, ZoomIn } from 'lucide-react';
import { useState } from 'react';

interface ImageGalleryProps {
    images: string[];
    primaryImage?: string;
    onRemoveImage?: (imagePath: string) => void;
    readOnly?: boolean;
    className?: string;
}

export function ImageGallery({ images, primaryImage, onRemoveImage, readOnly = false, className = '' }: ImageGalleryProps) {
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    if (images.length === 0) {
        return null;
    }

    // Sort images so primary image comes first
    const sortedImages = [...images].sort((a, b) => {
        if (a === primaryImage) return -1;
        if (b === primaryImage) return 1;
        return 0;
    });

    const getImagePath = (imageUrl: string) => {
        // Extract just the path part from the full URL for removal
        const url = new URL(imageUrl);
        return url.pathname.replace('/storage/', '');
    };

    return (
        <div className={`space-y-2 ${className}`}>
            {/* Primary Image (larger) */}
            {primaryImage && (
                <div className="group relative">
                    <div className="aspect-video overflow-hidden rounded-lg bg-muted">
                        <img
                            src={primaryImage}
                            alt="Primary image"
                            className="h-full w-full cursor-pointer object-cover transition-transform hover:scale-105"
                            onClick={() => setSelectedImage(primaryImage)}
                        />
                    </div>
                    {!readOnly && onRemoveImage && (
                        <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            className="absolute top-2 right-2 h-6 w-6 rounded-full p-0 opacity-0 transition-opacity group-hover:opacity-100"
                            onClick={() => onRemoveImage(getImagePath(primaryImage))}
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    )}
                    <div className="absolute top-2 left-2 rounded bg-primary px-2 py-1 text-xs text-primary-foreground">Primary</div>
                    <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="absolute right-2 bottom-2 h-6 w-6 rounded-full p-0 opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={() => setSelectedImage(primaryImage)}
                    >
                        <ZoomIn className="h-3 w-3" />
                    </Button>
                </div>
            )}

            {/* Additional Images (smaller) */}
            {sortedImages.length > 1 && (
                <div className="grid grid-cols-3 gap-2 md:grid-cols-4 lg:grid-cols-6">
                    {sortedImages
                        .filter((img) => img !== primaryImage)
                        .map((imageUrl, index) => (
                            <div key={index} className="group relative">
                                <div className="aspect-square overflow-hidden rounded-lg bg-muted">
                                    <img
                                        src={imageUrl}
                                        alt={`Image ${index + 1}`}
                                        className="h-full w-full cursor-pointer object-cover transition-transform hover:scale-105"
                                        onClick={() => setSelectedImage(imageUrl)}
                                    />
                                </div>
                                {!readOnly && onRemoveImage && (
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="destructive"
                                        className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 opacity-0 transition-opacity group-hover:opacity-100"
                                        onClick={() => onRemoveImage(getImagePath(imageUrl))}
                                    >
                                        <X className="h-2 w-2" />
                                    </Button>
                                )}
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="secondary"
                                    className="absolute right-1 bottom-1 h-4 w-4 rounded-full p-0 opacity-0 transition-opacity group-hover:opacity-100"
                                    onClick={() => setSelectedImage(imageUrl)}
                                >
                                    <ZoomIn className="h-2 w-2" />
                                </Button>
                            </div>
                        ))}
                </div>
            )}

            {/* Image Modal */}
            <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
                <DialogContent className="!h-[95vh] !max-h-[95vh] !w-[95vw] !max-w-[95vw] p-2 [&>button]:border [&>button]:bg-white [&>button]:text-black [&>button]:opacity-90 [&>button]:shadow-lg [&>button]:hover:opacity-100">
                    {selectedImage && (
                        <div className="relative flex h-full w-full items-center justify-center">
                            <img src={selectedImage} alt="Full size image" className="max-h-full max-w-full rounded-lg object-contain" />
                            <div className="absolute top-4 right-14">
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => window.open(selectedImage, '_blank')}
                                    className="border bg-white text-black shadow-lg hover:bg-gray-100"
                                >
                                    <ExternalLink className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
