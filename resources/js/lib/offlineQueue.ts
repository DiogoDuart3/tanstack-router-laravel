import type { QueuedTodo, QueuedUpdate } from '../types';

class OfflineQueue {
    private createQueue: QueuedTodo[] = [];
    private updateQueue: QueuedUpdate[] = [];
    private maxRetries = 3;
    private isProcessing = false;

    constructor() {
        // Load queues from localStorage on initialization
        this.loadFromStorage();

        // Listen for online events
        window.addEventListener('online', () => {
            this.processQueue();
        });
    }

    private saveToStorage() {
        try {
            // Convert Files to base64 for storage
            const createQueueForStorage = this.createQueue.map((item) => ({
                ...item,
                data: {
                    ...item.data,
                    images: item.data.images
                        ? item.data.images.map((file) => ({
                              name: file.name,
                              type: file.type,
                              size: file.size,
                              lastModified: file.lastModified,
                              data: '', // We'll convert this separately
                          }))
                        : undefined,
                },
            }));

            const updateQueueForStorage = this.updateQueue.map((item) => ({
                ...item,
                data: {
                    ...item.data,
                    images: item.data.images
                        ? item.data.images.map((file) => ({
                              name: file.name,
                              type: file.type,
                              size: file.size,
                              lastModified: file.lastModified,
                              data: '', // We'll convert this separately
                          }))
                        : undefined,
                },
            }));

            localStorage.setItem('todoOfflineCreateQueue', JSON.stringify(createQueueForStorage));
            localStorage.setItem('todoOfflineUpdateQueue', JSON.stringify(updateQueueForStorage));

            // Store images separately as base64
            this.storeImagesInStorage();
        } catch (error) {
            console.error('Failed to save offline queue to storage:', error);
        }
    }

    private async storeImagesInStorage() {
        const imagePromises: Promise<void>[] = [];

        // Process create queue images
        this.createQueue.forEach((item, index) => {
            if (item.data.images) {
                item.data.images.forEach((file, fileIndex) => {
                    imagePromises.push(this.fileToBase64(file, `create_${index}_${fileIndex}`));
                });
            }
        });

        // Process update queue images
        this.updateQueue.forEach((item, index) => {
            if (item.data.images) {
                item.data.images.forEach((file, fileIndex) => {
                    imagePromises.push(this.fileToBase64(file, `update_${index}_${fileIndex}`));
                });
            }
        });

        try {
            await Promise.all(imagePromises);
        } catch (error) {
            console.error('Failed to store images:', error);
        }
    }

