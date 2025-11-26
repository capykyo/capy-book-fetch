# Vercel 部署指南

本文档说明如何在 Vercel 上部署 BookFetch API 服务，并自动生成生产环境 JWT token。

## 前置准备

1. **Vercel 账号**: 确保已有 Vercel 账号
2. **GitHub 仓库**: 项目已推送到 GitHub
3. **环境变量**: 准备 JWT_SECRET（用于生成和验证 token）

## 部署步骤

### 1. 导入项目到 Vercel

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 **Add New Project**
3. 选择你的 GitHub 仓库
4. 点击 **Import**

### 2. 配置环境变量

在 Vercel 项目设置中添加以下环境变量：

**必需的环境变量：**

- `JWT_SECRET`: JWT 签名密钥（必须设置，用于生成和验证 token）
- `NODE_ENV`: `production`（可选，默认已设置）

**注意：** 项目使用 Node.js 20.x（在 `package.json` 的 `engines` 字段中指定）。如果 Vercel 项目设置中选择了其他 Node.js 版本（如 24.x），会被自动覆盖为 20.x，这是正常行为。

**可选的环境变量：**

- `PORT`: `3000`（Vercel 会自动设置）
- `LOG_LEVEL`: `info`（可选）

**设置步骤：**

1. 在项目设置中点击 **Environment Variables**
2. 添加 `JWT_SECRET`，值为你的密钥（建议使用强随机字符串，至少 32 字符）
3. 选择环境：Production, Preview, Development（建议全部选择）
4. 点击 **Save**

### 3. 配置构建设置

Vercel 会自动检测项目配置，但可以手动设置：

- **Framework Preset**: Other
- **Build Command**: `pnpm build`（会自动执行 token 生成）
- **Output Directory**: 留空（serverless functions 不需要输出目录）
- **Install Command**: `pnpm install`
- **Root Directory**: `./`

**重要**: 项目使用 `api/index.ts` 作为 serverless function 入口，Vercel 会自动识别 `api/` 目录下的文件。

### 4. 部署

1. 点击 **Deploy** 开始部署
2. 等待构建完成
3. 查看构建日志

## 获取生成的 Token

### 方法 1: 从构建日志获取（推荐）

1. 在 Vercel Dashboard 中打开项目
2. 点击最新的部署记录
3. 查看 **Build Logs**
4. 找到以下输出：

```
================================================================================
✅ 生产环境 Token 生成成功!
================================================================================

📋 Token 信息:
有效期: 7 天
生成时间: ...
过期时间: ...

🔑 Token:
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

5. 复制 token 并安全保存

### 方法 2: 使用 Vercel CLI

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 查看部署日志
vercel logs <deployment-url>
```

### 方法 3: 通过 API 获取（如果实现了日志 API）

如果需要在运行时获取 token，可以考虑：
- 将 token 保存到 Vercel 的环境变量（手动设置）
- 或实现一个管理端点（需要额外认证）

## Token 管理

### Token 有效期

- Token 有效期为 **7 天**
- 过期后需要重新部署生成新 token
- 建议在 token 过期前 1-2 天重新部署

### 更新 Token

当 token 即将过期或已过期时：

1. 在 Vercel Dashboard 中触发新的部署
2. 从构建日志中获取新 token
3. 将新 token 提供给 API 用户

### 自动部署触发

如果设置了 GitHub Actions 或其他 CI/CD：

1. 每次推送到主分支会自动触发 Vercel 部署
2. 构建日志中会包含新生成的 token
3. 可以从 GitHub Actions 日志中查看

## 验证部署

### 1. 健康检查

```bash
curl https://your-project.vercel.app/health
```

应返回：

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 2. 测试受保护的 API（使用生成的 token）

```bash
curl -X POST https://your-project.vercel.app/api/extract \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

### 3. 验证登录端点不可用（生产环境）

```bash
curl -X POST https://your-project.vercel.app/api/auth/login
```

应返回 404 或错误（端点在生产环境不可用）。

## 故障排查

### Token 生成失败

**错误**: `JWT_SECRET 环境变量未设置`

**解决**:
1. 检查 Vercel 项目设置中的环境变量
2. 确认 `JWT_SECRET` 已正确设置
3. 重新部署

### Token 验证失败

**错误**: `401 Unauthorized`

**可能原因**:
1. Token 已过期（7 天有效期）
2. Token 复制不完整（包含空格或换行）
3. JWT_SECRET 与生成 token 时不一致

**解决**:
1. 检查 token 是否完整
2. 确认 JWT_SECRET 环境变量正确
3. 重新部署生成新 token

### 构建失败

**检查**:
1. Node.js 版本是否 >= 20.18.1
2. 依赖是否正确安装
3. TypeScript 编译是否有错误

## 安全建议

1. **JWT_SECRET**: 
   - 使用强随机字符串（至少 32 字符）
   - 不要提交到代码仓库
   - 定期轮换（建议每 3-6 个月）

2. **Token 分发**:
   - 通过安全渠道分发 token
   - 不要将 token 提交到代码仓库
   - 使用加密通信传输 token

3. **HTTPS**:
   - Vercel 自动提供 HTTPS
   - 确保所有 API 请求使用 HTTPS

4. **Token 轮换**:
   - 定期（每 7 天）重新部署生成新 token
   - 提前通知用户 token 更新
   - 考虑实现 token 版本管理

## 自动化建议

### GitHub Actions 集成

可以创建 GitHub Actions 工作流，在部署后自动：
1. 从构建日志中提取 token
2. 保存到 GitHub Secrets
3. 或发送到通知系统

### Token 通知

考虑实现：
1. 部署后自动发送 token 到指定邮箱
2. 或保存到密码管理器
3. 或通过安全 API 分发

## 相关文档

- [Vercel 文档](https://vercel.com/docs)
- [环境变量配置](https://vercel.com/docs/concepts/projects/environment-variables)
- [部署日志](https://vercel.com/docs/concepts/deployments/deployment-history)

