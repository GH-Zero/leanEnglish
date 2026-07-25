const { pool, initDatabase } = require('./database');

async function main() {
	console.log('🚀 开始初始化数据库...');

	try {
		// 测试连接
		const connection = await pool.getConnection();
		console.log('✅ MySQL连接成功');
		connection.release();

		// 初始化数据库表
		await initDatabase();

		console.log('✅ 数据库初始化完成！');
		console.log('');
		console.log('📊 数据库表结构：');
		console.log('  - users (用户表)');
		console.log('  - learning_stats (学习统计表)');
		console.log('  - streak_data (连续学习记录表)');
		console.log('  - daily_records (每日学习记录表)');
		console.log('  - word_status (单词学习状态表)');
		console.log('  - grammar_progress (语法学习进度表)');
		console.log('  - phonetic_progress (音标学习进度表)');
		console.log('  - dialogue_history (对话历史表)');
		console.log('  - learning_settings (学习设置表)');
	} catch (error) {
		console.error('❌ 数据库初始化失败:', error.message);
		console.error('');
		console.error('请确保：');
		console.error('1. MySQL服务已启动');
		console.error('2. 数据库连接配置正确（database.js文件）');
		console.error('3. MySQL用户有创建数据库的权限');
	} finally {
		await pool.end();
	}
}

main();
