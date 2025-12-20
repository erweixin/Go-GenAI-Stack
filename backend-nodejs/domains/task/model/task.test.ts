/**
 * Task Model 单元测试
 */

import { describe, it, expect } from 'vitest';
import { Task } from './task.js';

describe('Task Model', () => {
  describe('create', () => {
    it('应该创建有效任务', () => {
      const task = Task.create('user-123', 'Test Task', 'Test Description', 'medium');

      expect(task.id).toBeDefined();
      expect(task.title).toBe('Test Task');
      expect(task.description).toBe('Test Description');
      expect(task.priority).toBe('medium');
      expect(task.status).toBe('pending');
      expect(task.tags).toEqual([]);
      expect(task.dueDate).toBeNull();
      expect(task.completedAt).toBeNull();
      expect(task.createdAt).toBeInstanceOf(Date);
      expect(task.updatedAt).toBeInstanceOf(Date);
    });

    it('应该拒绝空标题', () => {
      expect(() => {
        Task.create('user-123', '', 'Description', 'medium');
      }).toThrow('TASK_TITLE_EMPTY');
    });

    it('应该拒绝标题过长', () => {
      const longTitle = 'a'.repeat(201);
      expect(() => {
        Task.create('user-123', longTitle, 'Description', 'medium');
      }).toThrow('TASK_TITLE_TOO_LONG');
    });

    it('应该拒绝描述过长', () => {
      const longDescription = 'a'.repeat(5001);
      expect(() => {
        Task.create('user-123', 'Title', longDescription, 'medium');
      }).toThrow('TASK_DESCRIPTION_TOO_LONG');
    });

    it('应该拒绝无效优先级', () => {
      expect(() => {
        Task.create('user-123', 'Title', 'Description', 'invalid' as any);
      }).toThrow('INVALID_PRIORITY');
    });

    it('应该接受空描述', () => {
      const task = Task.create('user-123', 'Test Task', '', 'medium');
      expect(task.description).toBe('');
    });

    it('应该接受最大长度标题', () => {
      const maxTitle = 'a'.repeat(200);
      const task = Task.create('user-123', maxTitle, 'Description', 'medium');
      expect(task.title).toBe(maxTitle);
    });

    it('应该接受最大长度描述', () => {
      const maxDescription = 'a'.repeat(5000);
      const task = Task.create('user-123', 'Title', maxDescription, 'medium');
      expect(task.description).toBe(maxDescription);
    });

    it('应该接受不同优先级', () => {
      const lowTask = Task.create('user-123', 'Low', 'Desc', 'low');
      expect(lowTask.priority).toBe('low');

      const highTask = Task.create('user-123', 'High', 'Desc', 'high');
      expect(highTask.priority).toBe('high');
    });
  });

  describe('update', () => {
    it('应该更新待处理任务', async () => {
      const task = Task.create('user-123', 'Original', 'Original Desc', 'low');
      const oldUpdatedAt = task.updatedAt;

      // 等待一小段时间以确保时间戳不同
      await new Promise((resolve) => setTimeout(resolve, 10));

      task.update('Updated Title', 'Updated Description', 'high');

      expect(task.title).toBe('Updated Title');
      expect(task.description).toBe('Updated Description');
      expect(task.priority).toBe('high');
      expect(task.updatedAt.getTime()).toBeGreaterThan(oldUpdatedAt.getTime());
    });

    it('应该拒绝更新已完成任务', () => {
      const task = Task.create('user-123', 'Test', 'Desc', 'medium');
      task.complete();

      expect(() => {
        task.update('New Title', 'New Desc', 'high');
      }).toThrow('TASK_ALREADY_COMPLETED');
    });

    it('应该拒绝更新标题为空', () => {
      const task = Task.create('user-123', 'Test', 'Desc', 'medium');

      expect(() => {
        task.update('', 'Desc', 'medium');
      }).toThrow('TASK_TITLE_EMPTY');
    });

    it('应该拒绝更新标题过长', () => {
      const task = Task.create('user-123', 'Test', 'Desc', 'medium');
      const longTitle = 'a'.repeat(201);

      expect(() => {
        task.update(longTitle, 'Desc', 'medium');
      }).toThrow('TASK_TITLE_TOO_LONG');
    });

    it('应该拒绝更新描述过长', () => {
      const task = Task.create('user-123', 'Test', 'Desc', 'medium');
      const longDescription = 'a'.repeat(5001);

      expect(() => {
        task.update('Test', longDescription, 'medium');
      }).toThrow('TASK_DESCRIPTION_TOO_LONG');
    });

    it('应该拒绝无效优先级', () => {
      const task = Task.create('user-123', 'Test', 'Desc', 'medium');

      expect(() => {
        task.update('Test', 'Desc', 'invalid' as any);
      }).toThrow('INVALID_PRIORITY');
    });
  });

  describe('complete', () => {
    it('应该完成待处理任务', async () => {
      const task = Task.create('user-123', 'Test', 'Desc', 'medium');
      const oldUpdatedAt = task.updatedAt;

      await new Promise((resolve) => setTimeout(resolve, 10));

      task.complete();

      expect(task.status).toBe('completed');
      expect(task.completedAt).toBeInstanceOf(Date);
      expect(task.updatedAt.getTime()).toBeGreaterThan(oldUpdatedAt.getTime());
    });

    it('应该完成进行中任务', () => {
      const task = Task.create('user-123', 'Test', 'Desc', 'medium');
      task.status = 'in_progress';

      task.complete();

      expect(task.status).toBe('completed');
      expect(task.completedAt).toBeInstanceOf(Date);
    });

    it('应该拒绝重复完成已完成任务', () => {
      const task = Task.create('user-123', 'Test', 'Desc', 'medium');
      task.complete();

      expect(() => {
        task.complete();
      }).toThrow('TASK_ALREADY_COMPLETED');
    });
  });

  describe('setDueDate', () => {
    it('应该设置未来日期', async () => {
      const task = Task.create('user-123', 'Test', 'Desc', 'medium');
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 明天
      const oldUpdatedAt = task.updatedAt;

      await new Promise((resolve) => setTimeout(resolve, 10));

      task.setDueDate(futureDate);

      expect(task.dueDate).toBeInstanceOf(Date);
      expect(task.dueDate!.getTime()).toBeCloseTo(futureDate.getTime(), -3);
      expect(task.updatedAt.getTime()).toBeGreaterThan(oldUpdatedAt.getTime());
    });

    it('应该拒绝设置过去日期', () => {
      const task = Task.create('user-123', 'Test', 'Desc', 'medium');
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 昨天

      expect(() => {
        task.setDueDate(pastDate);
      }).toThrow('INVALID_DUE_DATE');
    });
  });

  describe('addTag', () => {
    it('应该添加有效标签', async () => {
      const task = Task.create('user-123', 'Test', 'Desc', 'medium');
      const oldUpdatedAt = task.updatedAt;

      await new Promise((resolve) => setTimeout(resolve, 10));

      task.addTag({ name: 'test', color: '#ff0000' });

      expect(task.tags).toHaveLength(1);
      expect(task.tags[0].name).toBe('test');
      expect(task.tags[0].color).toBe('#ff0000');
      expect(task.updatedAt.getTime()).toBeGreaterThan(oldUpdatedAt.getTime());
    });

    it('应该拒绝添加空名称标签', () => {
      const task = Task.create('user-123', 'Test', 'Desc', 'medium');

      expect(() => {
        task.addTag({ name: '', color: '#ff0000' });
      }).toThrow('TAG_NAME_EMPTY');
    });

    it('应该拒绝添加重复标签', () => {
      const task = Task.create('user-123', 'Test', 'Desc', 'medium');
      task.addTag({ name: 'test', color: '#ff0000' });

      expect(() => {
        task.addTag({ name: 'test', color: '#00ff00' });
      }).toThrow('DUPLICATE_TAG');
    });

    it('应该拒绝添加过多标签', () => {
      const task = Task.create('user-123', 'Test', 'Desc', 'medium');

      // 添加 10 个标签
      for (let i = 0; i < 10; i++) {
        task.addTag({ name: `tag${i}`, color: '#ff0000' });
      }

      // 尝试添加第 11 个标签
      expect(() => {
        task.addTag({ name: 'tag11', color: '#ff0000' });
      }).toThrow('TOO_MANY_TAGS');
    });

    it('应该添加多个不同标签', () => {
      const task = Task.create('user-123', 'Test', 'Desc', 'medium');

      task.addTag({ name: 'urgent', color: '#ff0000' });
      task.addTag({ name: 'important', color: '#00ff00' });
      task.addTag({ name: 'project-alpha', color: '#0000ff' });

      expect(task.tags).toHaveLength(3);
      expect(task.tags[0].name).toBe('urgent');
      expect(task.tags[1].name).toBe('important');
      expect(task.tags[2].name).toBe('project-alpha');
    });
  });

  describe('removeTag', () => {
    it('应该移除存在的标签', async () => {
      const task = Task.create('user-123', 'Test', 'Desc', 'medium');
      task.addTag({ name: 'test1', color: '#ff0000' });
      task.addTag({ name: 'test2', color: '#00ff00' });
      task.addTag({ name: 'test3', color: '#0000ff' });

      const oldUpdatedAt = task.updatedAt;
      await new Promise((resolve) => setTimeout(resolve, 10));

      task.removeTag('test2');

      expect(task.tags).toHaveLength(2);
      expect(task.tags[0].name).toBe('test1');
      expect(task.tags[1].name).toBe('test3');
      expect(task.updatedAt.getTime()).toBeGreaterThan(oldUpdatedAt.getTime());
    });

    it('应该移除不存在的标签时不报错', () => {
      const task = Task.create('user-123', 'Test', 'Desc', 'medium');
      task.addTag({ name: 'test', color: '#ff0000' });

      task.removeTag('nonexistent');

      expect(task.tags).toHaveLength(1);
      expect(task.tags[0].name).toBe('test');
    });

    it('应该移除所有标签', () => {
      const task = Task.create('user-123', 'Test', 'Desc', 'medium');
      task.addTag({ name: 'test1', color: '#ff0000' });
      task.addTag({ name: 'test2', color: '#00ff00' });

      task.removeTag('test1');
      task.removeTag('test2');

      expect(task.tags).toHaveLength(0);
    });
  });

  describe('complete preserves data', () => {
    it('应该保留其他数据', () => {
      const task = Task.create('user-123', 'Test Task', 'Test Description', 'high');
      const dueDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      task.setDueDate(dueDate);
      task.addTag({ name: 'urgent', color: '#ff0000' });

      task.complete();

      expect(task.title).toBe('Test Task');
      expect(task.description).toBe('Test Description');
      expect(task.priority).toBe('high');
      expect(task.dueDate).toBeInstanceOf(Date);
      expect(task.tags).toHaveLength(1);
      expect(task.status).toBe('completed');
    });
  });

  describe('update preserves status', () => {
    it('应该保留状态（如果未完成）', () => {
      const task = Task.create('user-123', 'Test', 'Desc', 'low');
      task.status = 'in_progress';

      task.update('Updated', 'Updated Desc', 'high');

      expect(task.status).toBe('in_progress');
      expect(task.title).toBe('Updated');
    });
  });
});

