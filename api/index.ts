/**
 * Vercel Serverless Function 入口
 * 将 Fastify 应用适配为 Vercel serverless function
 */

// Vercel 类型定义
type VercelRequest = {
  method?: string;
  url?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: any;
  query?: Record<string, string | string[]>;
};

type VercelResponse = {
  status: (code: number) => VercelResponse;
  setHeader: (name: string, value: string | string[]) => void;
  send: (body: any) => void;
  json: (body: any) => void;
};

import { createApp } from '../src/app';

// 创建 Fastify 应用实例（单例模式，避免重复创建）
let appInstance: ReturnType<typeof createApp> | null = null;

function getApp() {
  if (!appInstance) {
    appInstance = createApp();
  }
  return appInstance;
}

// Vercel serverless function 处理函数
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const app = getApp();
  
  // 确保应用已准备就绪
  await app.ready();
  
  // 构建请求 URL（包含查询参数）
  // 处理 Vercel rewrites：vercel.json 将所有请求重写到 /api
  // 尝试从多个来源获取原始路径
  let url = req.url || '/';
  
  // 尝试从 Vercel 特定的请求头获取原始路径
  const originalPath = req.headers['x-vercel-original-path'] || 
                       req.headers['x-invoke-path'] ||
                       req.headers['x-forwarded-path'];
  
  if (originalPath && typeof originalPath === 'string') {
    url = originalPath;
  } else if (Array.isArray(originalPath) && originalPath.length > 0) {
    url = originalPath[0];
  }
  
  // 如果 URL 是 /api/api/xxx，说明路径被重复添加了，需要移除一个 /api
  if (url.startsWith('/api/api/')) {
    url = url.replace('/api/api/', '/api/');
  }
  
  // 如果 URL 只是 /api 或 /api/，重定向到健康检查
  if (url === '/api' || url === '/api/') {
    url = '/health';
  }
  
  // 确保 URL 以 / 开头
  if (!url.startsWith('/')) {
    url = '/' + url;
  }
  
  // 添加查询参数
  if (req.query && Object.keys(req.query).length > 0) {
    const queryString = new URLSearchParams(
      req.query as Record<string, string>
    ).toString();
    url = `${url}${url.includes('?') ? '&' : '?'}${queryString}`;
  }
  
  // 准备请求头（排除 Content-Length，让 Fastify 自动计算）
  const headers: Record<string, string> = {};
  Object.keys(req.headers).forEach((key) => {
    const lowerKey = key.toLowerCase();
    // 排除 Content-Length，让 Fastify 根据实际 payload 自动计算
    if (lowerKey === 'content-length') {
      return;
    }
    const value = req.headers[key];
    if (value) {
      headers[key] = Array.isArray(value) ? value[0] : value;
    }
  });
  
  // 处理请求体
  let payload: string | undefined = undefined;
  if (req.body) {
    // 如果 body 已经是字符串，直接使用；如果是对象，转换为 JSON 字符串
    if (typeof req.body === 'string') {
      payload = req.body;
    } else {
      payload = JSON.stringify(req.body);
    }
  }
  
  // 使用 Fastify 的 inject 方法处理请求
  const response = await app.inject({
    method: (req.method || 'GET') as any,
    url: url,
    headers: headers,
    payload: payload,
  });

  // 设置响应状态码
  res.status(response.statusCode);
  
  // 复制响应头（排除一些不需要的头）
  const excludeHeaders = ['content-length', 'transfer-encoding', 'connection'];
  const responseHeaders = response.headers as Record<string, string | string[] | undefined>;
  Object.keys(responseHeaders).forEach((key) => {
    if (!excludeHeaders.includes(key.toLowerCase())) {
      const value = responseHeaders[key];
      if (value) {
        if (typeof value === 'string') {
          res.setHeader(key, value);
        } else if (Array.isArray(value)) {
          res.setHeader(key, value);
        }
      }
    }
  });

  // 发送响应体
  const contentType = responseHeaders['content-type'];
  const contentTypeStr = typeof contentType === 'string' ? contentType : (Array.isArray(contentType) ? contentType[0] : '');
  
  if (contentTypeStr && contentTypeStr.includes('application/json')) {
    try {
      const jsonBody = JSON.parse(response.body);
      res.json(jsonBody);
    } catch {
      res.send(response.body);
    }
  } else {
    res.send(response.body);
  }
}
