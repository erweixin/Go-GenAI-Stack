package model

import (
	"fmt"
	"strings"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestNewTask 测试任务创建
func TestNewTask(t *testing.T) {
	tests := []struct {
		name        string
		title       string
		description string
		priority    Priority
		wantErr     error
	}{
		{
			name:        "创建有效任务",
			title:       "Test Task",
			description: "Test Description",
			priority:    PriorityMedium,
			wantErr:     nil,
		},
		{
			name:        "标题为空",
			title:       "",
			description: "Description",
			priority:    PriorityMedium,
			wantErr:     ErrTaskTitleEmpty,
		},
		{
			name:        "标题过长",
			title:       strings.Repeat("a", 201),
			description: "Description",
			priority:    PriorityMedium,
			wantErr:     fmt.Errorf("TASK_TITLE_TOO_LONG"),
		},
		{
			name:        "描述过长",
			title:       "Test Task",
			description: strings.Repeat("a", 5001),
			priority:    PriorityMedium,
			wantErr:     fmt.Errorf("TASK_DESCRIPTION_TOO_LONG"),
		},
		{
			name:        "无效优先级",
			title:       "Test Task",
			description: "Description",
			priority:    Priority("invalid"),
			wantErr:     ErrInvalidPriority,
		},
		{
			name:        "低优先级",
			title:       "Low Priority Task",
			description: "Description",
			priority:    PriorityLow,
			wantErr:     nil,
		},
		{
			name:        "高优先级",
			title:       "High Priority Task",
			description: "Description",
			priority:    PriorityHigh,
			wantErr:     nil,
		},
		{
			name:        "空描述允许",
			title:       "Test Task",
			description: "",
			priority:    PriorityMedium,
			wantErr:     nil,
		},
		{
			name:        "标题最大长度",
			title:       strings.Repeat("a", 200),
			description: "Description",
			priority:    PriorityMedium,
			wantErr:     nil,
		},
		{
			name:        "描述最大长度",
			title:       "Test Task",
			description: strings.Repeat("a", 5000),
			priority:    PriorityMedium,
			wantErr:     nil,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			task, err := NewTask("test-user-id", tt.title, tt.description, tt.priority)

			if tt.wantErr != nil {
				require.Error(t, err)
				assert.Contains(t, err.Error(), tt.wantErr.Error())
				assert.Nil(t, task)
			} else {
				require.NoError(t, err)
				require.NotNil(t, task)

				// 验证任务属性
				assert.NotEmpty(t, task.ID, "任务 ID 应该被生成")
				assert.Equal(t, tt.title, task.Title)
				assert.Equal(t, tt.description, task.Description)
				assert.Equal(t, tt.priority, task.Priority)
				assert.Equal(t, StatusPending, task.Status, "新任务状态应该是 pending")
				assert.NotNil(t, task.Tags, "Tags 应该被初始化")
				assert.Empty(t, task.Tags, "新任务不应该有标签")
				assert.Nil(t, task.DueDate, "新任务不应该有截止日期")
				assert.Nil(t, task.CompletedAt, "新任务不应该有完成时间")
				assert.WithinDuration(t, time.Now(), task.CreatedAt, time.Second, "创建时间应该是当前时间")
				assert.WithinDuration(t, time.Now(), task.UpdatedAt, time.Second, "更新时间应该是当前时间")
			}
		})
	}
}

