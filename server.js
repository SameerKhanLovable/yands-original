const express = require("express");
const multer = require("multer");
const B2 = require("backblaze-b2");
const cors = require("cors");

const app = express();
app.use(cors());

const upload = multer({ storage: multer.memoryStorage() });

const b2 = new B2({
  applicationKeyId: process.env.B2_KEY_ID,
  applicationKey: process.env.B2_APP_KEY,
});

let uploadUrlData;

// Authorize B2
async function authorize() {
  await b2.authorize();
  uploadUrlData = await b2.getUploadUrl({
    bucketId: process.env.B2_BUCKET_ID,
  });
}

authorize();

app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;

    const response = await b2.uploadFile({
      uploadUrl: uploadUrlData.data.uploadUrl,
      uploadAuthToken: uploadUrlData.data.authorizationToken,
      fileName: file.originalname,
      data: file.buffer,
    });

    const fileUrl =
      b2.downloadUrl +
      `/file/${response.data.bucketId}/${response.data.fileName}`;

    res.json({ url: fileUrl });
  } catch (err) {
    console.error(err);
    res.status(500).send("Upload failed");
  }
});

app.listen(3001, () => {
  console.log("Server running on port 3001");
});
console.log("KEY:", process.env.B2_KEY_ID);
console.log("APP:", process.env.B2_APP_KEY);
