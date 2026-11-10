import adapter from '@sveltejs/adapter-node'
import { sveltekit } from '@sveltejs/kit/vite'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'
import tailwind from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => ({
  plugins: [
    sveltekit({
      preprocess: [vitePreprocess()],
      compilerOptions: { experimental: { async: true } },
      adapter: adapter(),
      paths: {
        origin: loadEnv(mode, process.cwd(), 'PUBLIC_').PUBLIC_ORIGIN,
      },
      csrf: {
        trustedOrigins: ['http://localhost:5173', 'http://127.0.0.1:5173'],
      },
      experimental: { remoteFunctions: true },
    }),
    tailwind(),
  ],
}))
