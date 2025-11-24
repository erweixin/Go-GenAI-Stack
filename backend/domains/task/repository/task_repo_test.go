package repository

import (
	"context"
	"database/sql"
	"fmt"
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/erweixin/go-genai-stack/backend/domains/task/model"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestTaskRepository_Create 测试创建任务
func TestTaskRepository_Create(t *testing.T) {
	t.Run("创建任务成功", func(t *testing.T) {
		db, mock, err := sqlmock.New()
		require.NoError(t, err)
		defer db.Close()

		repo := NewTaskRepository(db)
		task, _ := model.NewTask("Test Task", "Description", model.PriorityMedium)

		// Mock INSERT tasks
		mock.ExpectExec("INSERT INTO tasks").
			WithArgs(
				task.ID,
				task.Title,
				task.Description,
				string(task.Status),
				string(task.Priority),
				task.DueDate,
				sqlmock.AnyArg(), // CreatedAt
				sqlmock.AnyArg(), // UpdatedAt
				task.CompletedAt,
			).
			WillReturnResult(sqlmock.NewResult(1, 1))

		err = repo.Create(context.Background(), task)

		assert.NoError(t, err)
		assert.NoError(t, mock.ExpectationsWereMet())
	})

	t.Run("创建带标签的任务", func(t *testing.T) {
		db, mock, err := sqlmock.New()
		require.NoError(t, err)
		defer db.Close()

		repo := NewTaskRepository(db)
		task, _ := model.NewTask("Test Task", "Description", model.PriorityMedium)
		task.AddTag(model.Tag{Name: "urgent", Color: "#ff0000"})
		task.AddTag(model.Tag{Name: "important", Color: "#00ff00"})

		// Mock INSERT tasks
		mock.ExpectExec("INSERT INTO tasks").
			WillReturnResult(sqlmock.NewResult(1, 1))

		// Mock INSERT tags (2次)
		mock.ExpectExec("INSERT INTO task_tags").
			WithArgs(task.ID, "urgent", "#ff0000").
			WillReturnResult(sqlmock.NewResult(1, 1))
		mock.ExpectExec("INSERT INTO task_tags").
			WithArgs(task.ID, "important", "#00ff00").
			WillReturnResult(sqlmock.NewResult(1, 1))

		err = repo.Create(context.Background(), task)

		assert.NoError(t, err)
		assert.NoError(t, mock.ExpectationsWereMet())
	})

	t.Run("数据库错误", func(t *testing.T) {
		db, mock, err := sqlmock.New()
		require.NoError(t, err)
		defer db.Close()

		repo := NewTaskRepository(db)
		task, _ := model.NewTask("Test Task", "Description", model.PriorityMedium)

		mock.ExpectExec("INSERT INTO tasks").
			WillReturnError(fmt.Errorf("database error"))

		err = repo.Create(context.Background(), task)

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "create task failed")
	})
}

