const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(cors());
const uploadDir = '/tmp/public';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, 'latest-file.html'), 
});
const upload = multer({ storage });
app.use('/files', express.static(uploadDir));

let latestFileUrl = '';

// 上传接口：接收文件并广播更新
app.post('/upload', upload.single('file'), (req, res) => {
  // 强制使用HTTPS协议生成URL
  latestFileUrl = `https://${req.get('host')}/files/latest-file.html`;
  io.emit('file-updated', latestFileUrl);
  res.json({ success: true, message: '文件已上传，接收端将自动更新' });
});

// WebSocket连接管理
io.on('connection', (socket) => {
  console.log('接收端已连接');
  if (latestFileUrl) socket.emit('file-updated', latestFileUrl);
  socket.on('disconnect', () => console.log('接收端断开连接'));
});

// 返回最新文件的URL（强制HTTPS）
app.get('/getLatest', (req, res) => {
  const latestFileUrl = `https://${req.get('host')}/files/latest-file.html`;
  res.json({ latestFileUrl });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`服务运行在 ${PORT}`));
