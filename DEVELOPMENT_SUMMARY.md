# BookFetch 项目开发总结

## 项目概述

BookFetch 是一个基于 Fastify + TypeScript 的 API 服务，用于从目标网站提取文章内容。项目支持 JWT 认证，并已部署到 Vercel。

## 主要功能

1. **文章内容提取** - 从指定 URL 提取文章标题、正文、作者等信息
2. **JWT 认证** - 开发环境跳过认证，生产环境需要有效 token
3. **专用网站支持** - 针对 quanben.io 实现了专门的提取规则
4. **Vercel 部署** - 支持 serverless 函数部署

---

## 遇到的问题与解决方案

### 1. 环境差异的 JWT 认证实现

**问题描述：**
- 开发环境需要跳过 JWT 认证以便快速开发
- 生产环境需要严格的 JWT 认证保护
- 生产环境 token 需要在部署时自动生成（7天有效期）

**难点：**
- 如何在同一个代码库中实现环境差异化的认证逻辑
- 如何在 Vercel 部署时自动生成 token 并输出到构建日志

**解决方案：**

#### 1.1 中间件条件判断
```typescript
// src/middleware/auth.ts
export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // 开发环境跳过认证
  if (process.env.NODE_ENV === 'development') {
    return;
  }
  // 生产环境验证 token
  // ...
}
```

#### 1.2 路由条件注册
```typescript
// src/routes/auth.ts
export async function authRoutes(fastify: FastifyInstance) {
  // 仅开发环境注册登录端点
  if (process.env.NODE_ENV === 'development') {
    fastify.post('/api/auth/login', { /* ... */ });
  }
}
```

#### 1.3 自动生成生产 Token
- 创建 `scripts/generate-token-on-build.ts` 脚本
- 在 `package.json` 中添加 `postbuild` 钩子
- 脚本检测 Vercel 环境并生成 token，输出到构建日志

**关键文件：**
- `src/middleware/auth.ts` - 认证中间件
- `src/routes/auth.ts` - 认证路由
- `scripts/generate-token-on-build.ts` - 生产 token 生成脚本

---

### 2. Vercel Serverless 函数适配

**问题描述：**
- Fastify 应用需要适配为 Vercel serverless function
- Vercel 的请求/响应格式与 Fastify 不同
- 需要处理路由重写和函数入口

**难点：**
- 如何将 Fastify 应用封装为 serverless function
- 如何处理 Vercel 的请求格式转换
- 如何确保应用实例复用（避免冷启动问题）

**解决方案：**

#### 2.1 应用实例封装
```typescript
// src/app.ts
export function createApp(): FastifyInstance {
  // 创建 Fastify 应用实例
  // 用于本地开发和 Vercel
}

// api/index.ts
let appInstance: ReturnType<typeof createApp> | null = null;

function getApp() {
  if (!appInstance) {
    appInstance = createApp();
  }
  return appInstance;
}
```

#### 2.2 请求格式转换
```typescript
// api/index.ts
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const app = getApp();
  await app.ready();
  
  // 转换 Vercel 请求为 Fastify inject 格式
  const response = await app.inject({
    method: req.method || 'GET',
    url: req.url,
    headers: headers,
    payload: payload,
  });
  
  // 转换 Fastify 响应为 Vercel 格式
  res.status(response.statusCode);
  res.json(JSON.parse(response.body));
}
```

#### 2.3 Vercel 配置
```json
// vercel.json
{
  "functions": {
    "api/index.ts": {
      "runtime": "nodejs20.x"
    }
  },
  "rewrites": [
    { "source": "/(.*)", "destination": "/api/index" }
  ]
}
```

**关键文件：**
- `api/index.ts` - Vercel serverless function 入口
- `src/app.ts` - Fastify 应用创建函数
- `vercel.json` - Vercel 部署配置

---

### 3. 请求体 Content-Length 不匹配错误

**问题描述：**
- 在 Vercel 上测试 POST 请求时返回 400 错误
- 错误信息：`Request body size did not match Content-Length`
- 本地开发正常，Vercel 部署后失败

**难点：**
- Vercel 可能已经解析了请求体（JSON 对象）
- 原始 Content-Length 头与实际 body 大小不匹配
- Fastify 的 inject 方法会验证 Content-Length

**解决方案：**

#### 3.1 移除 Content-Length 头
```typescript
// api/index.ts
const headers: Record<string, string> = {};
Object.keys(req.headers).forEach((key) => {
  const lowerKey = key.toLowerCase();
  // 排除 Content-Length，让 Fastify 自动计算
  if (lowerKey === 'content-length') {
    return;
  }
  // ...
});
```

#### 3.2 智能处理请求体
```typescript
// api/index.ts
let payload: string | undefined = undefined;
if (req.body) {
  // 如果 body 已经是字符串，直接使用
  // 如果是对象，转换为 JSON 字符串
  if (typeof req.body === 'string') {
    payload = req.body;
  } else {
    payload = JSON.stringify(req.body);
  }
}
```

