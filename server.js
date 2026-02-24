const express = require("express");
const multer = require("multer");
const cors = require("cors");
const AWS = require("aws-sdk");
const fs = require("fs");

const app = express();
app.use(cors());

// Multer setup (temporary uploads folder)
const upload = multer({ dest: "uploads/" });

// S3 Compatible Backblaze B2 Setup
const s3 = new AWS.S3({
  endpoint: "https://s3.us-east-005.backblazeb2.com", // tumhara endpoint
  accessKeyId: process.env.B2_KEY_ID,
  secretAccessKey: process.env.B2_APPLICATION_KEY,
  signatureVersion: "v4",
});

// Upload function
async function uploadToB2(filePath, fileName) {
  const fileContent = fs.readFileSync(filePath);

  const params = {
    Bucket: process.env.B2_BUCKET_NAME,
    Key: Date.now() + "-" + fileName, // unique file name
    Body: fileContent,
  };

  const data = await s3.upload(params).promise();

  // Delete local file after upload
  fs.unlinkSync(filePath);

  return data.Key; // sirf key return karenge
}

// Generate signed URL for private bucket
function getSignedUrl(key) {
  const params = {
    Bucket: process.env.B2_BUCKET_NAME,
    Key: key,
    Expires: 60 * 60, // 1 hour
  };

  return s3.getSignedUrl("getObject", params);
}

// Upload route
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const fileKey = await uploadToB2(req.file.path, req.file.originalname);
    const signedUrl = getSignedUrl(fileKey);

    res.json({ success: true, url: signedUrl });
  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ success: false, error: "Upload failed" });
  }
});

app.listen(3001, () => console.log("B2 S3 server running on port 3001"));