// TestTask_Update 测试任务更新
func TestTask_Update(t *testing.T) {
	tests := []struct {
		name        string
		taskSetup   func() *Task
		updateTitle string
		updateDesc  string
		updatePrio  Priority
		wantErr     error
	}{
		{
			name: "更新待处理任务",
			taskSetup: func() *Task {
				task, _ := NewTask("test-user-id", "Original", "Original Desc", PriorityLow)
				return task
			},
			updateTitle: "Updated Title",
			updateDesc:  "Updated Description",
			updatePrio:  PriorityHigh,
			wantErr:     nil,
		},
		{
			name: "更新已完成任务",
			taskSetup: func() *Task {
				task, _ := NewTask("test-user-id", "Test", "Desc", PriorityMedium)
				task.Complete()
				return task
			},
			updateTitle: "New Title",
			updateDesc:  "New Desc",
			updatePrio:  PriorityHigh,
			wantErr:     ErrTaskAlreadyCompleted,
		},
		{
			name: "更新标题为空",
			taskSetup: func() *Task {
				task, _ := NewTask("test-user-id", "Test", "Desc", PriorityMedium)
				return task
			},
			updateTitle: "",
			updateDesc:  "Desc",
			updatePrio:  PriorityMedium,
			wantErr:     ErrTaskTitleEmpty,
		},
		{
			name: "更新标题过长",
			taskSetup: func() *Task {
				task, _ := NewTask("test-user-id", "Test", "Desc", PriorityMedium)
				return task
			},
			updateTitle: strings.Repeat("a", 201),
			updateDesc:  "Desc",
			updatePrio:  PriorityMedium,
			wantErr:     fmt.Errorf("TASK_TITLE_TOO_LONG"),
		},
		{
			name: "更新描述过长",
			taskSetup: func() *Task {
				task, _ := NewTask("test-user-id", "Test", "Desc", PriorityMedium)
				return task
			},
			updateTitle: "Test",
			updateDesc:  strings.Repeat("a", 5001),
			updatePrio:  PriorityMedium,
			wantErr:     fmt.Errorf("TASK_DESCRIPTION_TOO_LONG"),
		},
		{
			name: "更新优先级无效",
			taskSetup: func() *Task {
				task, _ := NewTask("test-user-id", "Test", "Desc", PriorityMedium)
				return task
			},
			updateTitle: "Test",
			updateDesc:  "Desc",
			updatePrio:  Priority("invalid"),
			wantErr:     ErrInvalidPriority,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			task := tt.taskSetup()
			oldUpdatedAt := task.UpdatedAt

			// 等待一小段时间以确保时间戳不同
			time.Sleep(time.Millisecond)

			err := task.Update(tt.updateTitle, tt.updateDesc, tt.updatePrio)

			if tt.wantErr != nil {
				require.Error(t, err)
				assert.Contains(t, err.Error(), tt.wantErr.Error())
			} else {
				require.NoError(t, err)
				assert.Equal(t, tt.updateTitle, task.Title)
				assert.Equal(t, tt.updateDesc, task.Description)
				assert.Equal(t, tt.updatePrio, task.Priority)
				assert.True(t, task.UpdatedAt.After(oldUpdatedAt), "更新时间应该更新")
			}
		})
	}
}

// TestTask_Complete 测试任务完成
func TestTask_Complete(t *testing.T) {
	tests := []struct {
		name      string
		taskSetup func() *Task
		wantErr   error
	}{
		{
			name: "完成待处理任务",
			taskSetup: func() *Task {
				task, _ := NewTask("test-user-id", "Test", "Desc", PriorityMedium)
				return task
			},
			wantErr: nil,
		},
		{
			name: "完成进行中任务",
			taskSetup: func() *Task {
				task, _ := NewTask("test-user-id", "Test", "Desc", PriorityMedium)
				task.Status = StatusInProgress
				return task
			},
			wantErr: nil,
		},
		{
			name: "重复完成已完成任务",
			taskSetup: func() *Task {
				task, _ := NewTask("test-user-id", "Test", "Desc", PriorityMedium)
				task.Complete()
				return task
			},
			wantErr: ErrTaskAlreadyCompleted,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			task := tt.taskSetup()
			originalStatus := task.Status
			oldUpdatedAt := task.UpdatedAt

			time.Sleep(time.Millisecond)

			err := task.Complete()

			if tt.wantErr != nil {
				require.Error(t, err)
				assert.ErrorIs(t, err, tt.wantErr)
				// 已完成的任务状态不应改变
				assert.Equal(t, StatusCompleted, task.Status)
			} else {
				require.NoError(t, err)
				assert.Equal(t, StatusCompleted, task.Status, "任务状态应该是 completed")
				assert.NotNil(t, task.CompletedAt, "完成时间应该被设置")
				assert.WithinDuration(t, time.Now(), *task.CompletedAt, time.Second)
				assert.True(t, task.UpdatedAt.After(oldUpdatedAt), "更新时间应该更新")

				if originalStatus == StatusPending {
					assert.NotEqual(t, originalStatus, task.Status)
				}
			}
		})
	}
}

