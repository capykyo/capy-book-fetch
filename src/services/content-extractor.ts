import { ExtractResult } from '../types';
import * as cheerio from 'cheerio';
import { isQuanbenUrl, extractQuanbenContent } from './extractors/quanben-extractor';

/**
 * 从 HTML 中提取文章内容
 * 根据 URL 格式自动选择对应的提取器
 * 
 * @param html HTML 内容
 * @param url 原始 URL（用于解析相对链接）
 * @returns 提取的文章内容
 */
export async function extractContent(html: string, url: string): Promise<ExtractResult> {
  // 检查是否为 quanben.io 网站
  if (isQuanbenUrl(url)) {
    return extractQuanbenContent(html, url);
  }

  // 默认使用通用提取逻辑
  // TODO: 根据目标网站分析后实现具体的提取规则
  // 目前返回占位数据
  
  const $ = cheerio.load(html);
  const baseUrl = new URL(url);

  // 尝试提取标题（常见选择器）
  let title = $('title').text().trim() || 
              $('h1').first().text().trim() || 
              $('meta[property="og:title"]').attr('content') || 
              '未找到标题';

  // 尝试提取正文（常见选择器）
  let content = $('article').text().trim() || 
                $('.content').text().trim() || 
                $('.article-content').text().trim() || 
                $('main').text().trim() || 
                '未找到正文内容';

  // 尝试提取作者（常见选择器）
  let author = $('meta[name="author"]').attr('content') || 
               $('.author').text().trim() || 
               $('[rel="author"]').text().trim() || 
               '未知作者';

  // 尝试提取上一页链接
  let prevLink: string | null = null;
  let prevElement = $('a[rel="prev"]').first();
  if (!prevElement.length) {
    prevElement = $('.prev').first();
  }
  if (!prevElement.length) {
    prevElement = $('.previous').first();
  }
  if (prevElement.length) {
    const href = prevElement.attr('href');
    if (href) {
      try {
        prevLink = new URL(href, baseUrl).href;
      } catch {
        prevLink = null;
      }
    }
  }

  // 尝试提取下一页链接
  let nextLink: string | null = null;
  let nextElement = $('a[rel="next"]').first();
  if (!nextElement.length) {
    nextElement = $('.next').first();
  }
  if (nextElement.length) {
    const href = nextElement.attr('href');
    if (href) {
      try {
        nextLink = new URL(href, baseUrl).href;
      } catch {
        nextLink = null;
      }
    }
  }

  // 清理内容（移除多余空白）
  title = title.replace(/\s+/g, ' ').trim();
  content = content.replace(/\s+/g, ' ').trim();
  author = author.replace(/\s+/g, ' ').trim();

  return {
    title: title || '未找到标题',
    content: content || '未找到正文内容',
    author: author || '未知作者',
    prevLink,
    nextLink,
  };
}

