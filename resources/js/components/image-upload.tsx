import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface ImageUploadProps {
  images: File[];
  onImagesChange: (images: File[]) => void;
  maxImages?: number;
  maxSizePerImage?: number; // in MB
  acceptedTypes?: string[];
}

export function ImageUpload({
  images,
  onImagesChange,
  maxImages = 5,
  maxSizePerImage = 10,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp']
}: ImageUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const newFiles = Array.from(files);
    const validFiles: File[] = [];

    for (const file of newFiles) {
      // Check file type
      if (!acceptedTypes.includes(file.type)) {
        toast.error(`File ${file.name} is not a supported image type`);
        continue;
      }

      // Check file size
      if (file.size > maxSizePerImage * 1024 * 1024) {
        toast.error(`File ${file.name} is too large. Maximum size is ${maxSizePerImage}MB`);
        continue;
      }

      validFiles.push(file);
    }

    // Check total images limit
    const totalImages = images.length + validFiles.length;
    if (totalImages > maxImages) {
      toast.error(`Maximum ${maxImages} images are allowed`);
      const allowedNewFiles = validFiles.slice(0, maxImages - images.length);
      onImagesChange([...images, ...allowedNewFiles]);
    } else {
      onImagesChange([...images, ...validFiles]);
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragOver
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="flex flex-col items-center gap-2">
          <Upload className="h-8 w-8 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">
              Drop images here or{' '}
              <Button
                type="button"
                variant="link"
                className="p-0 h-auto text-primary"
                onClick={() => fileInputRef.current?.click()}
              >
                browse
              </Button>
            </p>
            <p className="text-xs text-muted-foreground">
              Up to {maxImages} images, max {maxSizePerImage}MB each
            </p>
          </div>
        </div>
        <Input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
        />
      </div>

      {/* Image Previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((file, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                {file.type.startsWith('image/') ? (
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover"
                    onLoad={() => {
                      // Clean up object URL to prevent memory leaks
                      URL.revokeObjectURL(URL.createObjectURL(file));
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeImage(index)}
              >
                <X className="h-3 w-3" />
              </Button>
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {file.name}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}