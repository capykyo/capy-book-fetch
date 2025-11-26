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
  let url = req.url || '/';
  if (req.query && Object.keys(req.query).length > 0) {
    const queryString = new URLSearchParams(
      req.query as Record<string, string>
    ).toString();
    url = `${url}${url.includes('?') ? '&' : '?'}${queryString}`;
  }
  
  // 准备请求头
  const headers: Record<string, string> = {};
  Object.keys(req.headers).forEach((key) => {
    const value = req.headers[key];
    if (value) {
      headers[key] = Array.isArray(value) ? value[0] : value;
    }
  });
  
  // 使用 Fastify 的 inject 方法处理请求
  const response = await app.inject({
    method: (req.method || 'GET') as any,
    url: url,
    headers: headers,
    payload: req.body ? JSON.stringify(req.body) : undefined,
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
