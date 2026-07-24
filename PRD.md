# 零基础英语学习小程序 产品需求文档 (PRD)

## 一、产品概述

### 1.1 产品名称
EnglishMaster（暂定）

### 1.2 产品定位
面向国内零基础成人，打造从音标发音矫正→单词积累→系统语法→短句情景对话→自由和AI外国人闲聊的沉浸式自学口语闭环。

### 1.3 目标用户
- 英语零基础或基础薄弱的成人学习者
- 希望提高口语发音和流利度的职场人士
- 需要系统学习语法、应对日常沟通的学习者

### 1.4 核心价值
1. **AI纠音**：音素级发音评估，纠正中式发音
2. **科学记忆**：艾宾浩斯记忆曲线，高效背单词
3. **场景化语法**：融入日常对话，学完就能用
4. **AI对话陪练**：模拟真实场景，锻炼口语反应

## 二、技术平台选型

### 2.1 最终选型
**微信小程序（核心主产品）**
- 前端框架：UniApp/Taro（Vue语法，可跨平台编译）
- 后端服务：Node.js/Java + 云服务器
- 语音评测：微软Azure发音评测 / 讯飞语音口语评测SDK
- 数据存储：MySQL + Redis + 对象存储（OSS）
- 推送服务：微信小程序订阅消息

### 2.2 后续扩展
用户体量做大后，基于同一代码打包生成React Native/Flutter原生App。

## 三、功能需求详细说明

### 3.1 发音跟读&AI纠音模块

#### 3.1.1 音标发音通关课
- **功能描述**：48个英美音标逐个教学，包含口型示意图、真人慢速发音音频。
- **交互流程**：
  1. 用户选择音标课程（元音/辅音/组合音）
  2. 展示音标卡片：音标符号、发音要领文字说明、口型示意图
  3. 播放标准发音（可重复）
  4. 用户点击“跟读”按钮，录制发音
  5. 系统调用语音评测API，返回评分（准确度、流利度、完整度）
  6. 高亮错误音节，提供改进建议（如“舌尖应抵上齿龈”）
  7. 用户可重新跟读或进入下一个音标
- **数据需求**：
  - 音标课程表：id, symbol, type (元音/辅音), mouth_image_url, audio_url, tips, level
  - 用户音标学习记录：user_id, phonetic_id, best_score, attempts, mastered

#### 3.1.2 单词逐词跟读
- **功能描述**：每个单词标准发音，用户朗读后波形对比，错音标注。
- **交互流程**：
  1. 用户在单词学习页面点击“跟读”按钮
  2. 播放单词标准发音
  3. 用户录制发音
  4. 系统返回评分，并展示波形对比（可选）
  5. 高亮发音不准确的音节
- **数据需求**：
  - 单词表增加字段：audio_url英, audio_url美

#### 3.1.3 短句/段落影子跟读
- **功能描述**：支持句子、段落级别的跟读，逐句复读。
- **交互流程**：
  1. 展示待跟读文本，可逐句高亮
  2. 播放当前句子标准发音
  3. 用户跟读，系统录音
  4. 评测并反馈整句得分
  5. 可重听、重读或进入下一句
- **数据需求**：
  - 跟读素材表：id, text, audio_url, level, tags, sentence_segments (JSON)

#### 3.1.4 AI情景对话陪练
- **功能描述**：AI扮演外国人，用户进行情景对话，系统实时纠音、纠错。
- **交互流程**：
  1. 用户选择对话场景（如“餐厅点餐”、“问路”）
  2. AI发起对话（文字+语音）
  3. 用户语音回复
  4. 系统识别语音→文本，进行：
     - 发音评分
     - 语法错误检查
     - 地道表达建议
  5. AI根据用户回复继续对话
  6. 对话结束后生成报告：发音分数、语法错误、地道表达学习点
- **数据需求**：
  - 对话场景表：id, title, description, ai_persona, initial_prompt
  - 对话记录表：user_id, scene_id, messages (JSON), score, created_at

### 3.2 单词记忆模块

#### 3.2.1 分级词库
- **词库分级**：
  - 零基础入门词（500词）
  - 日常交流核心词（1500词）
  - 3000高频口语词
- **用户可选计划**：每日10/20/30词
- **数据需求**：
  - 单词表：id, word, phonetic, chinese_meaning, english_meaning, audio_url英, audio_url美, image_url, level, tags
  - 词库表：id, name, description, word_ids (关联单词表)

#### 3.2.2 记忆闭环
- **学习模式**：
  1. **听音辨义**：播放单词发音，用户选择中文释义
  2. **看英文想中文**：显示英文单词，用户回忆中文释义
  3. **拼写默写**：显示中文释义，用户拼写英文单词
  4. **单词跟读**：跟读发音，AI评分
- **SRS算法**：实现SM-2算法，根据用户记忆程度动态调整复习间隔
- **数据需求**：
  - 用户单词状态表：user_id, word_id, ease_factor, interval, repetition, next_review_date, last_review_date, mastery_level

#### 3.2.3 辅助工具
- **错题生词本**：自动收集用户标记“不认识”或测试错误的单词
- **薄弱词汇强化**：针对错误率高的单词加强复习
- **单词打卡日历**：可视化学习连续性
- **好友背单词PK**：邀请微信好友一起背单词，排名激励

### 3.3 系统语法学习模块

