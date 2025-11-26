# 部署指南

本文档说明如何部署 BookFetch API 服务。

## 环境说明

### 开发环境
- **JWT 认证**: 已禁用，无需 token 即可访问所有 API
- **登录端点**: `/api/auth/login` 可用，用于测试生成 token
- **环境变量**: `NODE_ENV=development`

### 生产环境
- **JWT 认证**: 已启用，所有受保护 API 需要有效 token
- **登录端点**: `/api/auth/login` 不可用
- **Token 生成**: 通过部署脚本生成，有效期 7 天
- **环境变量**: `NODE_ENV=production`

## 部署前准备

### 1. 生成生产环境 Token

在本地运行：

```bash
pnpm generate-production-token
```

复制生成的 token，这是用户访问 API 所需的认证令牌。

### 2. 配置环境变量

生产环境需要以下环境变量：

```env
NODE_ENV=production
JWT_SECRET=your-secret-key-change-in-production
PORT=3000
HOST=0.0.0.0
LOG_LEVEL=info
```

**重要**: `JWT_SECRET` 必须与生成 token 时使用的密钥一致。

### 3. 构建项目

```bash
pnpm install
pnpm build
```

## 部署流程

### 使用 Docker（推荐）

1. **创建 Dockerfile**:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# 复制依赖文件
COPY package.json pnpm-lock.yaml ./

# 安装 pnpm
RUN npm install -g pnpm

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 构建项目
RUN pnpm build

# 设置生产环境
ENV NODE_ENV=production

# 暴露端口
EXPOSE 3000

# 启动服务
CMD ["pnpm", "start"]
```

2. **构建和运行**:

```bash
docker build -t bookfetch .
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e JWT_SECRET=your-secret-key \
  bookfetch
```

### 使用 PM2

1. **安装 PM2**:

```bash
npm install -g pm2
```

2. **创建 ecosystem.config.js**:

```javascript
module.exports = {
  apps: [{
    name: 'bookfetch',
    script: 'dist/index.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
    }
  }]
};
```

3. **启动服务**:

```bash
pm2 start ecosystem.config.js --env production
```

### 使用 systemd

1. **创建服务文件** `/etc/systemd/system/bookfetch.service`:

```ini
[Unit]
Description=BookFetch API Service
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/bookFetch
Environment="NODE_ENV=production"
Environment="JWT_SECRET=your-secret-key"
ExecStart=/usr/bin/node dist/index.js
Restart=always

[Install]
WantedBy=multi-user.target
```

2. **启动服务**:

```bash
sudo systemctl daemon-reload
sudo systemctl enable bookfetch
sudo systemctl start bookfetch
```

## Token 管理

### Token 生成

生产环境 token 通过以下命令生成：

```bash
pnpm generate-production-token
```

### Token 分发

将生成的 token 安全地提供给 API 用户：

1. 通过安全渠道（加密邮件、密码管理器等）
2. 不要将 token 提交到代码仓库
3. 在文档中说明如何使用 token

### Token 过期处理

- Token 有效期为 7 天
- Token 过期后，需要重新运行 `pnpm generate-production-token` 生成新 token
- 将新 token 提供给用户
- 建议在 token 过期前 1-2 天提前生成新 token

## CI/CD 集成

### GitHub Actions 示例

项目已包含 GitHub Actions 工作流（`.github/workflows/ci.yml`），可以：

1. 运行类型检查
2. 构建项目
3. 运行测试（如果有）

### 部署到服务器

可以使用 GitHub Actions 自动部署：

1. 设置服务器 SSH 密钥为 GitHub Secret
2. 在 Actions 工作流中添加部署步骤
3. 在服务器上设置环境变量
4. 自动拉取代码、构建、重启服务

## 验证部署

### 1. 健康检查

```bash
curl http://your-server:3000/health
```

应返回：

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 2. 测试认证 API（应返回 404 或 403）

```bash
curl -X POST http://your-server:3000/api/auth/login
```

生产环境应返回错误（端点不存在或需要认证）。

### 3. 测试受保护 API（使用生成的 token）

```bash
curl -X POST http://your-server:3000/api/extract \
  -H "Authorization: Bearer YOUR_PRODUCTION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

应成功返回提取的文章内容。

## 监控和日志

### 日志级别

通过 `LOG_LEVEL` 环境变量控制：

- `fatal`: 仅致命错误
- `error`: 错误和致命错误
- `warn`: 警告、错误和致命错误
- `info`: 信息、警告、错误和致命错误（推荐）
- `debug`: 调试信息及以上
- `trace`: 所有日志

### 日志位置

- 开发环境: 控制台输出（使用 pino-pretty）
- 生产环境: 标准输出（可通过重定向保存到文件）

## 故障排查

### Token 无效错误

如果收到 401 错误：

1. 检查 token 是否正确复制（无多余空格）
2. 确认 token 未过期（有效期 7 天）
3. 验证 `JWT_SECRET` 环境变量与生成 token 时一致
4. 检查请求头格式：`Authorization: Bearer <token>`

### 连接错误

1. 确认服务正在运行
2. 检查防火墙设置
3. 验证端口是否正确暴露

### 环境变量问题

1. 确认所有必需的环境变量已设置
2. 检查环境变量值是否正确
3. 重启服务使环境变量生效

## 安全建议

1. **JWT_SECRET**: 使用强随机字符串，长度至少 32 字符
2. **HTTPS**: 生产环境必须使用 HTTPS
3. **Token 存储**: 客户端应安全存储 token
4. **Token 轮换**: 定期（如每 7 天）生成新 token
5. **访问控制**: 考虑实现 IP 白名单或速率限制
6. **日志安全**: 不要在日志中记录敏感信息（如 token）

## 更新部署

1. 拉取最新代码
2. 安装依赖: `pnpm install`
3. 构建项目: `pnpm build`
4. 重启服务（根据部署方式选择相应命令）