#### 3.3 配置 Fastify bodyLimit
```typescript
// src/app.ts
const fastify = Fastify({
  bodyLimit: 1048576, // 1MB
  // ...
});
```

**关键文件：**
- `api/index.ts` - 请求体处理逻辑
- `src/app.ts` - Fastify 配置

---

### 4. quanben.io 网站内容提取

**问题描述：**
- 需要为 quanben.io 实现专门的提取规则
- 提取字段包括：书名、描述、章节标题、正文（保留段落结构）、上一页/下一页链接
- URL 格式：`https://quanben.io/n/{book-id}/{chapter-number}.html`

**难点：**
- HTML 结构复杂，包含广告和脚本标签
- 需要智能处理上一页链接（第一章可能没有链接）
- 需要保留段落结构（用换行符分隔）
- 需要过滤广告内容

**解决方案：**

#### 4.1 创建专用提取器
```typescript
// src/services/extractors/quanben-extractor.ts
export function isQuanbenUrl(url: string): boolean {
  return QUANBEN_URL_PATTERN.test(url);
}

export async function extractQuanbenContent(
  html: string,
  url: string
): Promise<ExtractResult> {
  const $ = cheerio.load(html);
  
  // 提取各个字段
  const description = $('meta[name="description"]').attr('content') || '';
  const bookName = $('div.name').text().trim() || '';
  const title = $('h1.headline[itemprop="headline"]').text().trim() || '';
  
  // 提取正文（保留段落结构）
  const paragraphs: string[] = [];
  $('#content').find('p').each((_, element) => {
    const $p = $(element);
    // 过滤广告
    if ($p.closest('.ads').length === 0) {
      const text = $p.text().trim();
      if (text) {
        paragraphs.push(text);
      }
    }
  });
  const content = paragraphs.join('\n');
  
  // 智能处理上一页链接
  let prevLink: string | null = null;
  const firstSpanLink = $('.list_page span').first().find('a').first();
  if (firstSpanLink.length > 0) {
    // 有直接链接
    prevLink = new URL(firstSpanLink.attr('href')!, baseUrl).href;
  } else {
    // 计算上一页（如果章节号 > 1）
    const urlMatch = url.match(/\/n\/([^\/]+)\/(\d+)\.html$/);
    if (urlMatch) {
      const currentChapter = parseInt(urlMatch[2], 10);
      if (currentChapter > 1) {
        const prevChapter = currentChapter - 1;
        prevLink = new URL(`/n/${urlMatch[1]}/${prevChapter}.html`, baseUrl).href;
      }
    }
  }
  
  // 提取下一页链接
  const nextLink = $('.list_page a[rel="next"]').first().attr('href');
  // ...
}
```

#### 4.2 提取器路由
```typescript
// src/services/content-extractor.ts
export async function extractContent(
  html: string,
  url: string
): Promise<ExtractResult> {
  // 根据 URL 选择提取器
  if (isQuanbenUrl(url)) {
    return extractQuanbenContent(html, url);
  }
  
  // 通用提取逻辑
  // ...
}
```

**关键文件：**
- `src/services/extractors/quanben-extractor.ts` - quanben.io 专用提取器
- `src/services/content-extractor.ts` - 提取器路由
- `src/types/index.ts` - 类型定义（添加了 bookName 和 description）

---

### 5. Node.js 版本兼容性问题

**问题描述：**
- `cheerio` 包要求 Node.js >= 20.18.1
- GitHub Actions CI 使用 Node.js 18，导致构建失败
- Vercel 默认使用 Node.js 24，但项目需要 20.x

**难点：**
- 需要统一 Node.js 版本要求
- 确保 CI/CD 和部署环境版本一致

**解决方案：**

#### 5.1 更新 package.json
```json
{
  "engines": {
    "node": ">=20.18.1 <21.0.0",
    "pnpm": ">=8.0.0"
  }
}
```

#### 5.2 更新 GitHub Actions
```yaml
# .github/workflows/ci.yml
jobs:
  type-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
```

#### 5.3 Vercel 配置
```json
// vercel.json
{
  "functions": {
    "api/index.ts": {
      "runtime": "nodejs20.x"
    }
  }
}
```

**关键文件：**
- `package.json` - engines 字段
- `.github/workflows/ci.yml` - CI 配置
- `vercel.json` - Vercel 运行时配置

---

### 6. JWT Payload 返回为空

**问题描述：**
- `/api/auth/verify` 端点返回的 payload 为空对象 `{}`
- Token 验证成功，但无法获取 payload 内容

**难点：**
- Fastify JWT 插件的 payload 存储位置
- JSON Schema 可能过滤了未定义的属性

**解决方案：**

#### 6.1 配置 JWT 插件
```typescript
// src/app.ts
fastify.register(jwt, {
  secret: process.env.JWT_SECRET || 'your-secret-key',
  decode: { complete: false }, // 确保只返回 payload
});
```

#### 6.2 改进 Payload 获取
```typescript
// src/routes/auth.ts
async (request: FastifyRequest, reply: FastifyReply) => {
  const decoded = (request as any).user;
  const payload = decoded || (request as any).jwtPayload || {};
  return reply.status(200).send({
    success: true,
    payload: payload,
  });
}
```

