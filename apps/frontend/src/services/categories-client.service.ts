'use client'

import { Category } from "@/types/category";

// Upload/update category image (client-side only via Next.js API route)
export async function setCategoryImage(categoryId: number, imageFile: File): Promise<Category> {
    console.log('🖼️ Uploading image:', {
        categoryId,
        fileName: imageFile.name,
        fileSize: imageFile.size,
        fileType: imageFile.type
    });

    const formData = new FormData();
    formData.append('image', imageFile);

    // Log FormData content (for debugging)
    console.log('📦 FormData entries:');
    for (const [key, value] of formData.entries()) {
        console.log(`  ${key}:`, value);
    }

    // Use Next.js API route instead of direct backend call
    const response = await fetch(`/api/categories/${categoryId}/image`, {
        method: 'PATCH',
        body: formData,
        // Don't set Content-Type - browser will set it with boundary
    });

    if (!response.ok) {
        const error = await response.json();
        console.error('❌ Image upload failed:', error);
        throw new Error(error.error || 'Failed to upload image');
    }

    const data = await response.json();
    console.log('✅ Image upload response:', data);
    return data;
}
