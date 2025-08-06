import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { compressImage } from '@/utils/imageCompression';

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
  acceptedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp']
}: Omit<ImageUploadProps, 'maxSizePerImage'>) {
  const [dragOver, setDragOver] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState({ current: 0, total: 0 });
  const [currentProcessingFile, setCurrentProcessingFile] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || isCompressing) return;

    setIsCompressing(true);
    const newFiles = Array.from(files);
    const validFiles: File[] = [];
    
    setCompressionProgress({ current: 0, total: newFiles.length });
    toast.info(`Compressing ${newFiles.length} image${newFiles.length > 1 ? 's' : ''}...`);

    for (let i = 0; i < newFiles.length; i++) {
      const file = newFiles[i];
      // Check file type
      if (!acceptedTypes.includes(file.type)) {
        toast.error(`File ${file.name} is not a supported image type`);
        setCompressionProgress(prev => ({ ...prev, current: prev.current + 1 }));
        continue;
      }

      try {
        setCurrentProcessingFile(file.name);
        setCompressionProgress(prev => ({ ...prev, current: i }));
        console.log(`Compressing ${file.name}: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
        
        // Compress the image to ensure it's under 1MB
        const compressedFile = await compressImage(file, 1); // 1MB max
        validFiles.push(compressedFile);
        
        console.log(`Compressed ${file.name}: ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
        
        // Show success toast if compression significantly reduced file size
        const compressionRatio = (file.size - compressedFile.size) / file.size;
        if (compressionRatio > 0.1) { // If compressed by more than 10%
          toast.success(`${file.name} compressed from ${(file.size / 1024 / 1024).toFixed(1)}MB to ${(compressedFile.size / 1024 / 1024).toFixed(1)}MB`);
        } else {
          toast.success(`${file.name} processed (${(compressedFile.size / 1024 / 1024).toFixed(1)}MB)`);
        }
      } catch (error) {
        console.error('Failed to compress image:', error);
        toast.error(`Failed to process ${file.name}. Please try a different image.`);
      }
      
      setCompressionProgress(prev => ({ ...prev, current: prev.current + 1 }));
    }

    setIsCompressing(false);
    setCurrentProcessingFile('');
    setCompressionProgress({ current: 0, total: 0 });

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
        } ${isCompressing ? 'opacity-50 pointer-events-none' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="flex flex-col items-center gap-2">
          {isCompressing ? (
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          ) : (
            <Upload className="h-8 w-8 text-muted-foreground" />
          )}
          <div>
            <p className="text-sm font-medium">
              {isCompressing ? (
                <div className="space-y-1">
                  <div>
                    Compressing {currentProcessingFile ? `"${currentProcessingFile}"` : 'images...'}
                  </div>
                  {compressionProgress.total > 1 && (
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground">
                        {compressionProgress.current} of {compressionProgress.total} images
                      </div>
                      <div className="w-48 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                        <div
                          className="bg-primary h-1.5 rounded-full transition-all duration-300"
                          style={{
                            width: `${(compressionProgress.current / compressionProgress.total) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  Drop images here or{' '}
                  <Button
                    type="button"
                    variant="link"
                    className="p-0 h-auto text-primary"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isCompressing}
                  >
                    browse
                  </Button>
                </>
              )}
            </p>
            <p className="text-xs text-muted-foreground">
              Up to {maxImages} images, automatically compressed to 1MB each
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