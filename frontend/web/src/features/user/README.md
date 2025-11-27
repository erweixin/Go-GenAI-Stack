# User Feature

## 功能概述
用户资料管理功能，对齐后端 `backend/domains/user` 领域。

提供用户资料查看、更新、修改密码等功能。

## 后端对齐
- **Backend Domain**: `backend/domains/user`
- **API Prefix**: `/api/users`

## 用例
- GetUserProfile: 获取用户资料
- UpdateUserProfile: 更新用户资料
- ChangePassword: 修改密码

## 目录结构
```
user/
├── README.md
├── usecases.md
├── api/user.api.ts
├── components/
│   ├── UserProfile.tsx
│   ├── UserAvatar.tsx
│   └── UserSettings.tsx
├── hooks/
│   └── useUserProfile.ts
└── stores/user.store.ts
```

