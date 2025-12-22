/**
 * 数据库类型定义
 * 根据 backend/database/schema.sql 定义的类型
 *
 * 注意：这是手动定义的类型，未来可以使用工具从 Schema 自动生成
 */

export interface Database {
  users: {
    id: string;
    email: string;
    username: string | null;
    password_hash: string;
    full_name: string | null;
    avatar_url: string | null;
    status: 'active' | 'inactive' | 'banned';
    email_verified: boolean;
    created_at: Date;
    updated_at: Date;
    last_login_at: Date | null;
  };
  tasks: {
    id: string;
    user_id: string | null;
    title: string;
    description: string | null;
    status: 'pending' | 'in_progress' | 'completed';
    priority: 'low' | 'medium' | 'high';
    due_date: Date | null;
    created_at: Date;
    updated_at: Date;
    completed_at: Date | null;
  };
  task_tags: {
    task_id: string;
    tag_name: string;
    tag_color: string | null;
  };
}
