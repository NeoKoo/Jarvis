import { test, expect } from '@playwright/test';
import {
  waitForPageLoad,
  clearAllNotes,
  createMockNote,
  navigateTo,
  fillNoteForm,
  waitForToast,
  waitForLoading,
  ensureVisible,
} from '../helpers/test-utils';

/**
 * 笔记功能 E2E 测试
 * 测试笔记的创建、编辑、删除、搜索和导出功能
 */

test.describe('笔记功能', () => {
  // 每个测试前清空笔记
  test.beforeEach(async ({ page }) => {
    await navigateTo(page, '/notes');
    await clearAllNotes(page);
  });

  test.afterEach(async ({ page }) => {
    // 清理测试数据
    await clearAllNotes(page);
  });

  test('应该能够创建新笔记', async ({ page }) => {
    // 点击"新建笔记"按钮
    await page.click('button:has-text("新建笔记")');

    // 等待表单显示
    await ensureVisible(page.locator('input[placeholder="笔记标题"]'));

    // 填写笔记表单
    await fillNoteForm(page, '测试笔记标题', '这是测试笔记的内容', ['测试', 'E2E']);

    // 点击保存按钮
    await page.click('button:has-text("保存")');

    // 等待 Toast 提示
    const toast = await waitForToast(page);
    expect(toast).toContain('成功');

    // 验证笔记出现在列表中
    await ensureVisible(page.locator('text=测试笔记标题'));

    // 验证笔记数量
    const count = await page.locator('.space-y-3 > div').filter({ hasText: '测试笔记标题' }).count();
    expect(count).toBe(1);
  });

  test('应该能够编辑已有笔记', async ({ page }) => {
    // 先创建一个笔记
    await createMockNote(page, {
      title: '原始标题',
      content: '原始内容',
      tags: ['原始标签'],
    });

    // 点击编辑按钮
    await page.click('[aria-label="编辑笔记"], button:has(.lucide-edit2)');

    // 等待表单显示
    await ensureVisible(page.locator('input[placeholder="笔记标题"]'));

    // 验证现有数据已填充
    const titleValue = await page.inputValue('input[placeholder="笔记标题"]');
    expect(titleValue).toBe('原始标题');

    // 修改标题和内容
    await page.fill('input[placeholder="笔记标题"]', '修改后的标题');
    await page.fill('textarea[placeholder="开始写下您的想法..."]', '修改后的内容');

    // 点击更新按钮
    await page.click('button:has-text("更新")');

    // 等待 Toast 提示
    const toast = await waitForToast(page);
    expect(toast).toContain('成功');

    // 验证更新后的内容
    await ensureVisible(page.locator('text=修改后的标题'));
    await ensureVisible(page.locator('text=修改后的内容'));
  });

  test('应该能够删除笔记', async ({ page }) => {
    // 先创建一个笔记
    await createMockNote(page, {
      title: '待删除的笔记',
      content: '这个笔记将被删除',
      tags: [],
    });

    // 验证笔记存在
    await ensureVisible(page.locator('text=待删除的笔记'));

    // 点击删除按钮
    await page.click('[aria-label="删除笔记"], button:has(.lucide-trash2)');

    // 等待删除完成（笔记从列表中消失）
    await page.waitForSelector('text=待删除的笔记', { state: 'hidden', timeout: 5000 });

    // 验证笔记已删除
    const noteElement = page.locator('text=待删除的笔记');
    await expect(noteElement).not.toBeVisible();
  });

  test('应该能够通过标题搜索笔记', async ({ page }) => {
    // 创建多条笔记
    await createMockNote(page, {
      title: 'JavaScript 基础',
      content: 'JS 是一门编程语言',
      tags: ['编程'],
    });

    await createMockNote(page, {
      title: 'Python 入门',
      content: 'Python 是一门编程语言',
      tags: ['编程'],
    });

    await createMockNote(page, {
      title: 'React 框架',
      content: 'React 是前端框架',
      tags: ['前端'],
    });

    // 刷新页面以加载所有笔记
    await page.reload();
    await waitForPageLoad(page);

    // 搜索 "JavaScript"
    await page.fill('input[placeholder="搜索笔记..."]', 'JavaScript');
    await page.waitForTimeout(300); // 等待搜索过滤

    // 验证只显示匹配的笔记
    await ensureVisible(page.locator('text=JavaScript 基础'));
    await expect(page.locator('text=Python 入门')).not.toBeVisible();
    await expect(page.locator('text=React 框架')).not.toBeVisible();
  });

  test('应该能够通过内容搜索笔记', async ({ page }) => {
    // 创建多条笔记
    await createMockNote(page, {
      title: '笔记一',
      content: '这是一篇关于 TypeScript 的笔记',
      tags: [],
    });

    await createMockNote(page, {
      title: '笔记二',
      content: '这是一篇关于 JavaScript 的笔记',
      tags: [],
    });

    // 刷新页面
    await page.reload();
    await waitForPageLoad(page);

    // 搜索 "TypeScript"
    await page.fill('input[placeholder="搜索笔记..."]', 'TypeScript');
    await page.waitForTimeout(300);

    // 验证搜索结果
    await ensureVisible(page.locator('text=笔记一'));
    await ensureVisible(page.locator('text=TypeScript'));

    // 验证不相关的笔记不显示
    await expect(page.locator('text=笔记二').locator('..').locator('text=JavaScript')).not.toBeVisible();
  });

  test('应该能够通过标签搜索笔记', async ({ page }) => {
    // 创建带标签的笔记
    await createMockNote(page, {
      title: '前端开发',
      content: '前端技术栈',
      tags: ['前端', 'React'],
    });

    await createMockNote(page, {
      title: '后端开发',
      content: '后端技术栈',
      tags: ['后端', 'Node.js'],
    });

    // 刷新页面
    await page.reload();
    await waitForPageLoad(page);

    // 搜索标签 "React"
    await page.fill('input[placeholder="搜索笔记..."]', 'React');
    await page.waitForTimeout(300);

    // 验证显示包含该标签的笔记
    await ensureVisible(page.locator('text=前端开发'));

    // 验证不包含该标签的笔记不显示
    await expect(page.locator('text=后端开发')).not.toBeVisible();
  });

  test('应该能够导出单条笔记', async ({ page }) => {
    // 创建一个笔记
    await createMockNote(page, {
      title: '待导出的笔记',
      content: '这是要导出的内容',
      tags: ['导出测试'],
    });

    // 点击笔记卡片查看详情
    await page.click('.hover\\:shadow-md:has-text("待导出的笔记")');

    // 等待预览显示
    await ensureVisible(page.locator('button:has-text("导出")'));

    // 点击导出按钮
    await page.click('button:has-text("导出")');

    // 等待 Toast 提示
    const toast = await waitForToast(page);
    expect(toast).toContain('复制到剪贴板');
  });

  test('应该能够导出所有笔记', async ({ page }) => {
    // 创建多条笔记
    await createMockNote(page, {
      title: '笔记1',
      content: '内容1',
      tags: [],
    });

    await createMockNote(page, {
      title: '笔记2',
      content: '内容2',
      tags: [],
    });

    // 刷新页面
    await page.reload();
    await waitForPageLoad(page);

    // 点击"导出全部"按钮
    await page.click('button:has-text("导出全部")');

    // 等待 Toast 提示
    const toast = await waitForToast(page);
    expect(toast).toContain('已导出');
    expect(toast).toContain('2');
  });

  test('应该能够在新建时取消操作', async ({ page }) => {
    // 点击"新建笔记"按钮
    await page.click('button:has-text("新建笔记")');

    // 等待表单显示
    await ensureVisible(page.locator('input[placeholder="笔记标题"]'));

    // 填写一些内容
    await page.fill('input[placeholder="笔记标题"]', '未保存的笔记');

    // 点击取消按钮
    await page.click('button:has-text("取消")');

    // 验证表单关闭
    await expect(page.locator('input[placeholder="笔记标题"]')).not.toBeVisible();

    // 验证笔记未保存
    await expect(page.locator('text=未保存的笔记')).not.toBeVisible();
  });

  test('应该能够选择笔记查看详情', async ({ page }) => {
    // 创建一个笔记
    await createMockNote(page, {
      title: '详情测试笔记',
      content: '这是详细内容\n包含多行文本',
      tags: ['详情', '测试'],
    });

    // 点击笔记卡片
    await page.click('.hover\\:shadow-md:has-text("详情测试笔记")');

    // 等待预览面板显示
    await ensureVisible(page.locator('.md\\:col-span-1').filter({ hasText: '详情测试笔记' }));

    // 验证详情内容显示
    await ensureVisible(page.locator('text=这是详细内容'));
    await ensureVisible(page.locator('text=详情'));
    await ensureVisible(page.locator('text=测试'));

    // 验证显示创建时间
    await ensureVisible(page.locator('text=创建于'));
  });

  test('应该显示空状态提示', async ({ page }) => {
    // 确保没有笔记
    await clearAllNotes(page);

    // 验证空状态显示
    await ensureVisible(page.locator('text=暂无笔记'));
    await ensureVisible(page.locator('text=点击"新建笔记"创建您的第一条笔记'));
  });

  test('应该能够添加和删除标签', async ({ page }) => {
    // 点击"新建笔记"
    await page.click('button:has-text("新建笔记")');

    // 等待表单
    await ensureVisible(page.locator('input[placeholder="笔记标题"]'));

    // 添加标签
    const tagInput = page.locator('input[placeholder="添加标签"]');
    await tagInput.fill('测试标签1');
    await tagInput.press('Enter');

    // 验证标签显示
    await ensureVisible(page.locator('text=测试标签1'));

    // 添加第二个标签
    await tagInput.fill('测试标签2');
    await tagInput.press('Enter');
    await ensureVisible(page.locator('text=测试标签2'));

    // 删除第一个标签
    await page.locator('.flex.items-center.gap-1:has-text("测试标签1") button').click();

    // 验证标签已删除
    await expect(page.locator('text=测试标签1')).not.toBeVisible();
    await ensureVisible(page.locator('text=测试标签2'));
  });
});