// TestTaskRepository_FindByID 测试根据ID查找任务
func TestTaskRepository_FindByID(t *testing.T) {
	t.Run("查找存在的任务", func(t *testing.T) {
		db, mock, err := sqlmock.New()
		require.NoError(t, err)
		defer db.Close()

		repo := NewTaskRepository(db)
		now := time.Now()

		// Mock SELECT tasks
		rows := sqlmock.NewRows([]string{
			"id", "title", "description", "status", "priority",
			"due_date", "created_at", "updated_at", "completed_at",
		}).AddRow(
			"task-123", "Test Task", "Description", "pending", "medium",
			nil, now, now, nil,
		)
		mock.ExpectQuery("SELECT (.+) FROM tasks WHERE id").
			WithArgs("task-123").
			WillReturnRows(rows)

		// Mock SELECT tags
		tagsRows := sqlmock.NewRows([]string{"tag_name", "tag_color"}).
			AddRow("urgent", "#ff0000").
			AddRow("important", "#00ff00")
		mock.ExpectQuery("SELECT tag_name, tag_color FROM task_tags").
			WithArgs("task-123").
			WillReturnRows(tagsRows)

		task, err := repo.FindByID(context.Background(), "task-123")

		require.NoError(t, err)
		assert.NotNil(t, task)
		assert.Equal(t, "task-123", task.ID)
		assert.Equal(t, "Test Task", task.Title)
		assert.Equal(t, "Description", task.Description)
		assert.Equal(t, model.StatusPending, task.Status)
		assert.Equal(t, model.PriorityMedium, task.Priority)
		assert.Len(t, task.Tags, 2)
		assert.Equal(t, "urgent", task.Tags[0].Name)
		assert.NoError(t, mock.ExpectationsWereMet())
	})

	t.Run("查找不存在的任务", func(t *testing.T) {
		db, mock, err := sqlmock.New()
		require.NoError(t, err)
		defer db.Close()

		repo := NewTaskRepository(db)

		mock.ExpectQuery("SELECT (.+) FROM tasks WHERE id").
			WithArgs("nonexistent").
			WillReturnError(sql.ErrNoRows)

		task, err := repo.FindByID(context.Background(), "nonexistent")

		assert.Error(t, err)
		assert.ErrorIs(t, err, ErrTaskNotFound)
		assert.Nil(t, task)
	})

	t.Run("数据库错误", func(t *testing.T) {
		db, mock, err := sqlmock.New()
		require.NoError(t, err)
		defer db.Close()

		repo := NewTaskRepository(db)

		mock.ExpectQuery("SELECT (.+) FROM tasks WHERE id").
			WillReturnError(fmt.Errorf("database error"))

		task, err := repo.FindByID(context.Background(), "task-123")

		assert.Error(t, err)
		assert.Nil(t, task)
	})
}

// TestTaskRepository_Update 测试更新任务
func TestTaskRepository_Update(t *testing.T) {
	t.Run("更新任务成功", func(t *testing.T) {
		db, mock, err := sqlmock.New()
		require.NoError(t, err)
		defer db.Close()

		repo := NewTaskRepository(db)
		task, _ := model.NewTask("Updated Task", "Updated Desc", model.PriorityHigh)

		// Mock UPDATE
		mock.ExpectExec("UPDATE tasks SET").
			WithArgs(
				task.Title,
				task.Description,
				string(task.Status),
				string(task.Priority),
				task.DueDate,
				sqlmock.AnyArg(), // UpdatedAt
				task.CompletedAt,
				task.ID,
			).
			WillReturnResult(sqlmock.NewResult(0, 1))

		// Mock DELETE old tags
		mock.ExpectExec("DELETE FROM task_tags WHERE task_id").
			WithArgs(task.ID).
			WillReturnResult(sqlmock.NewResult(0, 0))

		err = repo.Update(context.Background(), task)

		assert.NoError(t, err)
		assert.NoError(t, mock.ExpectationsWereMet())
	})

	t.Run("更新任务并添加标签", func(t *testing.T) {
		db, mock, err := sqlmock.New()
		require.NoError(t, err)
		defer db.Close()

		repo := NewTaskRepository(db)
		task, _ := model.NewTask("Updated Task", "Updated Desc", model.PriorityHigh)
		task.AddTag(model.Tag{Name: "new-tag", Color: "#ff0000"})

		// Mock UPDATE
		mock.ExpectExec("UPDATE tasks SET").
			WillReturnResult(sqlmock.NewResult(0, 1))

		// Mock DELETE old tags
		mock.ExpectExec("DELETE FROM task_tags WHERE task_id").
			WillReturnResult(sqlmock.NewResult(0, 0))

		// Mock INSERT new tag
		mock.ExpectExec("INSERT INTO task_tags").
			WithArgs(task.ID, "new-tag", "#ff0000").
			WillReturnResult(sqlmock.NewResult(1, 1))

		err = repo.Update(context.Background(), task)

		assert.NoError(t, err)
		assert.NoError(t, mock.ExpectationsWereMet())
	})

	t.Run("更新不存在的任务", func(t *testing.T) {
		db, mock, err := sqlmock.New()
		require.NoError(t, err)
		defer db.Close()

		repo := NewTaskRepository(db)
		task, _ := model.NewTask("Updated Task", "Updated Desc", model.PriorityHigh)

		// Mock UPDATE returns 0 rows affected
		mock.ExpectExec("UPDATE tasks SET").
			WillReturnResult(sqlmock.NewResult(0, 0))

		err = repo.Update(context.Background(), task)

		assert.Error(t, err)
		assert.ErrorIs(t, err, ErrTaskNotFound)
	})

	t.Run("更新失败", func(t *testing.T) {
		db, mock, err := sqlmock.New()
		require.NoError(t, err)
		defer db.Close()

		repo := NewTaskRepository(db)
		task, _ := model.NewTask("Updated Task", "Updated Desc", model.PriorityHigh)

		mock.ExpectExec("UPDATE tasks SET").
			WillReturnError(fmt.Errorf("database error"))

		err = repo.Update(context.Background(), task)

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "update task failed")
	})
}

