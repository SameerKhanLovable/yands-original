import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Backblaze B2 is S3-compatible. 
// We use the AWS SDK to interact with it.

const B2_ENDPOINT = import.meta.env.VITE_B2_ENDPOINT || "s3.us-east-005.backblazeb2.com";
const B2_REGION = import.meta.env.VITE_B2_REGION || "us-east-005";
const B2_ACCESS_KEY_ID = import.meta.env.VITE_B2_APPLICATION_KEY_ID || "";
const B2_SECRET_ACCESS_KEY = import.meta.env.VITE_B2_APPLICATION_KEY || "";
const B2_BUCKET_NAME = import.meta.env.VITE_B2_BUCKET_NAME || "";

// Improved download URL construction
const getDownloadUrl = (fileName: string) => {
  if (import.meta.env.VITE_B2_DOWNLOAD_URL) {
    return `${import.meta.env.VITE_B2_DOWNLOAD_URL}/${fileName}`;
  }
  // Default B2 download URL pattern
  return `https://${B2_BUCKET_NAME}.${B2_ENDPOINT}/${fileName}`;
};

const s3Client = new S3Client({
  endpoint: `https://${B2_ENDPOINT}`,
  region: B2_REGION,
  credentials: {
    accessKeyId: B2_ACCESS_KEY_ID,
    secretAccessKey: B2_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
  apiVersion: 'latest',
});

// Helper to convert data URL to Blob
const dataURLtoBlob = (dataurl: string) => {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};

export const uploadToB2 = async (fileOrDataUrl: File | Blob | string, fileName: string): Promise<string> => {
  console.log(`📤 B2: Uploading ${fileName}...`);
  
  if (!B2_BUCKET_NAME || !B2_ACCESS_KEY_ID || !B2_SECRET_ACCESS_KEY) {
    throw new Error("Backblaze B2 configuration is missing.");
  }

  let body: Blob | File;
  let contentType: string;

  if (typeof fileOrDataUrl === 'string' && fileOrDataUrl.startsWith('data:')) {
    body = dataURLtoBlob(fileOrDataUrl);
    contentType = body.type;
  } else if (fileOrDataUrl instanceof File || fileOrDataUrl instanceof Blob) {
    body = fileOrDataUrl;
    contentType = fileOrDataUrl instanceof File ? fileOrDataUrl.type : "image/jpeg";
  } else {
    throw new Error("Invalid file format for upload");
  }

  try {
    const command = new PutObjectCommand({
      Bucket: B2_BUCKET_NAME,
      Key: fileName,
      Body: body,
      ContentType: contentType,
    });

    await s3Client.send(command);
    return getDownloadUrl(fileName);
  } catch (error: any) {
    console.error(`❌ B2 Error for ${fileName}:`, error);
    if (error.name === 'TypeError' || (typeof error === 'object' && Object.keys(error).length === 0)) {
      throw new Error("CORS_ERROR");
    }
    throw error;
  }
};

export const getB2UploadUrl = async (fileName: string): Promise<string> => {
  const command = new PutObjectCommand({
    Bucket: B2_BUCKET_NAME,
    Key: fileName,
  });

  return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
};
