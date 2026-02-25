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

export const uploadToB2 = async (file: File | Blob, fileName: string): Promise<string> => {
  console.log(`📤 B2: Uploading ${fileName} to bucket ${B2_BUCKET_NAME}...`);
  
  if (!B2_BUCKET_NAME || !B2_ACCESS_KEY_ID || !B2_SECRET_ACCESS_KEY) {
    throw new Error("Backblaze B2 configuration is missing.");
  }

  try {
    const command = new PutObjectCommand({
      Bucket: B2_BUCKET_NAME,
      Key: fileName,
      Body: file,
      ContentType: file instanceof File ? file.type : "image/jpeg",
      // Adding ACL if supported, though B2 handles this via bucket settings
    });

    await s3Client.send(command);
    return getDownloadUrl(fileName);
  } catch (error: any) {
    console.error(`❌ B2 Error for ${fileName}:`, error);
    // If the error is empty {}, it's 99% a CORS issue
    if (typeof error === 'object' && Object.keys(error).length === 0) {
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
