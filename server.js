const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors()); // 解决跨域

// Render免费版临时存储路径（无需修改）
const uploadDir = '/tmp/public';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });
app.use('/files', express.static(uploadDir));

// 存储最新文件信息
let latestFile = { filename: '', downloadUrl: '', lastUpdate: '' };

// 上传接口（给发送端用）
app.post('/upload', upload.single('file'), (req, res) => {
  const file = req.file;
  const downloadUrl = `${req.protocol}://${req.get('host')}/files/${file.filename}`;
  latestFile = {
    filename: file.originalname,
    downloadUrl,
    lastUpdate: new Date().toISOString()
  };
  res.json(latestFile);
});

// 查询接口（给接收端用）
app.get('/getLatest', (req, res) => res.json(latestFile));

// 启动服务
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`服务运行在 ${PORT}`));
