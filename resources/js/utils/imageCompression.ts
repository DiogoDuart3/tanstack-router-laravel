export const compressImage = async (file: File, maxSizeMB = 1, maxWidth = 1200, initialQuality = 0.8): Promise<File> => {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = async () => {
            // Calculate new dimensions while maintaining aspect ratio
            const { width, height } = img;
            let newWidth = width;
            let newHeight = height;

            if (width > maxWidth || height > maxWidth) {
                const ratio = Math.min(maxWidth / width, maxWidth / height);
                newWidth = width * ratio;
                newHeight = height * ratio;
            }

            // Set canvas dimensions
            canvas.width = newWidth;
            canvas.height = newHeight;

            // Draw image
            ctx?.drawImage(img, 0, 0, newWidth, newHeight);

            // Try different quality levels until file size is acceptable
            let quality = initialQuality;
            let attempts = 0;
            const maxAttempts = 10;

            const compressWithQuality = (q: number): Promise<File | null> => {
                return new Promise((resolveBlob) => {
                    canvas.toBlob(
                        (blob) => {
                            if (blob) {
                                const compressedFile = new File([blob], file.name, {
                                    type: file.type === 'image/png' ? 'image/jpeg' : file.type, // Convert PNG to JPEG for better compression
                                    lastModified: Date.now(),
                                });
                                resolveBlob(compressedFile);
                            } else {
                                resolveBlob(null);
                            }
                        },
                        file.type === 'image/png' ? 'image/jpeg' : file.type,
                        q,
                    );
                });
            };

            while (attempts < maxAttempts) {
                const compressedFile = await compressWithQuality(quality);

                if (!compressedFile) {
                    reject(new Error('Failed to compress image'));
                    return;
                }

                console.log(
                    `Compression attempt ${attempts + 1}: ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB with quality ${quality.toFixed(2)}`,
                );

                // Check if file size is acceptable
                if (compressedFile.size <= maxSizeBytes) {
                    console.log(`Successfully compressed image to ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
                    resolve(compressedFile);
                    return;
                }

                // Reduce quality for next attempt
                quality *= 0.8;
                attempts++;

                // If quality gets too low, try reducing dimensions further
                if (quality < 0.3 && attempts < maxAttempts) {
                    newWidth *= 0.8;
                    newHeight *= 0.8;
                    canvas.width = newWidth;
                    canvas.height = newHeight;
                    ctx?.clearRect(0, 0, canvas.width, canvas.height);
                    ctx?.drawImage(img, 0, 0, newWidth, newHeight);
                    quality = 0.7; // Reset quality for smaller image
                    console.log(`Reduced dimensions to ${newWidth.toFixed(0)}x${newHeight.toFixed(0)}, reset quality to ${quality}`);
                }
            }

            // If we still can't get under the size limit, return the last attempt
            const finalFile = await compressWithQuality(quality);
            if (finalFile) {
                resolve(finalFile);
            } else {
                reject(new Error('Failed to compress image to target size'));
            }
        };

        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = URL.createObjectURL(file);
    });
};

export const createImagePreview = async (file: File): Promise<string> => {
    try {
        const compressedFile = await compressImage(file);
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                resolve(e.target?.result as string);
            };
            reader.onerror = reject;
            reader.readAsDataURL(compressedFile);
        });
    } catch (error) {
        console.error('Failed to create image preview:', error);
        // Fallback to original file
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                resolve(e.target?.result as string);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
};
