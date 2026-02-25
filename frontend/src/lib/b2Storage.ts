import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Backblaze B2 is S3-compatible. 
// We use the AWS SDK to interact with it.

const B2_ENDPOINT = import.meta.env.VITE_B2_ENDPOINT || "s3.us-west-004.backblazeb2.com";
const B2_REGION = import.meta.env.VITE_B2_REGION || "us-west-004";
const B2_ACCESS_KEY_ID = import.meta.env.VITE_B2_APPLICATION_KEY_ID || "";
const B2_SECRET_ACCESS_KEY = import.meta.env.VITE_B2_APPLICATION_KEY || "";
const B2_BUCKET_NAME = import.meta.env.VITE_B2_BUCKET_NAME || "";

// Improved download URL construction
const getDownloadUrl = (fileName: string) => {
  if (import.meta.env.VITE_B2_DOWNLOAD_URL) {
    return `${import.meta.env.VITE_B2_DOWNLOAD_URL}/${fileName}`;
  }
  // Default B2 download URL pattern: https://<bucket>.s3.<region>.backblazeb2.com/<filename>
  return `https://${B2_BUCKET_NAME}.${B2_ENDPOINT}/${fileName}`;
};

const s3Client = new S3Client({
  endpoint: `https://${B2_ENDPOINT}`,
  region: B2_REGION,
  credentials: {
    accessKeyId: B2_ACCESS_KEY_ID,
    secretAccessKey: B2_SECRET_ACCESS_KEY,
  },
  // Necessary for B2 S3 compatibility
  forcePathStyle: true,
});

export const uploadToB2 = async (file: File | Blob, fileName: string): Promise<string> => {
  console.log(`📤 B2: Starting upload for ${fileName}...`);
  if (!B2_BUCKET_NAME || !B2_ACCESS_KEY_ID || !B2_SECRET_ACCESS_KEY) {
    console.error("❌ B2: Configuration missing!", { B2_BUCKET_NAME, B2_ACCESS_KEY_ID, hasSecret: !!B2_SECRET_ACCESS_KEY });
    throw new Error("Backblaze B2 configuration is missing. Please check your environment variables.");
  }

  try {
    const command = new PutObjectCommand({
      Bucket: B2_BUCKET_NAME,
      Key: fileName,
      Body: file,
      ContentType: file instanceof File ? file.type : "image/jpeg",
    });

    await s3Client.send(command);
    console.log(`✅ B2: Upload successful for ${fileName}`);
    
    return getDownloadUrl(fileName);
  } catch (error) {
    console.error(`❌ B2: Upload failed for ${fileName}:`, error);
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
