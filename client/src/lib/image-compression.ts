export interface ImageCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeKB?: number;
}

export async function compressImage(
  file: File, 
  options: ImageCompressionOptions = {}
): Promise<string> {
  const {
    maxWidth = 800,
    maxHeight = 800,
    quality = 0.8,
    maxSizeKB = 500
  } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    img.onload = () => {
      try {
        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;

        // Draw and compress image
        ctx.drawImage(img, 0, 0, width, height);

        // Try different quality levels to meet size requirements
        let currentQuality = quality;
        let compressedDataUrl = '';

        const tryCompress = () => {
          compressedDataUrl = canvas.toDataURL('image/jpeg', currentQuality);
          
          // Estimate size in KB (base64 is roughly 4/3 of actual size)
          const sizeKB = (compressedDataUrl.length * 0.75) / 1024;
          
          if (sizeKB > maxSizeKB && currentQuality > 0.1) {
            currentQuality -= 0.1;
            tryCompress();
          } else {
            resolve(compressedDataUrl);
          }
        };

        tryCompress();
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = URL.createObjectURL(file);
  });
}

export async function resizeImageForAvatar(file: File): Promise<string> {
  return compressImage(file, {
    maxWidth: 200,
    maxHeight: 200,
    quality: 0.9,
    maxSizeKB: 100
  });
}

export async function resizeImageForHabit(file: File): Promise<string> {
  return compressImage(file, {
    maxWidth: 600,
    maxHeight: 600,
    quality: 0.8,
    maxSizeKB: 300
  });
}
