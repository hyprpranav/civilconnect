export interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
  apiKey?: string;
}

const CLOUDINARY_CONFIG_KEY = 'civil_connect_cloudinary_config';

export function getSavedCloudinaryConfig(): CloudinaryConfig | null {
  try {
    const stored = localStorage.getItem(CLOUDINARY_CONFIG_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.cloudName && parsed.uploadPreset) {
        return parsed;
      }
    }

    const envConfig: CloudinaryConfig = {
      cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '',
      uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '',
      apiKey: import.meta.env.VITE_CLOUDINARY_API_KEY || ''
    };

    if (envConfig.cloudName && envConfig.uploadPreset) {
      return envConfig;
    }
  } catch (err) {
    console.warn('Failed to load Cloudinary config', err);
  }
  return null;
}

export function saveCloudinaryConfig(config: CloudinaryConfig) {
  localStorage.setItem(CLOUDINARY_CONFIG_KEY, JSON.stringify(config));
}

export interface ImageUploadResult {
  success: boolean;
  imageUrl?: string;
  publicId?: string;
  message?: string;
}

class CloudinaryService {
  // Validate file type and size (< 3MB)
  public validateImageFile(file: File): { isValid: boolean; error?: string } {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      return { isValid: false, error: 'Only JPG, PNG, and WebP images are supported.' };
    }

    const maxSizeInBytes = 3 * 1024 * 1024; // 3MB
    if (file.size > maxSizeInBytes) {
      return { isValid: false, error: 'Image size exceeds maximum limit of 3MB.' };
    }

    return { isValid: true };
  }

  // Upload an image file to Cloudinary (or local fallback if not configured)
  public async uploadProfileImage(file: File, studentRegNo: string): Promise<ImageUploadResult> {
    const validation = this.validateImageFile(file);
    if (!validation.isValid) {
      return { success: false, message: validation.error };
    }

    const config = getSavedCloudinaryConfig();

    if (config && config.cloudName && config.uploadPreset) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', config.uploadPreset);
        formData.append('tags', `student,${studentRegNo}`);

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`,
          {
            method: 'POST',
            body: formData
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || 'Cloudinary upload failed');
        }

        const data = await response.json();
        return {
          success: true,
          imageUrl: data.secure_url,
          publicId: data.public_id,
          message: 'Profile image uploaded to Cloudinary successfully'
        };
      } catch (err: any) {
        console.error('Cloudinary API upload error:', err);
        // Fallback to local Data URL so the user is never blocked
        const localDataUrl = await this.readFileAsDataURL(file);
        return {
          success: true,
          imageUrl: localDataUrl,
          publicId: `local-${Date.now()}`,
          message: `Cloudinary error (${err.message}). Stored image locally for preview.`
        };
      }
    }

    // If Cloudinary is not yet configured, read as high-quality local Data URL
    const localDataUrl = await this.readFileAsDataURL(file);
    return {
      success: true,
      imageUrl: localDataUrl,
      publicId: `local-${Date.now()}`,
      message: 'Image uploaded successfully (Local storage mode active. Configure Cloudinary in Admin settings for CDN).'
    };
  }

  // Helper to convert file to Data URL
  public readFileAsDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  }

  // Generate optimized Cloudinary transformation URL (e.g. face crop, auto format)
  public getOptimizedImageUrl(rawUrl: string, width = 300, height = 300): string {
    if (!rawUrl) return '';
    if (rawUrl.includes('res.cloudinary.com')) {
      return rawUrl.replace('/upload/', `/upload/c_fill,g_face,w_${width},h_${height},q_auto,f_auto/`);
    }
    return rawUrl;
  }
}

export const cloudinaryService = new CloudinaryService();
