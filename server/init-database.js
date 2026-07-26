const { initDatabase, closeDatabase } = require('./database');

async function main() {
  try {
    console.log('开始初始化 MySQL 数据库...');
    await initDatabase();
    console.log('MySQL 数据库初始化完成');
  } catch (error) {
    console.error('MySQL 数据库初始化失败:', error.message);
    process.exitCode = 1;
  } finally {
    await closeDatabase();
  }
}

main();