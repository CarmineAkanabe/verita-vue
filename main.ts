import { createApp } from 'vue';
import { pinia } from './plugins/pinia';


import App from './App.vue'
import router from './router'
import './style.css'

createApp(App).use(pinia).use(router).mount('#app')