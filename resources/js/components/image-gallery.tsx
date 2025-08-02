import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, ZoomIn, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

interface ImageGalleryProps {
  images: string[];
  primaryImage?: string;
  onRemoveImage?: (imagePath: string) => void;
  readOnly?: boolean;
  className?: string;
}

export function ImageGallery({
  images,
  primaryImage,
  onRemoveImage,
  readOnly = false,
  className = ''
}: ImageGalleryProps) {
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
        <div className="relative group">
          <div className="aspect-video bg-muted rounded-lg overflow-hidden">
            <img
              src={primaryImage}
              alt="Primary image"
              className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
              onClick={() => setSelectedImage(primaryImage)}
            />
          </div>
          {!readOnly && onRemoveImage && (
            <Button
              type="button"
              size="sm"
              variant="destructive"
              className="absolute top-2 right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => onRemoveImage(getImagePath(primaryImage))}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
            Primary
          </div>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="absolute bottom-2 right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => setSelectedImage(primaryImage)}
          >
            <ZoomIn className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Additional Images (smaller) */}
      {sortedImages.length > 1 && (
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {sortedImages
            .filter(img => img !== primaryImage)
            .map((imageUrl, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                  <img
                    src={imageUrl}
                    alt={`Image ${index + 1}`}
                    className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => setSelectedImage(imageUrl)}
                  />
                </div>
                {!readOnly && onRemoveImage && (
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => onRemoveImage(getImagePath(imageUrl))}
                  >
                    <X className="h-2 w-2" />
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="absolute bottom-1 right-1 h-4 w-4 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
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
        <DialogContent className="max-w-4xl max-h-[90vh]">
          {selectedImage && (
            <div className="relative">
              <img
                src={selectedImage}
                alt="Full size image"
                className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
              />
              <div className="absolute top-2 right-2 flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => window.open(selectedImage, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setSelectedImage(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}