// TestTask_SetDueDate 测试设置截止日期
func TestTask_SetDueDate(t *testing.T) {
	tests := []struct {
		name    string
		dueDate time.Time
		wantErr error
	}{
		{
			name:    "设置未来日期",
			dueDate: time.Now().Add(24 * time.Hour),
			wantErr: nil,
		},
		{
			name:    "设置远期日期",
			dueDate: time.Now().Add(365 * 24 * time.Hour),
			wantErr: nil,
		},
		{
			name:    "设置过去日期",
			dueDate: time.Now().Add(-24 * time.Hour),
			wantErr: ErrInvalidDueDate,
		},
		{
			name:    "设置昨天的日期",
			dueDate: time.Now().Add(-1 * time.Hour),
			wantErr: ErrInvalidDueDate,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			task, _ := NewTask("test-user-id", "Test", "Desc", PriorityMedium)
			oldUpdatedAt := task.UpdatedAt

			time.Sleep(time.Millisecond)

			err := task.SetDueDate(tt.dueDate)

			if tt.wantErr != nil {
				require.Error(t, err)
				assert.ErrorIs(t, err, tt.wantErr)
				assert.Nil(t, task.DueDate, "截止日期不应该被设置")
			} else {
				require.NoError(t, err)
				require.NotNil(t, task.DueDate, "截止日期应该被设置")
				assert.WithinDuration(t, tt.dueDate, *task.DueDate, time.Second)
				assert.True(t, task.UpdatedAt.After(oldUpdatedAt), "更新时间应该更新")
			}
		})
	}
}

// TestTask_AddTag 测试添加标签
func TestTask_AddTag(t *testing.T) {
	t.Run("添加有效标签", func(t *testing.T) {
		task, _ := NewTask("test-user-id", "Test", "Desc", PriorityMedium)
		oldUpdatedAt := task.UpdatedAt

		time.Sleep(time.Millisecond)

		err := task.AddTag(Tag{Name: "test", Color: "#ff0000"})

		require.NoError(t, err)
		assert.Len(t, task.Tags, 1)
		assert.Equal(t, "test", task.Tags[0].Name)
		assert.Equal(t, "#ff0000", task.Tags[0].Color)
		assert.True(t, task.UpdatedAt.After(oldUpdatedAt))
	})

	t.Run("添加空名称标签", func(t *testing.T) {
		task, _ := NewTask("test-user-id", "Test", "Desc", PriorityMedium)

		err := task.AddTag(Tag{Name: "", Color: "#ff0000"})

		require.Error(t, err)
		assert.ErrorIs(t, err, ErrTagNameEmpty)
		assert.Empty(t, task.Tags)
	})

	t.Run("添加重复标签", func(t *testing.T) {
		task, _ := NewTask("test-user-id", "Test", "Desc", PriorityMedium)
		task.AddTag(Tag{Name: "test", Color: "#ff0000"})

		err := task.AddTag(Tag{Name: "test", Color: "#00ff00"})

		require.Error(t, err)
		assert.ErrorIs(t, err, ErrDuplicateTag)
		assert.Len(t, task.Tags, 1, "标签数量不应该增加")
	})

	t.Run("添加过多标签", func(t *testing.T) {
		task, _ := NewTask("test-user-id", "Test", "Desc", PriorityMedium)

		// 添加 10 个标签
		for i := 0; i < 10; i++ {
			err := task.AddTag(Tag{Name: fmt.Sprintf("tag%d", i), Color: "#ff0000"})
			require.NoError(t, err)
		}

		// 尝试添加第 11 个标签
		err := task.AddTag(Tag{Name: "tag11", Color: "#ff0000"})

		require.Error(t, err)
		assert.ErrorIs(t, err, ErrTooManyTags)
		assert.Len(t, task.Tags, 10, "标签数量不应该超过 10")
	})

	t.Run("添加多个不同标签", func(t *testing.T) {
		task, _ := NewTask("test-user-id", "Test", "Desc", PriorityMedium)

		tags := []Tag{
			{Name: "urgent", Color: "#ff0000"},
			{Name: "important", Color: "#00ff00"},
			{Name: "project-alpha", Color: "#0000ff"},
		}

		for _, tag := range tags {
			err := task.AddTag(tag)
			require.NoError(t, err)
		}

		assert.Len(t, task.Tags, 3)
		assert.Equal(t, "urgent", task.Tags[0].Name)
		assert.Equal(t, "important", task.Tags[1].Name)
		assert.Equal(t, "project-alpha", task.Tags[2].Name)
	})
}