// TestTaskRepository_Delete 测试删除任务
func TestTaskRepository_Delete(t *testing.T) {
	t.Run("删除存在的任务", func(t *testing.T) {
		db, mock, err := sqlmock.New()
		require.NoError(t, err)
		defer db.Close()

		repo := NewTaskRepository(db)

		// Mock DELETE task (标签通过外键级联删除)
		mock.ExpectExec("DELETE FROM tasks WHERE id").
			WithArgs("task-123").
			WillReturnResult(sqlmock.NewResult(0, 1))

		err = repo.Delete(context.Background(), "task-123")

		assert.NoError(t, err)
		assert.NoError(t, mock.ExpectationsWereMet())
	})

	t.Run("删除不存在的任务", func(t *testing.T) {
		db, mock, err := sqlmock.New()
		require.NoError(t, err)
		defer db.Close()

		repo := NewTaskRepository(db)

		// Mock DELETE task returns 0 rows affected
		mock.ExpectExec("DELETE FROM tasks WHERE id").
			WithArgs("nonexistent").
			WillReturnResult(sqlmock.NewResult(0, 0))

		err = repo.Delete(context.Background(), "nonexistent")

		assert.Error(t, err)
		assert.ErrorIs(t, err, ErrTaskNotFound)
	})

	t.Run("删除失败", func(t *testing.T) {
		db, mock, err := sqlmock.New()
		require.NoError(t, err)
		defer db.Close()

		repo := NewTaskRepository(db)

		mock.ExpectExec("DELETE FROM tasks WHERE id").
			WithArgs("task-123").
			WillReturnError(fmt.Errorf("database error"))

		err = repo.Delete(context.Background(), "task-123")

		assert.Error(t, err)
		assert.Contains(t, err.Error(), "delete task failed")
	})
}

