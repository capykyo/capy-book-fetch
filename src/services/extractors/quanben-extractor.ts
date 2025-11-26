import { ExtractResult } from '../../types';
import * as cheerio from 'cheerio';

/**
 * quanben.io URL 格式验证
 * 格式: https://quanben.io/n/{book-id}/{chapter-number}.html
 */
const QUANBEN_URL_PATTERN = /^https:\/\/quanben\.io\/n\/[^\/]+\/\d+\.html$/;

/**
 * 验证 URL 是否为 quanben.io 格式
 */
export function isQuanbenUrl(url: string): boolean {
  return QUANBEN_URL_PATTERN.test(url);
}

/**
 * 从 quanben.io 网站提取文章内容
 * 
 * @param html HTML 内容
 * @param url 原始 URL（用于解析相对链接）
 * @returns 提取的文章内容
 */
export async function extractQuanbenContent(html: string, url: string): Promise<ExtractResult> {
  const $ = cheerio.load(html);
  const baseUrl = new URL(url);

  // 提取描述信息
  const description = $('meta[name="description"]').attr('content') || '';

  // 提取书名
  const bookName = $('div.name').text().trim() || '';

  // 提取章节标题
  const title = $('h1.headline[itemprop="headline"]').text().trim() || '';

  // 提取正文内容（从 #content 中的 p 标签）
  const contentDiv = $('#content');
  const paragraphs: string[] = [];
  
  // 遍历所有 p 标签，过滤掉广告和脚本
  contentDiv.find('p').each((_, element) => {
    const $p = $(element);
    // 跳过在广告容器中的 p 标签
    if ($p.closest('.ads').length === 0) {
      const text = $p.text().trim();
      if (text) {
        paragraphs.push(text);
      }
    }
  });

  // 将段落用换行符连接
  const content = paragraphs.join('\n') || '未找到正文内容';

  // 提取导航链接
  const listPage = $('.list_page');
  
  // 提取上一页链接
  let prevLink: string | null = null;
  const firstSpan = listPage.find('span').first();
  const firstSpanLink = firstSpan.find('a').first();
  
  if (firstSpanLink.length > 0) {
    // 如果第一个 span 中有链接，提取它
    const href = firstSpanLink.attr('href');
    if (href) {
      try {
        prevLink = new URL(href, baseUrl).href;
      } catch {
        prevLink = null;
      }
    }
  } else {
    // 如果第一个 span 只有文本"上一页"没有链接，根据章节号计算
    const urlMatch = url.match(/\/n\/([^\/]+)\/(\d+)\.html$/);
    if (urlMatch) {
      const bookId = urlMatch[1];
      const currentChapter = parseInt(urlMatch[2], 10);
      if (currentChapter > 1) {
        // 计算上一页URL
        const prevChapter = currentChapter - 1;
        try {
          prevLink = new URL(`/n/${bookId}/${prevChapter}.html`, baseUrl).href;
        } catch {
          prevLink = null;
        }
      }
      // 如果 currentChapter === 1，prevLink 保持为 null
    }
  }

  // 提取下一页链接
  let nextLink: string | null = null;
  const nextElement = listPage.find('a[rel="next"]').first();
  if (nextElement.length > 0) {
    const href = nextElement.attr('href');
    if (href) {
      try {
        nextLink = new URL(href, baseUrl).href;
      } catch {
        nextLink = null;
      }
    }
  }

  return {
    title: title || '未找到标题',
    content: content || '未找到正文内容',
    author: '', // quanben.io 不提供作者信息
    prevLink,
    nextLink,
    bookName: bookName || '',
    description: description || '',
  };
}

