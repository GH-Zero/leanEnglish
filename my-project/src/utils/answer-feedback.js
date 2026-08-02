let feedbackAudio = null;
let feedbackGeneration = 0;

export function clearAnswerFeedback() {
	feedbackGeneration++;
	if (!feedbackAudio) return;
	try { feedbackAudio.stop(); feedbackAudio.destroy(); } catch (_) {}
	feedbackAudio = null;
}

export function playAnswerFeedback(correct) {
	clearAnswerFeedback();
	const generation = feedbackGeneration;
	try {
		const audio = uni.createInnerAudioContext();
		let started = false;
		feedbackAudio = audio;
		audio.autoplay = false;
		audio.volume = 0.7;
		audio.src = correct ? '/static/audio/answer-correct.wav' : '/static/audio/answer-wrong.wav';
		audio.onCanplay(() => {
			if (!started && generation === feedbackGeneration && feedbackAudio === audio) {
				started = true;
				audio.play();
			}
		});
		const finish = () => {
			if (feedbackAudio !== audio) return;
			audio.destroy();
			feedbackAudio = null;
		};
		audio.onEnded(finish);
		audio.onError(finish);
	} catch (_) {}
}
