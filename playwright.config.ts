import type { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
	webServer: {
		command: 'bun --bun run build && bun --bun run preview',
		port: 4173
	}
};

export default config;