// TestTaskRepository_List 测试列出任务
func TestTaskRepository_List(t *testing.T) {
	t.Run("列出所有任务", func(t *testing.T) {
		db, mock, err := sqlmock.New()
		require.NoError(t, err)
		defer db.Close()

		repo := NewTaskRepository(db)
		filter := NewTaskFilter()
		filter.Page = 1
		filter.Limit = 10

		now := time.Now()

		// Mock COUNT
		countRows := sqlmock.NewRows([]string{"count"}).AddRow(2)
		mock.ExpectQuery("SELECT COUNT\\(\\*\\) FROM tasks").
			WillReturnRows(countRows)

		// Mock SELECT tasks
		rows := sqlmock.NewRows([]string{
			"id", "title", "description", "status", "priority",
			"due_date", "created_at", "updated_at", "completed_at",
		}).
			AddRow("task-1", "Task 1", "Desc 1", "pending", "medium", nil, now, now, nil).
			AddRow("task-2", "Task 2", "Desc 2", "completed", "high", nil, now, now, &now)

		mock.ExpectQuery("SELECT (.+) FROM tasks").
			WillReturnRows(rows)

		// Mock tags for task-1
		tags1 := sqlmock.NewRows([]string{"tag_name", "tag_color"}).
			AddRow("urgent", "#ff0000")
		mock.ExpectQuery("SELECT tag_name, tag_color FROM task_tags").
			WithArgs("task-1").
			WillReturnRows(tags1)

		// Mock tags for task-2
		tags2 := sqlmock.NewRows([]string{"tag_name", "tag_color"})
		mock.ExpectQuery("SELECT tag_name, tag_color FROM task_tags").
			WithArgs("task-2").
			WillReturnRows(tags2)

		tasks, totalCount, err := repo.List(context.Background(), filter)

		require.NoError(t, err)
		assert.Len(t, tasks, 2)
		assert.Equal(t, 2, totalCount)
		assert.Equal(t, "task-1", tasks[0].ID)
		assert.Equal(t, "task-2", tasks[1].ID)
		assert.Len(t, tasks[0].Tags, 1)
		assert.Empty(t, tasks[1].Tags)
		assert.NoError(t, mock.ExpectationsWereMet())
	})

	t.Run("列出带过滤条件的任务", func(t *testing.T) {
		db, mock, err := sqlmock.New()
		require.NoError(t, err)
		defer db.Close()

		repo := NewTaskRepository(db)
		filter := NewTaskFilter()
		status := model.StatusPending
		filter.Status = &status
		priority := model.PriorityHigh
		filter.Priority = &priority
		filter.Page = 1
		filter.Limit = 10

		now := time.Now()

		// Mock COUNT with WHERE
		countRows := sqlmock.NewRows([]string{"count"}).AddRow(1)
		mock.ExpectQuery("SELECT COUNT\\(\\*\\) FROM tasks WHERE").
			WithArgs("pending", "high").
			WillReturnRows(countRows)

		// Mock SELECT with WHERE
		rows := sqlmock.NewRows([]string{
			"id", "title", "description", "status", "priority",
			"due_date", "created_at", "updated_at", "completed_at",
		}).AddRow("task-1", "Task 1", "Desc 1", "pending", "high", nil, now, now, nil)

		mock.ExpectQuery("SELECT (.+) FROM tasks WHERE").
			WithArgs("pending", "high", 10, 0).
			WillReturnRows(rows)

		// Mock tags
		tags := sqlmock.NewRows([]string{"tag_name", "tag_color"})
		mock.ExpectQuery("SELECT tag_name, tag_color FROM task_tags").
			WithArgs("task-1").
			WillReturnRows(tags)

		tasks, totalCount, err := repo.List(context.Background(), filter)

		require.NoError(t, err)
		assert.Len(t, tasks, 1)
		assert.Equal(t, 1, totalCount)
		assert.Equal(t, "task-1", tasks[0].ID)
		assert.NoError(t, mock.ExpectationsWereMet())
	})

	t.Run("列出空结果", func(t *testing.T) {
		db, mock, err := sqlmock.New()
		require.NoError(t, err)
		defer db.Close()

		repo := NewTaskRepository(db)
		filter := NewTaskFilter()
		filter.Page = 1
		filter.Limit = 10

		// Mock COUNT
		countRows := sqlmock.NewRows([]string{"count"}).AddRow(0)
		mock.ExpectQuery("SELECT COUNT\\(\\*\\) FROM tasks").
			WillReturnRows(countRows)

		// Mock SELECT
		rows := sqlmock.NewRows([]string{
			"id", "title", "description", "status", "priority",
			"due_date", "created_at", "updated_at", "completed_at",
		})
		mock.ExpectQuery("SELECT (.+) FROM tasks").
			WillReturnRows(rows)

		tasks, totalCount, err := repo.List(context.Background(), filter)

		require.NoError(t, err)
		assert.Empty(t, tasks)
		assert.Equal(t, 0, totalCount)
		assert.NoError(t, mock.ExpectationsWereMet())
	})

	t.Run("COUNT 失败", func(t *testing.T) {
		db, mock, err := sqlmock.New()
		require.NoError(t, err)
		defer db.Close()

		repo := NewTaskRepository(db)
		filter := NewTaskFilter()

		mock.ExpectQuery("SELECT COUNT\\(\\*\\) FROM tasks").
			WillReturnError(fmt.Errorf("database error"))

		tasks, totalCount, err := repo.List(context.Background(), filter)

		assert.Error(t, err)
		assert.Nil(t, tasks)
		assert.Equal(t, 0, totalCount)
		assert.Contains(t, err.Error(), "count tasks failed")
	})

	t.Run("SELECT 失败", func(t *testing.T) {
		db, mock, err := sqlmock.New()
		require.NoError(t, err)
		defer db.Close()

		repo := NewTaskRepository(db)
		filter := NewTaskFilter()

		countRows := sqlmock.NewRows([]string{"count"}).AddRow(5)
		mock.ExpectQuery("SELECT COUNT\\(\\*\\) FROM tasks").
			WillReturnRows(countRows)

		mock.ExpectQuery("SELECT (.+) FROM tasks").
			WillReturnError(fmt.Errorf("database error"))

		tasks, totalCount, err := repo.List(context.Background(), filter)

		assert.Error(t, err)
		assert.Nil(t, tasks)
		assert.Equal(t, 0, totalCount)
		assert.Contains(t, err.Error(), "query tasks failed")
	})
}

