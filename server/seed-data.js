const { db } = require('./db');
const { initDatabase, closeDatabase } = require('./database');

async function seedData() {
	await initDatabase();

	// ========== 对话场景 ==========
	const scenes = [
		{ icon: '🍽️', name: '餐厅点餐', description: '在餐厅点餐的真实对话', initial_prompt: 'Hello! Welcome to our restaurant. Are you ready to order?' },
		{ icon: '🗺️', name: '问路指路', description: '问路和指路的真实对话', initial_prompt: 'Excuse me, can you help me find the nearest subway station?' },
		{ icon: '🛒', name: '购物消费', description: '购物和讨价还价的真实对话', initial_prompt: 'Hi! Welcome to our store. What are you looking for today?' },
		{ icon: '💼', name: '职场寒暄', description: '职场交流的真实对话', initial_prompt: 'Good morning! How was your weekend?' }
	];

	const insertScene = db.prepare('INSERT IGNORE INTO dialogue_scenes (icon, name, description, initial_prompt, sort_order) VALUES (?, ?, ?, ?, ?)');
	for (let i = 0; i < scenes.length; i++) {
		const s = scenes[i];
		await insertScene.run(s.icon, s.name, s.description, s.initial_prompt, i + 1);
	}
	console.log(`✅ 导入 ${scenes.length} 个对话场景`);

	// ========== 影子跟读句子 ==========
	const sentences = [
		{ text: 'Hello, how are you today?', chinese: '你好，你今天怎么样？', level: 0, tag: '问候' },
		{ text: 'I would like a cup of coffee, please.', chinese: '请给我一杯咖啡。', level: 0, tag: '餐厅' },
		{ text: 'Can you help me find the subway station?', chinese: '你能帮我找到地铁站吗？', level: 0, tag: '问路' },
		{ text: 'The weather is beautiful today.', chinese: '今天天气真好。', level: 0, tag: '日常' },
		{ text: 'I am learning English every day.', chinese: '我每天都在学英语。', level: 0, tag: '学习' },
		{ text: 'Could you please speak more slowly?', chinese: '请你说慢一点好吗？', level: 0, tag: '日常' },
		{ text: 'I need to buy some groceries.', chinese: '我需要买一些日用品。', level: 0, tag: '购物' },
		{ text: 'Where is the nearest restaurant?', chinese: '最近的餐厅在哪里？', level: 0, tag: '问路' },
		{ text: 'I enjoy reading books in my free time.', chinese: '我喜欢在空闲时间读书。', level: 0, tag: '日常' },
		{ text: 'Thank you very much for your help.', chinese: '非常感谢你的帮助。', level: 0, tag: '礼貌' },
		{ text: 'I have an important meeting this afternoon.', chinese: '我今天下午有一个重要会议。', level: 1, tag: '职场' },
		{ text: 'Could you recommend a good restaurant nearby?', chinese: '你能推荐附近一家好餐厅吗？', level: 1, tag: '问路' },
		{ text: 'I would like to return this item, please.', chinese: '我想退换这件商品。', level: 1, tag: '购物' },
		{ text: 'What time does the next train leave?', chinese: '下一班火车什么时候发车？', level: 1, tag: '交通' },
		{ text: 'I need to make an appointment with the doctor.', chinese: '我需要预约看医生。', level: 1, tag: '医院' },
		{ text: 'The project deadline is next Friday.', chinese: '项目截止日期是下周五。', level: 1, tag: '职场' },
		{ text: 'Would you like to join us for dinner tonight?', chinese: '你今晚想和我们一起吃晚饭吗？', level: 1, tag: '社交' },
		{ text: 'I am looking for a new apartment to rent.', chinese: '我在找一间新公寓租。', level: 1, tag: '日常' },
		{ text: 'Could you explain this grammar point to me?', chinese: '你能给我解释一下这个语法点吗？', level: 1, tag: '学习' },
		{ text: 'I believe hard work always leads to success.', chinese: '我相信努力工作总会带来成功。', level: 2, tag: '观点' }
	];

	const insertSentence = db.prepare('INSERT IGNORE INTO shadow_sentences (text, chinese, level, tag, sort_order) VALUES (?, ?, ?, ?, ?)');
	for (let i = 0; i < sentences.length; i++) {
		const s = sentences[i];
		await insertSentence.run(s.text, s.chinese, s.level, s.tag, i + 1);
	}
	console.log(`✅ 导入 ${sentences.length} 个跟读句子`);

	// ========== 语法练习题 ==========
	const grammarQuestions = [
		{ grammar_id: 1, sentence: 'I ___ a student.', answer: 'am', options: '["am","is","are","be"]', explanation: '主语 I 用 am', level: 0 },
		{ grammar_id: 1, sentence: 'She ___ English every day.', answer: 'speaks', options: '["speak","speaks","speaking","spoke"]', explanation: '主语 She 是第三人称单数，动词加 s', level: 0 },
		{ grammar_id: 1, sentence: 'They ___ playing football.', answer: 'are', options: '["is","am","are","was"]', explanation: '主语 They 用 are', level: 0 },
		{ grammar_id: 2, sentence: 'I ___ to school yesterday.', answer: 'went', options: '["go","goes","went","going"]', explanation: 'yesterday 表示过去时，用 went', level: 0 },
		{ grammar_id: 1, sentence: 'He ___ like apples.', answer: 'does not', options: '["do not","does not","is not","are not"]', explanation: '主语 He 是第三人称单数，用 does not', level: 0 },
		{ grammar_id: 1, sentence: '___ you like coffee?', answer: 'Do', options: '["Do","Does","Is","Are"]', explanation: '主语 you 用 Do', level: 0 },
		{ grammar_id: 1, sentence: 'The cat ___ on the table.', answer: 'is', options: '["is","are","am","be"]', explanation: '主语 The cat 是单数，用 is', level: 0 },
		{ grammar_id: 1, sentence: 'We ___ happy.', answer: 'are', options: '["is","am","are","was"]', explanation: '主语 We 用 are', level: 0 },
		{ grammar_id: 3, sentence: 'She ___ a book now.', answer: 'is reading', options: '["read","reads","is reading","readed"]', explanation: 'now 表示现在进行时，用 is reading', level: 0 },
		{ grammar_id: 1, sentence: 'I ___ finished my homework.', answer: 'have', options: '["have","has","had","having"]', explanation: '主语 I 用 have', level: 0 },
		{ grammar_id: 2, sentence: '___ it rain yesterday?', answer: 'Did', options: '["Do","Does","Did","Was"]', explanation: 'yesterday 表示过去时，用 Did', level: 0 },
		{ grammar_id: 1, sentence: 'He ___ two brothers.', answer: 'has', options: '["have","has","having","haves"]', explanation: '主语 He 是第三人称单数，用 has', level: 0 },
		{ grammar_id: 4, sentence: 'I ___ visit my grandparents tomorrow.', answer: 'will', options: '["will","am","do","did"]', explanation: 'tomorrow 表示将来时，用 will', level: 1 },
		{ grammar_id: 4, sentence: 'We ___ going to have a party.', answer: 'are', options: '["is","am","are","was"]', explanation: 'be going to 表示将来，主语 We 用 are', level: 1 },
		{ grammar_id: 5, sentence: 'I ___ when the phone rang.', answer: 'was sleeping', options: '["am sleeping","was sleeping","slept","sleep"]', explanation: '过去某一时刻正在进行，用 was sleeping', level: 1 },
		{ grammar_id: 1, sentence: 'There ___ a book on the table.', answer: 'is', options: '["is","are","am","be"]', explanation: 'there be 句型，a book 是单数用 is', level: 0 },
		{ grammar_id: 1, sentence: '___ she like music?', answer: 'Does', options: '["Do","Does","Is","Are"]', explanation: '主语 she 是第三人称单数，用 Does', level: 0 },
		{ grammar_id: 3, sentence: 'Look! The children ___ in the park.', answer: 'are playing', options: '["play","plays","are playing","played"]', explanation: 'Look! 表示现在正在进行，用 are playing', level: 0 },
		{ grammar_id: 2, sentence: 'She ___ dinner last night.', answer: 'cooked', options: '["cook","cooks","cooked","cooking"]', explanation: 'last night 表示过去时间，用 cooked', level: 0 },
		{ grammar_id: 4, sentence: 'It ___ rain tomorrow.', answer: 'will', options: '["will","is","does","did"]', explanation: 'tomorrow 表示将来时，用 will', level: 1 }
	];

	const insertQuestion = db.prepare('INSERT IGNORE INTO grammar_questions (grammar_id, sentence, answer, options, explanation, level, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)');
	for (let i = 0; i < grammarQuestions.length; i++) {
		const q = grammarQuestions[i];
		await insertQuestion.run(q.grammar_id, q.sentence, q.answer, q.options, q.explanation, q.level, i + 1);
	}
	console.log(`✅ 导入 ${grammarQuestions.length} 道语法练习题`);

	// ========== 音标 ==========
	const phonetics = [
		{ symbol: '/iː/', example: 'see', chinese: '长衣音', category: 'vowel' },
		{ symbol: '/ɪ/', example: 'sit', chinese: '短衣音', category: 'vowel' },
		{ symbol: '/e/', example: 'bed', chinese: '耶音', category: 'vowel' },
		{ symbol: '/æ/', example: 'cat', chinese: '大嘴梅花音', category: 'vowel' },
		{ symbol: '/ɑː/', example: 'car', chinese: '长啊音', category: 'vowel' },
		{ symbol: '/ɒ/', example: 'hot', chinese: '短哦音', category: 'vowel' },
		{ symbol: '/ɔː/', example: 'call', chinese: '长哦音', category: 'vowel' },
		{ symbol: '/ʊ/', example: 'put', chinese: '短乌音', category: 'vowel' },
		{ symbol: '/uː/', example: 'food', chinese: '长乌音', category: 'vowel' },
		{ symbol: '/ʌ/', example: 'cup', chinese: '短啊音', category: 'vowel' },
		{ symbol: '/ɜː/', example: 'bird', chinese: '额长音', category: 'vowel' },
		{ symbol: '/ə/', example: 'about', chinese: '额短音', category: 'vowel' },
		{ symbol: '/p/', example: 'pen', chinese: '破音', category: 'consonant' },
		{ symbol: '/b/', example: 'big', chinese: '波音', category: 'consonant' },
		{ symbol: '/t/', example: 'tea', chinese: '特音', category: 'consonant' },
		{ symbol: '/d/', example: 'dog', chinese: '得音', category: 'consonant' },
		{ symbol: '/k/', example: 'cat', chinese: '科音', category: 'consonant' },
		{ symbol: '/g/', example: 'go', chinese: '哥音', category: 'consonant' },
		{ symbol: '/f/', example: 'fun', chinese: '夫音', category: 'consonant' },
		{ symbol: '/v/', example: 'van', chinese: '屋音', category: 'consonant' },
		{ symbol: '/θ/', example: 'think', chinese: '思音', category: 'consonant' },
		{ symbol: '/ð/', example: 'this', chinese: '兹音', category: 'consonant' },
		{ symbol: '/s/', example: 'see', chinese: '丝音', category: 'consonant' },
		{ symbol: '/z/', example: 'zoo', chinese: '子音', category: 'consonant' },
		{ symbol: '/ʃ/', example: 'she', chinese: '诗音', category: 'consonant' },
		{ symbol: '/ʒ/', example: 'measure', chinese: '日音', category: 'consonant' },
		{ symbol: '/h/', example: 'hat', chinese: '喝音', category: 'consonant' },
		{ symbol: '/tʃ/', example: 'chair', chinese: '吃音', category: 'consonant' },
		{ symbol: '/dʒ/', example: 'job', chinese: '知音', category: 'consonant' },
		{ symbol: '/tr/', example: 'tree', chinese: '戳音', category: 'consonant' },
		{ symbol: '/dr/', example: 'dry', chinese: '捉音', category: 'consonant' },
		{ symbol: '/ts/', example: 'cats', chinese: '次音', category: 'consonant' },
		{ symbol: '/dz/', example: 'beds', chinese: '子音', category: 'consonant' },
		{ symbol: '/m/', example: 'man', chinese: '么音', category: 'consonant' },
		{ symbol: '/n/', example: 'no', chinese: '呢音', category: 'consonant' },
		{ symbol: '/ŋ/', example: 'sing', chinese: '嗯音', category: 'consonant' },
		{ symbol: '/l/', example: 'let', chinese: '了音', category: 'consonant' },
		{ symbol: '/r/', example: 'red', chinese: '若音', category: 'consonant' },
		{ symbol: '/w/', example: 'we', chinese: '我音', category: 'consonant' },
		{ symbol: '/j/', example: 'yes', chinese: '呀音', category: 'consonant' },
		{ symbol: '/eɪ/', example: 'day', chinese: '诶衣', category: 'combination' },
		{ symbol: '/aɪ/', example: 'my', chinese: '啊衣', category: 'combination' },
		{ symbol: '/ɔɪ/', example: 'boy', chinese: '哦衣', category: 'combination' },
		{ symbol: '/aʊ/', example: 'how', chinese: '啊乌', category: 'combination' },
		{ symbol: '/əʊ/', example: 'go', chinese: '额乌', category: 'combination' },
		{ symbol: '/ɪə/', example: 'here', chinese: '衣额', category: 'combination' },
		{ symbol: '/eə/', example: 'there', chinese: '耶额', category: 'combination' },
		{ symbol: '/ʊə/', example: 'tour', chinese: '乌额', category: 'combination' }
	];

	const insertPhonetic = db.prepare('INSERT IGNORE INTO phonetics (symbol, example, chinese, category, sort_order) VALUES (?, ?, ?, ?, ?)');
	for (let i = 0; i < phonetics.length; i++) {
		const p = phonetics[i];
		await insertPhonetic.run(p.symbol, p.example, p.chinese, p.category, i + 1);
	}
	console.log(`✅ 导入 ${phonetics.length} 个音标`);

	// ========== 语法知识点 ==========
	const grammarPoints = [
		{
			title: '一般现在时',
			description: '表示经常性、习惯性的动作或状态',
			stage: 1,
			explanation: '一般现在时表示经常发生的动作或存在的状态。常与always, usually, often, sometimes, every day等时间状语连用。\n\n结构：主语 + 动词原形（第三人称单数加s/es）\n否定句：主语 + don\'t/doesn\'t + 动词原形\n疑问句：Do/Does + 主语 + 动词原形？',
			examples: '["I go to school every day.","She likes reading books.","They don\'t play football.","Does he speak English?"]'
		},
		{
			title: '一般过去时',
			description: '表示过去发生的动作或状态',
			stage: 1,
			explanation: '一般过去时表示过去某个时间发生的动作或存在的状态。常与yesterday, last week, in 2020等时间状语连用。\n\n结构：主语 + 动词过去式\n否定句：主语 + didn\'t + 动词原形\n疑问句：Did + 主语 + 动词原形？',
			examples: '["I went to Beijing last year.","She watched TV yesterday.","They didn\'t go to school.","Did you see him?"]'
		},
		{
			title: '现在进行时',
			description: '表示正在进行的动作',
			stage: 1,
			explanation: '现在进行时表示说话时正在进行的动作。常与now, at the moment等时间状语连用。\n\n结构：主语 + am/is/are + 动词ing',
			examples: '["I am reading a book now.","She is cooking dinner.","They are playing football.","What are you doing?"]'
		},
		{
			title: '一般将来时',
			description: '表示将来发生的动作或状态',
			stage: 1,
			explanation: '一般将来时表示将来某个时间要发生的动作或存在的状态。\n\n结构：主语 + will + 动词原形\n或：主语 + be going to + 动词原形',
			examples: '["I will go to Shanghai tomorrow.","She is going to study English.","They will have a meeting.","We are going to have a party."]'
		},
		{
			title: '过去进行时',
			description: '表示过去某一时刻正在进行的动作',
			stage: 1,
			explanation: '过去进行时表示过去某一时刻或某一段时间正在进行的动作。\n\n结构：主语 + was/were + 动词ing',
			examples: '["I was sleeping at 10 last night.","She was watching TV when I came.","They were playing football.","What were you doing then?"]'
		},
		{
			title: '一般现在时否定句',
			description: '使用don\'t/doesn\'t构成否定',
			stage: 1,
			explanation: '一般现在时的否定句结构：\n主语 + don\'t/doesn\'t + 动词原形\n\n- I/You/We/They + don\'t + 动词原形\n- He/She/It + doesn\'t + 动词原形',
			examples: '["I don\'t like coffee.","She doesn\'t speak Chinese.","We don\'t have time.","He doesn\'t play football."]'
		},
		{
			title: '一般现在时疑问句',
			description: '使用Do/Does开头的一般疑问句',
			stage: 1,
			explanation: '一般现在时的疑问句结构：\nDo/Does + 主语 + 动词原形？\n\n- Do I/you/we/they + 动词原形？\n- Does he/she/it + 动词原形？',
			examples: '["Do you like apples?","Does she go to school?","Do they play basketball?","Does he have a car?"]'
		},
		{
			title: '名词复数',
			description: '名词变复数的规则和不规则变化',
			stage: 2,
			explanation: '名词复数变化规则：\n1. 一般加s: book→books\n2. 以s/x/ch/sh结尾加es: box→boxes\n3. 以辅音+y结尾，变y为i加es: city→cities\n4. 以f/fe结尾，变f为v加es: knife→knives\n5. 不规则变化: man→men, child→children',
			examples: '["I have two cats.","There are three boxes.","She has five cities.","I bought two knives."]'
		},
		{
			title: '形容词比较级',
			description: '形容词比较级的构成和用法',
			stage: 2,
			explanation: '比较级构成规则：\n1. 单音节加er: tall→taller\n2. 以e结尾加r: large→larger\n3. 辅音字母结尾双写加er: big→bigger\n4. 多音节用more: beautiful→more beautiful\n\n用法：A is + 比较级 + than + B',
			examples: '["Tom is taller than Jerry.","This book is more interesting than that one.","She is younger than me.","Today is hotter than yesterday."]'
		},
		{
			title: '情态动词can',
			description: '表示能力、许可和可能性',
			stage: 2,
			explanation: 'can的用法：\n1. 表示能力：I can swim.\n2. 表示许可：You can go now.\n3. 表示可能性：It can be cold in winter.\n\n否定：can\'t/cannot\n疑问：Can + 主语 + 动词原形？',
			examples: '["I can speak English.","She can play the piano.","Can you help me?","He can\'t drive."]'
		},
		{
			title: '介词用法',
			description: '常用介词in/on/at的用法',
			stage: 2,
			explanation: '时间介词：\n- in: 月/年/季节/上午下午 (in July, in 2024)\n- on: 具体某天/星期 (on Monday, on July 1st)\n- at: 具体时刻 (at 8 o\'clock)\n\n地点介词：\n- in: 在里面\n- on: 在上面\n- at: 在某处',
			examples: '["I was born in 2000.","See you on Monday.","The meeting is at 3pm.","The book is on the table."]'
		}
	];

	const insertGrammarPoint = db.prepare('INSERT IGNORE INTO grammar_points (title, description, stage, explanation, examples, sort_order) VALUES (?, ?, ?, ?, ?, ?)');
	for (let i = 0; i < grammarPoints.length; i++) {
		const g = grammarPoints[i];
		await insertGrammarPoint.run(g.title, g.description, g.stage, g.explanation, g.examples, i + 1);
	}
	console.log(`✅ 导入 ${grammarPoints.length} 个语法知识点`);

	// 统计
	const sceneCount = (await db.prepare('SELECT COUNT(*) as c FROM dialogue_scenes').get()).c;
	const sentenceCount = (await db.prepare('SELECT COUNT(*) as c FROM shadow_sentences').get()).c;
	const questionCount = (await db.prepare('SELECT COUNT(*) as c FROM grammar_questions').get()).c;
	const phoneticCount = (await db.prepare('SELECT COUNT(*) as c FROM phonetics').get()).c;
	const grammarPointCount = (await db.prepare('SELECT COUNT(*) as c FROM grammar_points').get()).c;
	console.log(`\n📊 数据库统计：`);
	console.log(`   对话场景: ${sceneCount} 个`);
	console.log(`   跟读句子: ${sentenceCount} 句`);
	console.log(`   语法题: ${questionCount} 道`);
	console.log(`   音标: ${phoneticCount} 个`);
	console.log(`   语法知识点: ${grammarPointCount} 个`);
}

seedData()
	.catch((error) => {
		console.error('种子数据导入失败:', error);
		process.exitCode = 1;
	})
	.finally(closeDatabase);
