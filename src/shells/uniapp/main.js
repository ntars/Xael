// main.js —— uni-app 启动入口（Vue 3）
import { createSSRApp } from 'vue';
import App from './App.vue';
import Index from './pages/index/index.vue';

export function createApp() {
  const app = createSSRApp(App);
  return { app };
}
