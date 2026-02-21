import { FullConfig } from '@playwright/test';

/**
 * 全测试拆解钩子
 * 在所有测试运行后执行
 */
async function globalTeardown(config: FullConfig) {
  console.log('✅ E2E 测试完成');
  console.log('📊 查看测试报告: playwright-report/index.html');
}

export default globalTeardown;