// TestTaskRepository_Exists 测试检查任务是否存在
func TestTaskRepository_Exists(t *testing.T) {
	t.Run("任务存在", func(t *testing.T) {
		db, mock, err := sqlmock.New()
		require.NoError(t, err)
		defer db.Close()

		repo := NewTaskRepository(db)

		rows := sqlmock.NewRows([]string{"exists"}).AddRow(true)
		mock.ExpectQuery("SELECT EXISTS").
			WithArgs("task-123").
			WillReturnRows(rows)

		exists, err := repo.Exists(context.Background(), "task-123")

		assert.NoError(t, err)
		assert.True(t, exists)
		assert.NoError(t, mock.ExpectationsWereMet())
	})

	t.Run("任务不存在", func(t *testing.T) {
		db, mock, err := sqlmock.New()
		require.NoError(t, err)
		defer db.Close()

		repo := NewTaskRepository(db)

		rows := sqlmock.NewRows([]string{"exists"}).AddRow(false)
		mock.ExpectQuery("SELECT EXISTS").
			WithArgs("nonexistent").
			WillReturnRows(rows)

		exists, err := repo.Exists(context.Background(), "nonexistent")

		assert.NoError(t, err)
		assert.False(t, exists)
		assert.NoError(t, mock.ExpectationsWereMet())
	})

	t.Run("数据库错误", func(t *testing.T) {
		db, mock, err := sqlmock.New()
		require.NoError(t, err)
		defer db.Close()

		repo := NewTaskRepository(db)

		mock.ExpectQuery("SELECT EXISTS").
			WillReturnError(fmt.Errorf("database error"))

		exists, err := repo.Exists(context.Background(), "task-123")

		assert.Error(t, err)
		assert.False(t, exists)
		assert.Contains(t, err.Error(), "check task existence failed")
	})
}

// TestNewTaskFilter 测试创建过滤器
func TestNewTaskFilter(t *testing.T) {
	filter := NewTaskFilter()

	assert.NotNil(t, filter)
	assert.Equal(t, 1, filter.Page)
	assert.Equal(t, 20, filter.Limit)
	assert.Equal(t, "created_at", filter.SortBy)
	assert.Equal(t, "desc", filter.SortOrder)
	assert.Nil(t, filter.Status)
	assert.Nil(t, filter.Priority)
	assert.Nil(t, filter.Tag)
}
