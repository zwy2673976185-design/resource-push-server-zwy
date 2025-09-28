const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
// 新增WebSocket依赖
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
// 初始化WebSocket，允许跨域
const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(cors());
const uploadDir = '/tmp/public';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// 文件存储配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    // 用固定文件名（覆盖旧文件），确保每次加载的是最新文件
    cb(null, 'latest-file.html'); 
  }
});
const upload = multer({ storage });
app.use('/files', express.static(uploadDir));

// 存储最新文件URL
let latestFileUrl = '';

// 1. 上传接口：接收文件并广播更新
app.post('/upload', upload.single('file'), (req, res) => {
  latestFileUrl = `${req.protocol}://${req.get('host')}/files/latest-file.html`;
  // 广播给所有连接的接收端：有新文件了
  io.emit('file-updated', latestFileUrl);
  res.json({ success: true, message: '文件已上传，接收端将自动更新' });
});

// 2. WebSocket连接管理
io.on('connection', (socket) => {
  console.log('接收端已连接');
  // 新接收端连接时，立即发送当前最新文件URL
  if (latestFileUrl) socket.emit('file-updated', latestFileUrl);
  socket.on('disconnect', () => console.log('接收端断开连接'));
});
// 新增：返回最新文件的URL
app.get('/getLatest', (req, res) => {
  // 假设最新文件存储为“latest-file.html”，需根据实际存储逻辑调整
  const latestFileUrl = `${req.protocol}://${req.get('host')}/files/latest-file.html`;
  res.json({ latestFileUrl });
});
// 启动服务
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`服务运行在 ${PORT}`));
