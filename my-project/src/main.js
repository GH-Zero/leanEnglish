import {
	createSSRApp
} from "vue";
import App from "./App.vue";
import AchievementUnlockNotifier from "./components/AchievementUnlockNotifier.vue";
export function createApp() {
	const app = createSSRApp(App);
	app.component("AchievementUnlockNotifier", AchievementUnlockNotifier);
	return {
		app,
	};
}
