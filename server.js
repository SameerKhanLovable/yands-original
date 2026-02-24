const express = require("express");
const multer = require("multer");
const cors = require("cors");
const B2 = require("backblaze-b2");
const fs = require("fs");

const app = express();
app.use(cors());

const upload = multer({ dest: "uploads/" });

const b2 = new B2({
  applicationKeyId: process.env.B2_KEY_ID,
  applicationKey: process.env.B2_APP_KEY,
});

async function uploadToB2(filePath, fileName) {
  await b2.authorize();

  const uploadUrl = await b2.getUploadUrl({
    bucketId: process.env.B2_BUCKET_ID,
  });

  const fileData = fs.readFileSync(filePath);

  await b2.uploadFile({
    uploadUrl: uploadUrl.data.uploadUrl,
    uploadAuthToken: uploadUrl.data.authorizationToken,
    fileName: fileName,
    data: fileData,
  });

  return `https://f000.backblazeb2.com/file/${process.env.B2_BUCKET_NAME}/${fileName}`;
}

app.post("/upload", upload.single("file"), async (req, res) => {
  const url = await uploadToB2(req.file.path, req.file.originalname);
  res.json({ url });
});

app.listen(3001, () => console.log("B2 server running"));