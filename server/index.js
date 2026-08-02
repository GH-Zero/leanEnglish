require('./load-env');
const express = require('express');
const https = require('https'); // HTTPS 模块
const fs = require('fs'); // 文件系统模块，用于读取SSL证书
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const { initDatabase } = require('./database');
const { authMiddleware } = require('./auth');

// 导入路由
const userRoutes = require('./routes/user');
const wordRoutes = require('./routes/word');
const grammarRoutes = require('./routes/grammar');
const phoneticRoutes = require('./routes/phonetic');
const dialogueRoutes = require('./routes/dialogue');
const statisticsRoutes = require('./routes/statistics');
const achievementRoutes = require('./routes/achievement');
const settingsRoutes = require('./routes/settings');
const speechRoutes = require('./routes/speech');
const wordsDictRoutes = require('./routes/words-dict');
const sceneRoutes = require('./routes/scene');
const shadowRoutes = require('./routes/shadow');
const grammarQuestionRoutes = require('./routes/grammar-question');
const grammarPointRoutes = require('./routes/grammar-point');
const adventureRoutes = require('./routes/adventure');
const adventureCourseRoutes = require('./routes/adventure-course');

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(bodyParser.json({ limit: '5mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '5mb' }));
app.use('/uploads', express.static(require('path').join(__dirname, 'uploads')));
app.use(authMiddleware);

// 请求日志
app.use((req, res, next) => {
	console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
	next();
});

// 注册路由
app.use('/api/user', userRoutes);
app.use('/api/word', wordRoutes);
app.use('/api/grammar', grammarRoutes);
app.use('/api/phonetic', phoneticRoutes);
app.use('/api/dialogue', dialogueRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/achievement', achievementRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/words', wordsDictRoutes);
app.use('/api/speech', speechRoutes);
app.use('/api/scene', sceneRoutes);
app.use('/api/shadow', shadowRoutes);
app.use('/api/grammar-question', grammarQuestionRoutes);
app.use('/api/grammar-point', grammarPointRoutes);
app.use('/api/adventure', adventureRoutes);
app.use('/api/adventure-course', adventureCourseRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
	res.json({ status: 'ok', timestamp: new Date().toISOString(), database: 'MySQL' });
});

// 404处理
app.use((req, res) => {
	res.status(404).json({ code: 404, message: '接口不存在' });
});

// 错误处理
app.use((err, req, res, next) => {
	console.error('服务器错误:', err);
	res.status(500).json({ code: 500, message: '服务器内部错误' });
});

// 启动服务器
async function startServer() {
	try {
		// 初始化数据库
		await initDatabase();

		// 读取 SSL 证书和密钥
		const options = {
			key: fs.readFileSync(path.join(__dirname, './ssl/key.key')),
			cert: fs.readFileSync(path.join(__dirname, './ssl/cert.pem'))
		};

		// 使用 HTTPS 启动服务器
		const server = https.createServer(options, app);

		// 启动Express服务器
		server.listen(PORT, () => {
			console.log(`✅ 服务器已启动，监听端口: ${PORT}`);
			console.log(`📡 API地址: https://localhost:${PORT}/api`);
			console.log(`💾 数据库: MySQL`);
		});
	} catch (error) {
		console.error('❌ 服务器启动失败:', error.message);
		process.exit(1);
	}
}

startServer();

module.exports = app;