    private async fileToBase64(file: File, key: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                try {
                    localStorage.setItem(`offline_image_${key}`, reader.result as string);
                    resolve();
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    private async base64ToFile(base64: string, filename: string, type: string): Promise<File> {
        const response = await fetch(base64);
        const blob = await response.blob();
        return new File([blob], filename, { type });
    }

    private async loadFromStorage() {
        try {
            const createQueueData = localStorage.getItem('todoOfflineCreateQueue');
            const updateQueueData = localStorage.getItem('todoOfflineUpdateQueue');

            if (createQueueData) {
                const parsedCreateQueue = JSON.parse(createQueueData);
                this.createQueue = await Promise.all(
                    parsedCreateQueue.map(async (item: QueuedTodo) => ({
                        ...item,
                        data: {
                            ...item.data,
                            images: item.data.images
                                ? await Promise.all(
                                      item.data.images
                                          .map(async (imgData: { name: string; type: string; size: number; lastModified: number }, index: number) => {
                                              const base64 = localStorage.getItem(`offline_image_create_${parsedCreateQueue.indexOf(item)}_${index}`);
                                              if (base64) {
                                                  return this.base64ToFile(base64, imgData.name, imgData.type);
                                              }
                                              return null;
                                          })
                                          .filter(Boolean),
                                  )
                                : undefined,
                        },
                    })),
                );
            }

            if (updateQueueData) {
                const parsedUpdateQueue = JSON.parse(updateQueueData);
                this.updateQueue = await Promise.all(
                    parsedUpdateQueue.map(async (item: QueuedUpdate) => ({
                        ...item,
                        data: {
                            ...item.data,
                            images: item.data.images
                                ? await Promise.all(
                                      item.data.images
                                          .map(async (imgData: { name: string; type: string; size: number; lastModified: number }, index: number) => {
                                              const base64 = localStorage.getItem(`offline_image_update_${parsedUpdateQueue.indexOf(item)}_${index}`);
                                              if (base64) {
                                                  return this.base64ToFile(base64, imgData.name, imgData.type);
                                              }
                                              return null;
                                          })
                                          .filter(Boolean),
                                  )
                                : undefined,
                        },
                    })),
                );
            }
        } catch (error) {
            console.error('Failed to load offline queue from storage:', error);
            this.createQueue = [];
            this.updateQueue = [];
        }
    }

    queueTodoCreate(data: { title: string; description?: string; images?: File[] }): QueuedTodo {
        const queuedTodo: QueuedTodo = {
            id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            data,
            timestamp: Date.now(),
            retryCount: 0,
        };

        this.createQueue.push(queuedTodo);
        this.saveToStorage();

        // Try to process immediately if online
        if (navigator.onLine) {
            this.processQueue();
        }

        return queuedTodo;
    }

    queueTodoUpdate(
        todoId: string,
        data: { title: string; description?: string; completed?: boolean; images?: File[]; remove_images?: string[] },
    ): string {
        const queuedUpdate: QueuedUpdate = {
            id: `offline_update_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            todoId,
            data,
            timestamp: Date.now(),
            retryCount: 0,
        };

        this.updateQueue.push(queuedUpdate);
        this.saveToStorage();

        // Try to process immediately if online
        if (navigator.onLine) {
            this.processQueue();
        }

        return queuedUpdate.id;
    }

    async processQueue(): Promise<void> {
        if (this.isProcessing || !navigator.onLine) {
            return;
        }

        this.isProcessing = true;

        try {
            // Process create queue
            await this.processCreateQueue();

            // Process update queue
            await this.processUpdateQueue();
        } finally {
            this.isProcessing = false;
        }
    }

    private async processCreateQueue(): Promise<void> {
        const { todosApi } = await import('./api');
        const toRemove: number[] = [];

        for (let i = 0; i < this.createQueue.length; i++) {
            const queuedTodo = this.createQueue[i];

            try {
                await todosApi.create(queuedTodo.data);
                toRemove.push(i);

                // Clean up stored images
                if (queuedTodo.data.images) {
                    queuedTodo.data.images.forEach((_, fileIndex) => {
                        localStorage.removeItem(`offline_image_create_${i}_${fileIndex}`);
                    });
                }
            } catch (error) {
                console.error('Failed to sync queued todo:', error);
                queuedTodo.retryCount++;

                if (queuedTodo.retryCount >= this.maxRetries) {
                    console.warn(`Removing todo from queue after ${this.maxRetries} retries:`, queuedTodo);
                    toRemove.push(i);

                    // Clean up stored images for failed items too
                    if (queuedTodo.data.images) {
                        queuedTodo.data.images.forEach((_, fileIndex) => {
                            localStorage.removeItem(`offline_image_create_${i}_${fileIndex}`);
                        });
                    }
                }
            }
        }

        // Remove processed/failed items (reverse order to maintain indices)
        toRemove.reverse().forEach((index) => {
            this.createQueue.splice(index, 1);
        });

        if (toRemove.length > 0) {
            this.saveToStorage();
        }
    }

    private async processUpdateQueue(): Promise<void> {
        const { todosApi } = await import('./api');
        const toRemove: number[] = [];

        for (let i = 0; i < this.updateQueue.length; i++) {
            const queuedUpdate = this.updateQueue[i];

            try {
                await todosApi.update(queuedUpdate.todoId, queuedUpdate.data);
                toRemove.push(i);

                // Clean up stored images
                if (queuedUpdate.data.images) {
                    queuedUpdate.data.images.forEach((_, fileIndex) => {
                        localStorage.removeItem(`offline_image_update_${i}_${fileIndex}`);
                    });
                }
            } catch (error) {
                console.error('Failed to sync queued update:', error);
                queuedUpdate.retryCount++;

                if (queuedUpdate.retryCount >= this.maxRetries) {
                    console.warn(`Removing update from queue after ${this.maxRetries} retries:`, queuedUpdate);
                    toRemove.push(i);

                    // Clean up stored images for failed items too
                    if (queuedUpdate.data.images) {
                        queuedUpdate.data.images.forEach((_, fileIndex) => {
                            localStorage.removeItem(`offline_image_update_${i}_${fileIndex}`);
                        });
                    }
                }
            }
        }

        // Remove processed/failed items (reverse order to maintain indices)
        toRemove.reverse().forEach((index) => {
            this.updateQueue.splice(index, 1);
        });

        if (toRemove.length > 0) {
            this.saveToStorage();
        }
    }

    getQueueStatus(): { createCount: number; updateCount: number; isOnline: boolean } {
        return {
            createCount: this.createQueue.length,
            updateCount: this.updateQueue.length,
            isOnline: navigator.onLine,
        };
    }

    getQueuedTodos(): QueuedTodo[] {
        return this.createQueue.map((todo) => ({ ...todo }));
    }

    clearQueue(): void {
        // Clear all stored images
        this.createQueue.forEach((item, index) => {
            if (item.data.images) {
                item.data.images.forEach((_, fileIndex) => {
                    localStorage.removeItem(`offline_image_create_${index}_${fileIndex}`);
                });
            }
        });

        this.updateQueue.forEach((item, index) => {
            if (item.data.images) {
                item.data.images.forEach((_, fileIndex) => {
                    localStorage.removeItem(`offline_image_update_${index}_${fileIndex}`);
                });
            }
        });

        this.createQueue = [];
        this.updateQueue = [];
        localStorage.removeItem('todoOfflineCreateQueue');
        localStorage.removeItem('todoOfflineUpdateQueue');
    }
}

// Export singleton instance
export const offlineQueue = new OfflineQueue();
