# Auth Feature

## 功能概述
用户认证功能，对齐后端 `backend/domains/auth` 领域。

提供用户注册、登录、令牌刷新等功能。

## 后端对齐
- **Backend Domain**: `backend/domains/auth`
- **API Prefix**: `/api/auth`

## 用例
- Register: 用户注册
- Login: 用户登录
- RefreshToken: 刷新令牌
- Logout: 用户登出

## 目录结构
```
auth/
├── README.md
├── usecases.md
├── api/auth.api.ts
├── components/
│   ├── LoginForm.tsx
│   └── RegisterForm.tsx
├── hooks/
│   ├── useLogin.ts
│   └── useRegister.ts
└── stores/auth.store.ts
```

## 使用示例

```typescript
import { useLogin } from '@/features/auth/hooks/useLogin'

function LoginPage() {
  const { login, loading } = useLogin()
  
  const handleSubmit = async (data) => {
    await login(data)
  }
  
  return <LoginForm onSubmit={handleSubmit} loading={loading} />
}
```