#### 6.3 更新响应 Schema
```typescript
// src/routes/auth.ts
schema: {
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        payload: { type: 'object' },
      },
      additionalProperties: true, // 允许额外属性
    },
  },
}
```

**关键文件：**
- `src/app.ts` - JWT 插件配置
- `src/routes/auth.ts` - 验证端点

---

### 7. Postman 测试集合格式错误

**问题描述：**
- Postman 集合 JSON 文件格式错误
- 存在重复的测试用例项
- JSON 解析失败

**难点：**
- 在编辑过程中引入了重复内容
- JSON 结构不完整

**解决方案：**

#### 7.1 验证 JSON 格式
```bash
node -e "JSON.parse(require('fs').readFileSync('postman/BookFetch-JWT-API.postman_collection.json', 'utf8'))"
```

#### 7.2 删除重复项
- 识别并删除重复的测试用例
- 确保 JSON 结构完整

#### 7.3 更新测试集合
- 添加 quanben.io 专用测试用例
- 更新响应格式说明
- 添加 URL 格式验证说明

**关键文件：**
- `postman/BookFetch-JWT-API.postman_collection.json` - Postman 集合
- `postman/README.md` - 测试文档

---

## 技术栈总结

### 核心框架
- **Fastify** - 高性能 Web 框架
- **TypeScript** - 类型安全
- **Cheerio** - HTML 解析和提取

### 认证
- **@fastify/jwt** - JWT 认证插件
- **jsonwebtoken** - Token 生成工具

### 部署
- **Vercel** - Serverless 函数部署
- **GitHub Actions** - CI/CD 流程

### 工具
- **pnpm** - 包管理器
- **tsx** - TypeScript 执行工具
- **Postman** - API 测试

---

## 项目结构

```
bookFetch/
├── api/
│   └── index.ts              # Vercel serverless function 入口
├── src/
│   ├── app.ts                # Fastify 应用创建
│   ├── index.ts              # 本地开发入口
│   ├── middleware/
│   │   └── auth.ts           # JWT 认证中间件
│   ├── routes/
│   │   ├── auth.ts           # 认证路由
│   │   └── extract.ts        # 文章提取路由
│   ├── services/
│   │   ├── content-extractor.ts      # 提取器路由
│   │   ├── extractors/
│   │   │   └── quanben-extractor.ts  # quanben.io 提取器
│   │   └── html-fetcher.ts           # HTML 获取服务
│   ├── types/
│   │   └── index.ts          # 类型定义
│   └── utils/
│       ├── errors.ts         # 错误处理
│       └── jwt-helper.ts     # JWT 工具函数
├── scripts/
│   ├── generate-token.ts              # 开发 token 生成
│   ├── generate-production-token.ts   # 生产 token 生成
│   └── generate-token-on-build.ts     # 构建时 token 生成
├── postman/                  # Postman 测试集合
├── vercel.json               # Vercel 配置
└── package.json
```

---

## 经验总结

### 1. 环境差异化处理
- 使用 `process.env.NODE_ENV` 区分开发和生产环境
- 在中间件和路由中实现条件逻辑
- 确保开发体验和生产安全性的平衡

### 2. Serverless 函数适配
- 使用 Fastify 的 `inject` 方法适配 serverless 环境
- 注意请求/响应格式转换
- 实现应用实例复用以减少冷启动

### 3. 请求体处理
- 在 serverless 环境中，注意 Content-Length 头的处理
- 让框架自动计算 Content-Length 更安全
- 智能处理已解析和未解析的请求体

### 4. 专用提取器设计
- 为特定网站创建专用提取器
- 使用提取器路由模式，便于扩展
- 保留原始内容结构（如段落分隔）

### 5. 版本管理
- 明确指定 Node.js 版本要求
- 确保 CI/CD 和部署环境版本一致
- 使用 engines 字段声明依赖

### 6. 测试文档
- 提供完整的 Postman 测试集合
- 区分开发和生产环境的测试用例
- 包含详细的错误场景测试

---

## 后续优化建议

1. **缓存机制** - 对提取的内容进行缓存，减少重复请求
2. **更多网站支持** - 扩展提取器支持更多小说网站
3. **错误重试** - 实现请求失败时的自动重试机制
4. **限流保护** - 添加 API 限流，防止滥用
5. **监控和日志** - 集成监控服务，跟踪 API 使用情况
6. **单元测试** - 为提取器添加单元测试
7. **性能优化** - 优化 HTML 解析性能，支持大文件

---

## 参考资料

- [Fastify 文档](https://www.fastify.io/)
- [Vercel Serverless Functions](https://vercel.com/docs/functions)
- [Cheerio 文档](https://cheerio.js.org/)
- [JWT 规范](https://jwt.io/)

---

**项目完成时间：** 2025-01-26  
**主要开发者：** AI Assistant + User  
**部署状态：** ✅ 已部署到 Vercel