// TestTask_RemoveTag 测试移除标签
func TestTask_RemoveTag(t *testing.T) {
	t.Run("移除存在的标签", func(t *testing.T) {
		task, _ := NewTask("test-user-id", "Test", "Desc", PriorityMedium)
		task.AddTag(Tag{Name: "test1", Color: "#ff0000"})
		task.AddTag(Tag{Name: "test2", Color: "#00ff00"})
		task.AddTag(Tag{Name: "test3", Color: "#0000ff"})

		oldUpdatedAt := task.UpdatedAt
		time.Sleep(time.Millisecond)

		task.RemoveTag("test2")

		assert.Len(t, task.Tags, 2)
		assert.Equal(t, "test1", task.Tags[0].Name)
		assert.Equal(t, "test3", task.Tags[1].Name)
		assert.True(t, task.UpdatedAt.After(oldUpdatedAt))
	})

	t.Run("移除不存在的标签", func(t *testing.T) {
		task, _ := NewTask("test-user-id", "Test", "Desc", PriorityMedium)
		task.AddTag(Tag{Name: "test", Color: "#ff0000"})

		task.RemoveTag("nonexistent")

		assert.Len(t, task.Tags, 1, "标签数量不应该改变")
		assert.Equal(t, "test", task.Tags[0].Name)
	})

	t.Run("移除所有标签", func(t *testing.T) {
		task, _ := NewTask("test-user-id", "Test", "Desc", PriorityMedium)
		task.AddTag(Tag{Name: "test1", Color: "#ff0000"})
		task.AddTag(Tag{Name: "test2", Color: "#00ff00"})

		task.RemoveTag("test1")
		task.RemoveTag("test2")

		assert.Empty(t, task.Tags)
	})
}

// TestTaskStatus_IsValid 测试状态验证
func TestTaskStatus_IsValid(t *testing.T) {
	tests := []struct {
		name   string
		status TaskStatus
		want   bool
	}{
		{"pending 有效", StatusPending, true},
		{"in_progress 有效", StatusInProgress, true},
		{"completed 有效", StatusCompleted, true},
		{"无效状态", TaskStatus("invalid"), false},
		{"空字符串", TaskStatus(""), false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := tt.status.IsValid()
			assert.Equal(t, tt.want, got)
		})
	}
}

// TestPriority_IsValid 测试优先级验证
func TestPriority_IsValid(t *testing.T) {
	tests := []struct {
		name     string
		priority Priority
		want     bool
	}{
		{"low 有效", PriorityLow, true},
		{"medium 有效", PriorityMedium, true},
		{"high 有效", PriorityHigh, true},
		{"无效优先级", Priority("urgent"), false},
		{"空字符串", Priority(""), false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := tt.priority.IsValid()
			assert.Equal(t, tt.want, got)
		})
	}
}

// TestTask_CompletePreservesData 测试完成任务保留其他数据
func TestTask_CompletePreservesData(t *testing.T) {
	task, _ := NewTask("test-user-id", "Test Task", "Test Description", PriorityHigh)
	dueDate := time.Now().Add(24 * time.Hour)
	task.SetDueDate(dueDate)
	task.AddTag(Tag{Name: "urgent", Color: "#ff0000"})

	err := task.Complete()

	require.NoError(t, err)
	assert.Equal(t, "Test Task", task.Title, "标题应该保持不变")
	assert.Equal(t, "Test Description", task.Description, "描述应该保持不变")
	assert.Equal(t, PriorityHigh, task.Priority, "优先级应该保持不变")
	assert.NotNil(t, task.DueDate, "截止日期应该保持不变")
	assert.Len(t, task.Tags, 1, "标签应该保持不变")
	assert.Equal(t, StatusCompleted, task.Status)
}

// TestTask_UpdatePreservesStatus 测试更新任务保留状态（如果未完成）
func TestTask_UpdatePreservesStatus(t *testing.T) {
	task, _ := NewTask("test-user-id", "Test", "Desc", PriorityLow)
	task.Status = StatusInProgress

	err := task.Update("Updated", "Updated Desc", PriorityHigh)

	require.NoError(t, err)
	assert.Equal(t, StatusInProgress, task.Status, "状态应该保持为 in_progress")
	assert.Equal(t, "Updated", task.Title)
}
