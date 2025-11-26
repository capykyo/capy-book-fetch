# JWT Token 使用指南

本指南说明如何生成和使用 JWT token 来访问受保护的 API。

## 方法一：通过 API 端点生成 Token（推荐）

### 1. 生成 Token

启动服务器后，访问登录端点生成 token：

```bash
# 使用默认配置
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json"

# 指定用户 ID 和过期时间
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"userId": "user123", "expiresIn": "30d"}'
```

**响应示例：**

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "7d"
}
```

### 2. 验证 Token

验证 token 是否有效：

```bash
curl -X GET http://localhost:3000/api/auth/verify \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**成功响应：**

```json
{
  "success": true,
  "payload": {
    "userId": "user123",
    "iat": 1234567890
  }
}
```

### 3. 使用 Token 访问受保护的 API

```bash
curl -X POST http://localhost:3000/api/extract \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/article"}'
```

## 方法二：使用脚本工具生成 Token

### 1. 生成 Token

使用项目提供的脚本工具：

```bash
# 使用默认配置
pnpm generate-token

# 指定用户 ID
pnpm generate-token --userId=user123

# 指定过期时间
pnpm generate-token --expiresIn=30d

# 同时指定用户 ID 和过期时间
pnpm generate-token --userId=user123 --expiresIn=30d
```

脚本会输出 token 和使用示例。

### 2. 使用生成的 Token

复制脚本输出的 token，在 API 请求中使用：

```bash
curl -X POST http://localhost:3000/api/extract \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/article"}'
```

## 方法三：在代码中生成 Token

如果需要在自己的代码中生成 token：

```typescript
import { generateToken } from './src/utils/jwt-helper';

// 生成 token
const token = generateToken(
  { userId: 'user123' },
  '7d' // 过期时间
);

console.log('Token:', token);
```

## Token 格式

JWT token 需要在请求头中以 `Bearer` 格式发送：

```
Authorization: Bearer <your-jwt-token>
```

## 过期时间格式

支持以下格式：

- `7d` - 7 天
- `1h` - 1 小时
- `30m` - 30 分钟
- `3600` - 3600 秒

## 常见问题

### Token 无效或过期

如果收到 `401 Unauthorized` 错误：

1. 检查 token 是否正确复制（没有多余空格）
2. 检查 token 是否已过期
3. 确认 `.env` 文件中的 `JWT_SECRET` 与生成 token 时使用的密钥一致

### 如何刷新 Token

当 token 过期时，需要重新生成新的 token：

```bash
# 重新调用登录端点
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json"
```

## 安全建议

1. **生产环境**：不要使用 `/api/auth/login` 端点，应该实现真正的用户认证系统
2. **密钥管理**：确保 `JWT_SECRET` 足够复杂，不要使用默认值
3. **HTTPS**：生产环境必须使用 HTTPS 传输 token
4. **Token 存储**：客户端应安全存储 token（如使用 httpOnly cookie 或安全的本地存储）

## 示例：完整的 API 调用流程

```bash
# 1. 生成 token
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user"}' | jq -r '.token')

# 2. 使用 token 调用 API
curl -X POST http://localhost:3000/api/extract \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/article"}'
```

## 开发环境快速测试

```bash
# 快速生成 token 并测试
pnpm generate-token

# 复制输出的 token，然后测试 API
curl -X POST http://localhost:3000/api/extract \
  -H "Authorization: Bearer <粘贴token>" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

