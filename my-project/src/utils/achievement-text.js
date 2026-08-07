// 成就进度文案工具
const REMAIN_UNITS = {
	beginner: '',
	word_master_100: '词',
	word_master_500: '词',
	grammar_beginner: '个知识点',
	speak_beginner: '次跟读',
	pronunciation_master: '分',
	dialogue_master: '次对话',
	streak_3: '天',
	streak_7: '天',
	streak_15: '天',
	streak_30: '天',
	all_achievements: '个成就'
};

export function achievementRemaining(badge) {
	const target = Number(badge?.target || 0);
	const current = Math.min(Number(badge?.current || 0), target);
	return Math.max(0, target - current);
}

export function achievementRemainingText(badge) {
	if (!badge) return '';
	const remain = achievementRemaining(badge);
	if (remain <= 0) return '已完成';
	if (badge.id === 'beginner') return '完成首次学习';
	const unit = REMAIN_UNITS[badge.id] || '';
	return '还差 ' + remain + ' ' + unit;
}
