// 输入法经常把英文 ASCII 标点自动替换为排版标点。
// 拼写判定应忽略这种显示层差异，但仍保留字母和单词本身的严格比较。
export function normalizeEnglishAnswer(value) {
	return String(value ?? '')
		.normalize('NFKC')
		.trim()
		.toLowerCase()
		.replace(/[\u2018\u2019\u201B\u02BC\uFF07`´]/g, "'")
		.replace(/[\u201C\u201D\uFF02]/g, '"')
		.replace(/[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D]/g, '-')
		.replace(/\s+/g, ' ');
}

export function isSameEnglishAnswer(input, expected) {
	return normalizeEnglishAnswer(input) === normalizeEnglishAnswer(expected);
}
// 用于开放式句子评分：保留缩写中的撇号，忽略句末标点和排版差异。
export function normalizeEnglishSentence(value) {
	return normalizeEnglishAnswer(value)
		.replace(/[^a-z0-9' -]+/g, ' ')
		.replace(/\s*-\s*/g, '-')
		.replace(/\s+/g, ' ')
		.trim();
}

export function englishWords(value) {
	return normalizeEnglishSentence(value).match(/[a-z0-9]+(?:'[a-z0-9]+)*/g) || [];
}