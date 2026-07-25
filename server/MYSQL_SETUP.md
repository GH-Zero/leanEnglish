# MySQL 数据库配置指南

## 1. 安装 MySQL

如果还没有安装 MySQL，请先安装：
- Windows: 下载 MySQL Installer: https://dev.mysql.com/downloads/installer/
- Mac: `brew install mysql`
- Linux: `sudo apt install mysql-server`

## 2. 启动 MySQL 服务

```bash
# Windows
net start mysql

# Mac
brew services start mysql

# Linux
sudo systemctl start mysql
```

## 3. 登录 MySQL

```bash
mysql -u root -p
```

## 4. 创建用户和密码

```sql
-- 设置root密码
ALTER USER 'root'@'localhost' IDENTIFIED BY '123456';

-- 或者创建新用户
CREATE USER 'appuser'@'localhost' IDENTIFIED BY '123456';
GRANT ALL PRIVILEGES ON *.* TO 'appuser'@'localhost';
FLUSH PRIVILEGES;
```

## 5. 修改数据库配置

编辑 `server/database.js` 文件，修改以下配置：

```javascript
const dbConfig = {
    host: 'localhost',
    user: 'root',           // 你的MySQL用户名
    password: '123456',     // 你的MySQL密码
    database: 'english_learning',
    charset: 'utf8mb4',
    timezone: '+08:00'
};
```

## 6. 测试连接

```bash
cd server
node init-database.js
```

## 7. 常见问题

### 问题1: Access denied for user 'root'@'localhost'
**解决方案**: 检查用户名和密码是否正确

### 问题2: Unknown database 'english_learning'
**解决方案**: 数据库会自动创建，如果失败请手动创建：
```sql
CREATE DATABASE english_learning CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 问题3: MySQL服务未启动
**解决方案**: 启动MySQL服务（见第2步）

### 问题4: 端口被占用
**解决方案**: 检查3306端口是否被占用：
```bash
netstat -ano | findstr :3306
```
