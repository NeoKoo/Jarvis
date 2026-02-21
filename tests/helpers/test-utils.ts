import { Page, Locator } from '@playwright/test';

/**
 * 测试辅助函数
 * 提供 E2E 测试中常用的工具函数
 */

/**
 * 等待页面完全加载
 * 等待 React hydration 完成和主要内容渲染
 */
export async function waitForPageLoad(page: Page): Promise<void> {
  // 等待页面网络空闲
  await page.waitForLoadState('networkidle');
  // 等待主要内容渲染
  await page.waitForSelector('main', { timeout: 5000 }).catch(() => {
    // 如果找不到 main 元素，至少等待一段时间
  });
}

/**
 * 清空所有笔记
 * 通过直接操作 IndexedDB 删除所有笔记数据
 */
export async function clearAllNotes(page: Page): Promise<void> {
  try {
    await page.evaluate(async () => {
      const dbName = 'JarvisDB';
      const request = indexedDB.open(dbName);

      return new Promise<void>((resolve, reject) => {
        request.onsuccess = async () => {
          const db = request.result;
          try {
            // 检查 notes 对象存储是否存在
            if (!db.objectStoreNames.contains('notes')) {
              db.close();
              resolve();
              return;
            }

            const transaction = db.transaction(['notes'], 'readwrite');
            const objectStore = transaction.objectStore('notes');

            await new Promise<void>((res, rej) => {
              const clearReq = objectStore.clear();
              clearReq.onsuccess = () => res();
              clearReq.onerror = () => rej(clearReq.error);
            });

            db.close();
            resolve();
          } catch (error) {
            db.close();
            reject(error);
          }
        };

        request.onerror = () => {
          reject(request.error);
        };

        request.onupgradeneeded = () => {
          // 数据库不存在，不需要清空
          request.result.close();
          resolve();
        };
      });
    });
  } catch (error) {
    // 如果清空失败，继续执行（可能数据库不存在）
    console.log('Note: Could not clear notes database:', error);
  }

  // 刷新页面以清除内存状态
  await page.reload();
  await waitForPageLoad(page);
}

/**
 * 创建模拟笔记数据
 * 用于测试前准备测试数据
 */
export async function createMockNote(page: Page, noteData: {
  title: string;
  content: string;
  tags?: string[];
}): Promise<void> {
  // 使用 IndexedDB 直接创建笔记
  await page.evaluate(async (data) => {
    const dbName = 'JarvisDB';
    const request = indexedDB.open(dbName);

    return new Promise<void>((resolve, reject) => {
      request.onsuccess = async () => {
        const db = request.result;
        try {
          const transaction = db.transaction(['notes'], 'readwrite');
          const objectStore = transaction.objectStore('notes');

          const note = {
            id: crypto.randomUUID(),
            title: data.title,
            content: data.content,
            tags: data.tags || [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          await new Promise<void>((res, rej) => {
            const addReq = objectStore.add(note);
            addReq.onsuccess = () => res();
            addReq.onerror = () => rej(addReq.error);
          });

          db.close();
          resolve();
        } catch (error) {
          db.close();
          reject(error);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }, noteData);

  // 刷新页面以加载新数据
  await page.reload();
  await waitForPageLoad(page);
}

/**
 * 截图辅助函数
 * 在指定步骤拍摄截图并保存
 */
export async function takeScreenshot(page: Page, name: string): Promise<void> {
  await page.screenshot({
    path: `test-results/screenshots/${name}.png`,
    fullPage: true,
  });
}

/**
 * 等待 Toast 消息出现并返回其文本
 */
export async function waitForToast(page: Page): Promise<string> {
  // 尝试多种可能的 toast 选择器
  const toastSelectors = [
    '[role="status"]',
    '.toast',
    '[data-testid="toast"]',
    '.fixed.bottom-4.right-4',
  ];

  for (const selector of toastSelectors) {
    try {
      const toast = page.locator(selector).first();
      await toast.waitFor({ state: 'visible', timeout: 3000 });
      const text = await toast.textContent();
      if (text) return text;
    } catch {
      // 继续尝试下一个选择器
    }
  }

  // 如果都找不到，返回空字符串
  return '';
}

/**
 * 填写笔记表单
 */
export async function fillNoteForm(
  page: Page,
  title: string,
  content: string,
  tags: string[] = []
): Promise<void> {
  // 填写标题
  await page.fill('input[placeholder="笔记标题"]', title);

  // 填写内容
  await page.fill('textarea[placeholder="开始写下您的想法..."]', content);

  // 添加标签
  for (const tag of tags) {
    const tagInput = page.locator('input[placeholder="添加标签"]');
    await tagInput.fill(tag);
    await tagInput.press('Enter');
  }
}

/**
 * 导航到指定页面
 */
export async function navigateTo(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await waitForPageLoad(page);
}

/**
 * 等待加载指示器消失
 */
export async function waitForLoading(page: Page): Promise<void> {
  const loaders = page.locator('.animate-spin, [role="status"]:has-text("加载中")');
  const count = await loaders.count();
  if (count > 0) {
    await loaders.first().waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {
      // 加载器可能已经消失，继续执行
    });
  }
}

/**
 * 等待并确认元素可见
 */
export async function ensureVisible(locator: Locator): Promise<void> {
  await locator.first().waitFor({ state: 'visible', timeout: 10000 });
}

/**
 * 等待并确认元素隐藏
 */
export async function ensureHidden(locator: Locator): Promise<void> {
  await locator.waitFor({ state: 'hidden', timeout: 5000 });
}
