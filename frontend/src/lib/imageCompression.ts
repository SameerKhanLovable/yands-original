/**
 * Compress image to reduce size before uploading/storing
 */
export const compressImage = async (
  dataUrl: string,
  maxWidth: number = 800,
  quality: number = 0.7
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Calculate new dimensions
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Fill with WHITE background first (fixes black background issue)
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      
      // Then draw image on top
      ctx.drawImage(img, 0, 0, width, height);

      // Compress and convert to JPEG (smaller than PNG)
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedDataUrl);
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = dataUrl;
  });
};

/**
 * Compress all images in rental data before saving
 */
export const compressRentalImages = async (rental: any): Promise<any> => {
  const compressed = { ...rental };

  try {
    // Compress client images
    if (compressed.client?.photo?.startsWith('data:')) {
      compressed.client.photo = await compressImage(compressed.client.photo, 600, 0.6);
    }
    if (compressed.client?.cnicFrontImage?.startsWith('data:')) {
      compressed.client.cnicFrontImage = await compressImage(compressed.client.cnicFrontImage, 800, 0.7);
    }
    if (compressed.client?.cnicBackImage?.startsWith('data:')) {
      compressed.client.cnicBackImage = await compressImage(compressed.client.cnicBackImage, 800, 0.7);
    }
    if (compressed.client?.drivingLicenseImage?.startsWith('data:')) {
      compressed.client.drivingLicenseImage = await compressImage(compressed.client.drivingLicenseImage, 800, 0.7);
    }

    // Compress vehicle image
    if (compressed.vehicle?.image?.startsWith('data:')) {
      compressed.vehicle.image = await compressImage(compressed.vehicle.image, 600, 0.6);
    }

    // Compress signatures (smaller size, higher quality)
    if (compressed.clientSignature?.startsWith('data:')) {
      compressed.clientSignature = await compressImage(compressed.clientSignature, 400, 0.8);
    }
    if (compressed.ownerSignature?.startsWith('data:')) {
      compressed.ownerSignature = await compressImage(compressed.ownerSignature, 400, 0.8);
    }

    // Compress damage photos
    if (compressed.dentsScratches?.images && Array.isArray(compressed.dentsScratches.images)) {
      const compressedDamageImages = [];
      for (const img of compressed.dentsScratches.images) {
        if (img?.startsWith('data:')) {
          compressedDamageImages.push(await compressImage(img, 600, 0.6));
        } else {
          compressedDamageImages.push(img);
        }
      }
      compressed.dentsScratches.images = compressedDamageImages;
    }

    console.log('✅ All images compressed successfully');
    return compressed;
  } catch (error) {
    console.error('⚠️ Image compression failed:', error);
    return rental; // Return original if compression fails
  }
};
