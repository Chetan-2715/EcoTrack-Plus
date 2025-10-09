export interface ImageValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export async function validateRecyclingImage(file: File): Promise<ImageValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Basic file validation
  if (!file) {
    errors.push("Please select an image file");
    return { isValid: false, errors, warnings };
  }

  // Check file type
  if (!file.type.startsWith('image/')) {
    errors.push("Please select a valid image file (JPEG, PNG, GIF, or WebP)");
    return { isValid: false, errors, warnings };
  }

  // Check file size (max 5MB)
  const maxSizeInBytes = 5 * 1024 * 1024;
  if (file.size > maxSizeInBytes) {
    errors.push("Image file size must be less than 5MB");
    return { isValid: false, errors, warnings };
  }

  // Check minimum file size (to avoid very small/unclear images)
  const minSizeInBytes = 10 * 1024; // 10KB
  if (file.size < minSizeInBytes) {
    warnings.push("Image appears to be very small. Please ensure it clearly shows the recycled item.");
  }

  try {
    // Load image to check dimensions and quality
    const imageValidation = await analyzeImageProperties(file);
    
    if (imageValidation.width < 200 || imageValidation.height < 200) {
      warnings.push("Image resolution is quite low. For better verification, please use a higher quality image.");
    }

    if (imageValidation.aspectRatio < 0.5 || imageValidation.aspectRatio > 2) {
      warnings.push("Unusual image aspect ratio detected. Please ensure the recycled item is clearly visible and centered.");
    }

    // Check if image is too dark or too bright
    if (imageValidation.averageBrightness < 50) {
      warnings.push("Image appears dark. Please ensure good lighting for better verification.");
    } else if (imageValidation.averageBrightness > 200) {
      warnings.push("Image appears overexposed. Please adjust lighting for clearer visibility.");
    }

    // Add general guidance
    if (warnings.length === 0) {
      warnings.push("Please ensure your image clearly shows the recyclable item(s) and is well-lit for verification.");
    }

  } catch (error) {
    console.error('Error analyzing image:', error);
    warnings.push("Unable to fully analyze image quality. Please ensure the image clearly shows recyclable items.");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

interface ImageProperties {
  width: number;
  height: number;
  aspectRatio: number;
  averageBrightness: number;
}

async function analyzeImageProperties(file: File): Promise<ImageProperties> {
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
        const { width, height } = img;
        const aspectRatio = width / height;

        // Sample the image to calculate average brightness
        canvas.width = Math.min(width, 100); // Sample max 100x100 for performance
        canvas.height = Math.min(height, 100);
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        let totalBrightness = 0;
        for (let i = 0; i < data.length; i += 4) {
          // Calculate luminance using standard formula
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
          totalBrightness += luminance;
        }
        
        const averageBrightness = totalBrightness / (data.length / 4);

        resolve({
          width,
          height,
          aspectRatio,
          averageBrightness
        });
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

// Common recyclable items for reference
export const RECYCLABLE_ITEMS = [
  'Plastic Bottles', 'Glass Bottles', 'Aluminum Cans', 'Paper/Cardboard',
  'Electronics', 'Batteries', 'Clothing', 'Food Waste', 'Metal Items',
  'Plastic Containers', 'Newspaper', 'Magazines', 'Cardboard Boxes'
];

// Image guidelines for users
export const RECYCLING_IMAGE_GUIDELINES = [
  "📸 Take a clear, well-lit photo of the recyclable item(s)",
  "🎯 Center the item in the frame and ensure it's the main focus",
  "💡 Use good lighting - avoid shadows and overexposure", 
  "📏 Include the full item in the photo for easy identification",
  "🚫 Avoid blurry or distorted images",
  "✅ Multiple similar items in one photo is okay (e.g., several bottles)"
];
