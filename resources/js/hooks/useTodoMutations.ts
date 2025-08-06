import { todosApi } from '@/lib/api';
import { compressImage } from '@/utils/imageCompression';
import { useMutation } from '@tanstack/react-query';

export interface CreateTodoInput {
    title: string;
    description?: string;
    imageFile?: File;
}

export function useTodoMutations() {
    const createTodoMutation = useMutation({
        mutationFn: async (input: CreateTodoInput) => {
            let images: File[] = [];

            // If there's an image, compress it first
            if (input.imageFile) {
                console.log('Original image size:', input.imageFile.size, 'bytes');

                // Compress the image
                const compressedFile = await compressImage(input.imageFile);
                console.log('Compressed image size:', compressedFile.size, 'bytes');
                console.log('Compression ratio:', ((1 - compressedFile.size / input.imageFile.size) * 100).toFixed(1) + '%');

                images = [compressedFile];
            }

            // Create the todo with compressed image
            const response = await todosApi.create({
                title: input.title,
                description: input.description,
                images: images.length > 0 ? images : undefined,
            });

            return response.todo;
        },
    });

    const toggleTodoMutation = useMutation({
        mutationFn: async (input: { id: number; completed: boolean }) => {
            const response = await todosApi.update(String(input.id), {
                title: '', // This will be overridden by the server
                completed: input.completed,
            });
            return response.todo;
        },
    });

    const deleteTodoMutation = useMutation({
        mutationFn: async (input: { id: number }) => {
            return await todosApi.delete(String(input.id));
        },
    });

    return {
        createTodoMutation,
        toggleTodoMutation,
        deleteTodoMutation,
    };
}
