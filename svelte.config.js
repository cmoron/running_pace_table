import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import dotenv from 'dotenv';

dotenv.config();

export default {
  preprocess: vitePreprocess(),
  kit: {
    vite: {
      define: {
        'process.env': process.env,
        'import.meta.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL),
      },
    },
  },
};