#### 3.3.1 语法课程体系
- **阶段划分**：
  - 阶段1：基础句型（主谓宾、主系表、疑问句、时态入门）
  - 阶段2：8大核心时态、冠词、介词、代词用法
  - 阶段3：从句、非谓语动词等进阶口语必备语法
- **学习形式**：
  1. 短句例句 + 图文讲解
  2. 填空练习
  3. 造句练习
  4. AI批改句子语法正误
- **数据需求**：
  - 语法课程表：id, title, stage, description, order_index
  - 语法点表：id, course_id, title, explanation, examples (JSON), practice_questions (JSON), tips
  - 用户语法进度表：user_id, grammar_point_id, status, last_practice_date

#### 3.3.2 实时语法纠错
- **功能描述**：在用户写作或口语练习中，调用语法检查API纠正错误。
- **技术实现**：集成LanguageTool API或自建语法检查服务
- **数据需求**：
  - 用户语法错误记录表：user_id, text, errors (JSON), corrected_text, created_at

## 四、页面清单与交互流程

### 4.1 首页（TabBar）
- 今日学习任务卡片（跟读、单词、语法）
- 学习数据概览（连续学习天数、已学单词数）
- 快捷入口：开始学习、复习、AI对话

### 4.2 学习中心（TabBar）
- 课程列表：音标课程、单词词库、语法课程
- 学习进度可视化
- 搜索功能

### 4.3 口语练习（TabBar）
- 影子跟读入口
- AI情景对话列表
- 跟读历史记录

### 4.4 我的（TabBar）
- 个人信息
- 学习统计报告
- 错题本、生词本
- 设置（发音偏好、每日提醒等）
- 会员中心

### 4.5 详情页
- 音标学习详情页
- 单词学习详情页
- 语法课程详情页
- 对话详情页

## 五、数据结构设计

### 5.1 用户相关
- user: user_id, openid, nickname, avatar, level, created_at, last_login_at
- user_study_log: user_id, total_study_time, words_learned, grammar_points_mastered, streak_days

### 5.2 内容相关
- phonetic_course: id, symbol, type, mouth_image_url, audio_url, tips, level
- word: id, word, phonetic, chinese_meaning, english_meaning, audio_url英, audio_url美, image_url, level, tags
- grammar_point: id, title, stage, explanation, examples, practice_questions, tips
- dialogue_scene: id, title, description, ai_persona, initial_prompt

### 5.3 用户行为相关
- user_phonetic_record: user_id, phonetic_id, best_score, attempts, mastered
- user_word_status: user_id, word_id, ease_factor, interval, repetition, next_review_date, last_review_date, mastery_level
- user_grammar_progress: user_id, grammar_point_id, status, last_practice_date
- user_dialogue_record: user_id, scene_id, messages, score, created_at

## 六、技术实现要点

### 6.1 语音评测集成
- **方案A（推荐）**：微软Azure发音评测SDK
  - 优势：音素级评估，支持中英文，识别精度高
  - 接入方式：小程序端录音，上传音频到后端，后端调用Azure API
- **方案B**：讯飞语音口语评测SDK
  - 优势：中文识别优秀，有免费额度
- **备选**：微信同声传译插件（精度一般，适合简单场景）

### 6.2 AI对话实现
- 使用GPT-3.5/4 API或国产大模型API
- 设计角色Prompt，模拟外国人对话风格
- 结合语音识别（ASR）和语音合成（TTS）

### 6.3 性能优化
- 音频资源CDN加速
- 单词库本地缓存（离线学习）
- 图片懒加载

## 七、开发计划

### 第一阶段：MVP上线（1.5个月）
- 基础框架搭建（UniApp + 后端服务）
- 音标跟读基础功能
- 基础单词背诵（500词）
- 入门语法课程（阶段1）
- 基础AI短句对话
- 打卡分享功能

### 第二阶段：功能完善（上线后2个月）
- 完整分级词库（1500词、3000词）
- 全套语法体系（阶段2、3）
- 多场景AI自由对话
- 错题本、生词本
- 会员付费体系

### 第三阶段：生态扩展（用户破万后）
- 基于UniApp打包Flutter/React Native双端App
- 打通小程序与App数据
- 社区功能（学习圈、问答）

## 八、测试要点

### 8.1 功能测试
- 各机型录音兼容性测试（重点安卓）
- 语音评测准确性验证
- SRS算法记忆曲线验证
- AI对话流畅性测试

### 8.2 性能测试
- 音频上传响应时间
- 页面加载速度
- 离线缓存有效性

### 8.3 用户体验测试
- 新手引导流程
- 学习路径清晰度
- 反馈及时性

## 九、风险与对策

### 9.1 语音识别精度
- 风险：不同口音、环境噪音影响识别
- 对策：提供标准发音参考，允许重录；后期引入降噪算法

### 9.2 内容版权
- 风险：单词库、例句版权问题
- 对策：使用开源词典（ECdict），自编例句

### 9.3 用户留存
- 风险：学习类应用容易流失
- 对策：游戏化设计（积分、勋章）、社交激励（组队PK）、定期推送提醒

## 十、附录

### 10.1 术语表
- SRS：间隔重复系统（Spaced Repetition System）
- TTS：语音合成（Text-to-Speech）
- ASR：语音识别（Automatic Speech Recognition）

### 10.2 参考资料
- 微信小程序开发文档
- 微软Azure发音评测文档
- 讯飞语音开放平台文档

---
*文档版本：v1.0*
*创建日期：2026年7月24日*