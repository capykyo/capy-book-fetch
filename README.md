# BookFetch - HTML 文章提取 API 服务

基于 Fastify 和 TypeScript 的后端 API 服务，用于从目标网站提取文章内容。

## 功能特性

- 🔐 JWT 认证保护 API 访问
- 🌐 通过 URL 获取目标网站的 HTML 内容
- 📄 提取文章内容（标题、正文、作者、上下页链接）
- ⚡ 基于 Fastify 的高性能 Web 框架
- 🛡️ 完善的错误处理机制

## 技术栈

- **Fastify**: 高性能 Web 框架
- **TypeScript**: 类型安全的 JavaScript
- **@fastify/jwt**: JWT 认证插件
- **axios**: HTTP 客户端
- **cheerio**: HTML 解析和操作

## 快速开始

### 前置要求

- Node.js >= 18
- pnpm >= 8（推荐使用 pnpm 管理依赖）

### 安装依赖

```bash
pnpm install
```

### 配置环境变量

复制 `.env.example` 文件为 `.env` 并修改配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件，设置 JWT 密钥和其他配置：

```env
JWT_SECRET=your-secret-key-change-in-production
PORT=3000
HOST=0.0.0.0
```

### 开发模式运行

```bash
pnpm dev
```

### 生产模式

```bash
# 构建项目
pnpm build

# 运行生产版本
pnpm start
```

## API 文档

### 认证

所有 API 请求需要在请求头中包含 JWT token：

```
Authorization: Bearer <your-jwt-token>
```

**如何获取 JWT Token？**

详细使用说明请参考 [JWT 使用指南](JWT_USAGE.md)

**快速开始：**

1. **通过 API 生成 token（推荐）：**
   ```bash
   curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json"
   ```

2. **使用脚本工具生成：**
   ```bash
   pnpm generate-token
   ```

### 认证相关 API

**POST** `/api/auth/login`

生成 JWT token（用于开发测试）。

**请求体（可选）：**

```json
{
  "userId": "user123",
  "expiresIn": "7d"
}
```

**响应：**

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "7d"
}
```

**GET** `/api/auth/verify`

验证当前 JWT token 是否有效。

**请求头：**

```
Authorization: Bearer <your-jwt-token>
```

**响应：**

```json
{
  "success": true,
  "payload": {
    "userId": "user123",
    "iat": 1234567890
  }
}
```

### 提取文章内容

**POST** `/api/extract`

从指定 URL 提取文章内容。

**请求体：**

```json
{
  "url": "https://example.com/article"
}
```

**成功响应 (200)：**

```json
{
  "success": true,
  "data": {
    "title": "文章标题",
    "content": "文章正文内容",
    "author": "作者名称",
    "prevLink": "https://example.com/prev-article",
    "nextLink": "https://example.com/next-article"
  }
}
```

**错误响应：**

```json
{
  "success": false,
  "error": "错误信息"
}
```

**状态码：**

- `200`: 成功
- `400`: 请求参数错误
- `401`: 未认证或认证失败
- `408`: 请求超时
- `500`: 服务器错误

### 健康检查

**GET** `/health`

检查服务状态。

**响应：**

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 项目结构

```
bookFetch/
├── src/
│   ├── index.ts              # 应用入口
│   ├── routes/
│   │   └── extract.ts        # 文章提取路由
│   ├── middleware/
│   │   └── auth.ts           # JWT 认证中间件
│   ├── services/
│   │   ├── html-fetcher.ts  # HTML 获取服务
│   │   └── content-extractor.ts  # 内容提取服务
│   ├── types/
│   │   └── index.ts          # TypeScript 类型定义
│   └── utils/
│       └── errors.ts         # 错误处理工具
├── package.json
├── tsconfig.json
└── README.md
```

## 内容提取规则

目前内容提取服务使用通用的 HTML 选择器尝试提取内容。对于特定网站，需要分析其 HTML 结构后实现具体的提取规则。

在 `src/services/content-extractor.ts` 中实现针对目标网站的提取逻辑。

## 开发

### 类型检查

```bash
pnpm type-check
```

### 构建

```bash
pnpm build
```

## Postman 测试

项目包含完整的 Postman 测试集合，方便快速测试 API。

### 导入 Postman 集合

1. 打开 Postman
2. 点击 **Import** 按钮
3. 选择 `postman/BookFetch-JWT-API.postman_collection.json` 文件
4. （可选）导入环境配置：`postman/BookFetch-Environment.postman_environment.json`

详细使用说明请参考 [Postman 测试文档](postman/README.md)

### 快速测试流程

1. 启动服务器：`pnpm dev`
2. 在 Postman 中运行 **认证相关** → **1. 生成 JWT Token**
3. Token 会自动保存，后续请求会自动使用
4. 测试 **文章提取** API

## 注意事项

1. **JWT 密钥安全**: 生产环境必须修改默认的 JWT 密钥
2. **内容提取**: 当前提取逻辑为通用实现，针对特定网站需要定制化开发
3. **请求超时**: 默认请求超时时间为 30 秒，可根据需要调整
4. **错误处理**: 所有错误都会返回统一的 JSON 格式响应

## 许可证

ISC

