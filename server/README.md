# 英语学习小程序后端服务

## 启动方式

```bash
# 安装依赖
npm install

# 启动服务器
npm start

# 开发模式（自动重启）
npm run dev
```

服务器默认运行在 `http://localhost:3000`

## API 接口文档

### 用户相关

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/user/profile | 获取用户信息 |
| PUT | /api/user/profile | 更新用户信息 |
| GET | /api/user/stats | 获取学习统计 |
| PUT | /api/user/stats | 更新学习统计 |
| POST | /api/user/stats/word | 增加单词学习统计 |
| POST | /api/user/stats/grammar | 增加语法学习统计 |
| POST | /api/user/stats/phonetic | 增加音标学习统计 |
| POST | /api/user/stats/speak | 增加口语练习统计 |
| POST | /api/user/stats/study-time | 更新学习时长 |
| GET | /api/user/streak | 获取连续学习数据 |

### 单词相关

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/word/status | 获取单词状态 |
| POST | /api/word/status/known | 标记单词为认识 |
| POST | /api/word/status/unknown | 标记单词为不认识 |

### 语法相关

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/grammar/progress | 获取语法进度 |
| POST | /api/grammar/progress | 更新语法进度 |

### 音标相关

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/phonetic/progress | 获取音标进度 |
| POST | /api/phonetic/progress | 更新音标进度 |

### 对话相关

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/dialogue/history | 获取对话历史 |
| POST | /api/dialogue/history | 保存对话记录 |
| DELETE | /api/dialogue/history | 清空对话历史 |

### 统计相关

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/statistics | 获取学习统计数据 |

### 成就相关

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/achievement | 获取成就数据 |

### 设置相关

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/settings | 获取学习设置 |
| PUT | /api/settings | 更新学习设置 |

## 数据存储

使用 lowdb 将数据存储在 `db.json` 文件中。

## 默认用户

系统会自动创建一个测试用户（ID: 1, openid: test_user_001）。
