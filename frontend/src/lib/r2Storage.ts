import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const getS3Client = () => {
  const ACCOUNT_ID = import.meta.env.VITE_CLOUDFLARE_ACCOUNT_ID;
  const ACCESS_KEY_ID = import.meta.env.VITE_CLOUDFLARE_ACCESS_KEY_ID;
  const SECRET_ACCESS_KEY = import.meta.env.VITE_CLOUDFLARE_SECRET_ACCESS_KEY;
  const BUCKET_NAME = import.meta.env.VITE_CLOUDFLARE_BUCKET_NAME;

  console.log("Checking R2 Config:", {
    hasAccountId: !!ACCOUNT_ID,
    hasAccessKey: !!ACCESS_KEY_ID,
    hasSecretKey: !!SECRET_ACCESS_KEY,
    hasBucket: !!BUCKET_NAME
  });

  if (!ACCOUNT_ID || !ACCESS_KEY_ID || !SECRET_ACCESS_KEY || !BUCKET_NAME) {
    console.error("Cloudflare R2 environment variables are missing. Current keys found:", 
      Object.keys(import.meta.env).filter(key => key.includes('CLOUDFLARE'))
    );
    return null;
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: ACCESS_KEY_ID,
      secretAccessKey: SECRET_ACCESS_KEY,
    },
  });
};

const getPublicUrl = (path: string): string => {
  const PUBLIC_URL = import.meta.env.VITE_CLOUDFLARE_PUBLIC_URL || 'https://pub-44d4456b745dd8beda2339160d9329fc.r2.dev';
  return `${PUBLIC_URL}/${path}`;
};

export const uploadToR2 = async (file: File | Blob | string, path: string): Promise<string> => {
  const s3Client = getS3Client();
  if (!s3Client) {
    console.warn('R2 not configured, keeping original data');
    return typeof file === 'string' ? file : '';
  }

  const BUCKET_NAME = import.meta.env.VITE_CLOUDFLARE_BUCKET_NAME;
  let body: Buffer | Uint8Array | Blob | string;
  let contentType: string | undefined;

  try {
    if (typeof file === 'string' && file.startsWith('data:')) {
      const response = await fetch(file);
      body = await response.blob();
      contentType = file.split(';')[0].split(':')[1];
    } else {
      body = file;
      if (file instanceof File || file instanceof Blob) {
        contentType = file.type;
      }
    }

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: path,
      Body: body,
      ContentType: contentType,
    });

    // Add timeout to prevent hanging
    const uploadPromise = s3Client.send(command);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Upload timeout after 30 seconds')), 30000)
    );

    await Promise.race([uploadPromise, timeoutPromise]);
    
    const publicUrl = getPublicUrl(path);
    console.log(`✅ Uploaded to R2: ${path} → ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error('R2 Upload failed:', error);
    // Return original data as fallback instead of failing
    if (typeof file === 'string') {
      console.warn('⚠️ Using base64 fallback for:', path);
      return file;
    }
    return '';
  }
};

export const saveBookingToR2 = async (data: any): Promise<void> => {
  const s3Client = getS3Client();
  if (!s3Client) {
    console.warn('R2 not configured, skipping booking backup');
    return;
  }

  const BUCKET_NAME = import.meta.env.VITE_CLOUDFLARE_BUCKET_NAME;
  const path = `bookings/${data.id || Date.now()}.json`;
  
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: path,
      Body: JSON.stringify(data, null, 2),
      ContentType: "application/json",
    });

    await s3Client.send(command);
    console.log(`✅ Booking saved to R2: ${path}`);
  } catch (error) {
    console.error('Failed to save booking to R2:', error);
  }
};
