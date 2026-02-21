import { FullConfig } from '@playwright/test';

/**
 * 全局测试设置钩子
 * 在所有测试运行前执行
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 开始 E2E 测试');
  console.log(`📝 测试环境: ${process.env.BASE_URL || 'https://jarvis-neo.zeabur.app'}`);
  console.log(`🌐 浏览器: ${config.projects?.map(p => p.name).join(', ') || 'chromium'}`);
}

export default globalSetup;
