# Postman 测试文档

本目录包含 BookFetch API 的 Postman 测试集合和环境配置。

## 文件说明

- `BookFetch-JWT-API.postman_collection.json` - Postman 测试集合
- `BookFetch-Environment.postman_environment.json` - 开发环境配置
- `BookFetch-Environment-Production.postman_environment.json` - 生产环境配置

## 环境说明

### 开发环境 (NODE_ENV=development)
- ✅ **JWT 认证已禁用** - 无需 token 即可访问所有 API
- ✅ `/api/auth/login` 端点可用 - 可以生成测试 token
- ✅ 所有 API 可直接访问，无需认证

### 生产环境 (NODE_ENV=production)
- 🔒 **JWT 认证已启用** - 所有受保护 API 需要有效 token
- ❌ `/api/auth/login` 端点不可用
- 📝 Token 通过部署脚本生成（`pnpm generate-production-token`），有效期 7 天

## 导入步骤

### 1. 导入测试集合

1. 打开 Postman
2. 点击左上角的 **Import** 按钮
3. 选择 `BookFetch-JWT-API.postman_collection.json` 文件
4. 点击 **Import**

### 2. 导入环境配置

**开发环境：**
1. 点击右上角的环境选择器（齿轮图标）
2. 点击 **Import**
3. 选择 `BookFetch-Environment.postman_environment.json` 文件
4. 点击 **Import**
5. 在环境选择器中选择 **BookFetch Development**

**生产环境（可选）：**
1. 同样方式导入 `BookFetch-Environment-Production.postman_environment.json`
2. 在环境选择器中选择 **BookFetch Production**
3. 更新 `base_url` 为生产服务器地址
4. 设置 `jwt_token` 为生产环境 token（通过部署脚本生成）

## 使用说明

### 开发环境测试

1. **确保服务器运行（开发模式）**
   ```bash
   NODE_ENV=development pnpm dev
   ```

2. **选择开发环境**
   - 在 Postman 环境选择器中选择 **BookFetch Development**

3. **测试 API（无需 token）**
   - 直接运行 **文章提取** → **1. 提取文章内容（开发环境 - 无需认证）**
   - 应该成功返回结果，无需提供 token

4. **生成测试 Token（可选）**
   - 运行 **认证相关** → **1. 生成 JWT Token**
   - Token 会自动保存，但开发环境不需要使用

### 生产环境测试

1. **生成生产环境 Token**
   ```bash
   pnpm generate-production-token
   ```
   复制生成的 token

2. **配置生产环境**
   - 在 Postman 环境选择器中选择 **BookFetch Production**
   - 更新 `base_url` 为生产服务器地址
   - 设置 `jwt_token` 为生成的 token

3. **测试受保护的 API**
   - 运行 **文章提取** → **2. 提取文章内容（生产环境 - 需要认证）**
   - 应该成功返回结果

4. **测试错误场景**
   - 运行 **3. 提取文章内容（生产环境 - 无 Token - 应失败）**
   - 应该返回 401 错误

### 测试集合结构

#### 认证相关
- **1. 生成 JWT Token** - 生成新的 token（仅开发环境可用，会自动保存）
- **2. 验证 JWT Token** - 验证 token 是否有效（开发环境跳过验证）
- **3. 生成 Token（仅用户ID）** - 仅指定用户 ID（仅开发环境可用）
- **4. 生成 Token（自定义过期时间）** - 自定义过期时间（仅开发环境可用）

#### 文章提取
- **1. 提取文章内容（开发环境 - 无需认证）** - 开发环境测试，无需 token
- **2. 提取文章内容（生产环境 - 需要认证）** - 生产环境测试，需要 token
- **3. 提取文章内容（生产环境 - 无 Token - 应失败）** - 测试生产环境未认证的错误
- **4. 提取文章内容（生产环境 - 无效 Token - 应失败）** - 测试生产环境无效 token 的错误

#### 健康检查
- **健康检查** - 检查服务器状态（所有环境都无需认证）

### 环境变量

**开发环境：**
- `base_url` - API 基础 URL（默认：`http://localhost:3000`）
- `jwt_token` - JWT token（可选，开发环境认证已禁用）
- `node_env` - 环境标识（development）

**生产环境：**
- `base_url` - API 基础 URL（需要设置为生产服务器地址）
- `jwt_token` - JWT token（必需，通过部署脚本生成）
- `node_env` - 环境标识（production）

### 修改服务器地址

如果需要测试不同环境的服务器：

1. 在环境变量中修改 `base_url`
2. 或者直接在请求 URL 中修改

### 测试流程建议

**开发环境：**
1. ✅ 健康检查 - 确认服务器运行正常
2. ✅ 提取文章内容（开发环境 - 无需认证） - 测试主要功能
3. ✅ 生成 JWT Token - 测试 token 生成（可选）
4. ✅ 验证 JWT Token - 测试验证端点（开发环境会跳过验证）

**生产环境：**
1. ✅ 健康检查 - 确认服务器运行正常
2. ✅ 提取文章内容（生产环境 - 需要认证） - 使用 token 测试主要功能
3. ✅ 提取文章内容（生产环境 - 无 Token - 应失败） - 验证认证保护
4. ✅ 提取文章内容（生产环境 - 无效 Token - 应失败） - 验证 token 验证

## 注意事项

1. **环境差异**：
   - 开发环境：JWT 认证已禁用，无需 token
   - 生产环境：JWT 认证已启用，需要有效 token
   
2. **登录端点**：
   - 开发环境：`/api/auth/login` 可用
   - 生产环境：`/api/auth/login` 不可用，token 通过部署脚本生成

3. **Token 管理**：
   - 开发环境：Token 自动保存（但不需要使用）
   - 生产环境：Token 通过 `pnpm generate-production-token` 生成，有效期 7 天

4. **环境选择**：确保在 Postman 中选择正确的环境（Development 或 Production）

5. **服务器地址**：生产环境需要更新 `base_url` 为实际服务器地址

## 故障排查

### Token 无效错误（生产环境）

如果收到 401 错误：
1. **确认环境**：检查服务器是否运行在生产模式（NODE_ENV=production）
2. **检查 Token**：确认环境变量 `jwt_token` 已设置且有效
3. **Token 过期**：生产环境 token 有效期 7 天，过期后需要重新生成
4. **重新生成**：运行 `pnpm generate-production-token` 生成新 token

**注意**：开发环境不会出现此错误，因为认证已禁用

### 连接错误

如果无法连接到服务器：
1. 确认服务器正在运行（`pnpm dev`）
2. 检查 `base_url` 是否正确
3. 检查防火墙设置

## 扩展测试

你可以根据需要添加更多测试用例：

1. 测试不同的 URL
2. 测试边界情况
3. 测试性能
4. 添加更多断言

