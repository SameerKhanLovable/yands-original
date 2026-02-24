import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Backblaze B2 is S3-compatible. 
// We use the AWS SDK to interact with it.

const B2_ENDPOINT = import.meta.env.VITE_B2_ENDPOINT || ""; // e.g., s3.us-west-004.backblazeb2.com
const B2_REGION = import.meta.env.VITE_B2_REGION || "us-west-004";
const B2_ACCESS_KEY_ID = import.meta.env.VITE_B2_APPLICATION_KEY_ID || "";
const B2_SECRET_ACCESS_KEY = import.meta.env.VITE_B2_APPLICATION_KEY || "";
const B2_BUCKET_NAME = import.meta.env.VITE_B2_BUCKET_NAME || "";

const s3Client = new S3Client({
  endpoint: `https://${B2_ENDPOINT}`,
  region: B2_REGION,
  credentials: {
    accessKeyId: B2_ACCESS_KEY_ID,
    secretAccessKey: B2_SECRET_ACCESS_KEY,
  },
});

export const uploadToB2 = async (file: File | Blob, fileName: string): Promise<string> => {
  if (!B2_BUCKET_NAME || !B2_ENDPOINT) {
    throw new Error("Backblaze B2 configuration is missing. Please check your environment variables.");
  }

  const command = new PutObjectCommand({
    Bucket: B2_BUCKET_NAME,
    Key: fileName,
    Body: file,
    ContentType: file instanceof File ? file.type : "image/jpeg",
  });

  await s3Client.send(command);
  
  // Construct the public URL or return the key
  // If the bucket is public, the URL format is: https://f000.backblazeb2.com/file/bucket-name/file-name
  // Note: f000 is a placeholder for the actual download URL provided by B2
  const downloadUrl = import.meta.env.VITE_B2_DOWNLOAD_URL || `https://${B2_BUCKET_NAME}.${B2_ENDPOINT}/${fileName}`;
  return downloadUrl;
};

export const getB2UploadUrl = async (fileName: string): Promise<string> => {
  const command = new PutObjectCommand({
    Bucket: B2_BUCKET_NAME,
    Key: fileName,
  });

  return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
};
