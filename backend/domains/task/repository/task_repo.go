package repository

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"

	"github.com/erweixin/go-genai-stack/domains/task/model"
)

// TaskRepositoryImpl 任务仓储实现
//
// 使用 database/sql 实现任务数据访问。
// 不使用 ORM，使用原生 SQL 保证透明度和性能。
type TaskRepositoryImpl struct {
	db *sql.DB
}

// NewTaskRepository 创建任务仓储实例
func NewTaskRepository(db *sql.DB) *TaskRepositoryImpl {
	return &TaskRepositoryImpl{db: db}
}

// 错误定义
var (
	ErrTaskNotFound = errors.New("TASK_NOT_FOUND: 任务不存在")
)

// Create 创建任务
func (r *TaskRepositoryImpl) Create(ctx context.Context, task *model.Task) error {
	// SQL 语句
	query := `
		INSERT INTO tasks (
			id, title, description, status, priority, 
			due_date, created_at, updated_at, completed_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	`

	// 执行插入
	_, err := r.db.ExecContext(
		ctx,
		query,
		task.ID,
		task.Title,
		task.Description,
		task.Status,
		task.Priority,
		task.DueDate,
		task.CreatedAt,
		task.UpdatedAt,
		task.CompletedAt,
	)
	if err != nil {
		return fmt.Errorf("create task failed: %w", err)
	}

	// 保存标签
	if len(task.Tags) > 0 {
		if err := r.saveTags(ctx, task.ID, task.Tags); err != nil {
			return fmt.Errorf("save tags failed: %w", err)
		}
	}

	return nil
}

// Update 更新任务
func (r *TaskRepositoryImpl) Update(ctx context.Context, task *model.Task) error {
	// SQL 语句
	query := `
		UPDATE tasks 
		SET title = $1, 
		    description = $2, 
		    status = $3, 
		    priority = $4, 
		    due_date = $5, 
		    updated_at = $6, 
		    completed_at = $7
		WHERE id = $8
	`

	// 执行更新
	result, err := r.db.ExecContext(
		ctx,
		query,
		task.Title,
		task.Description,
		task.Status,
		task.Priority,
		task.DueDate,
		task.UpdatedAt,
		task.CompletedAt,
		task.ID,
	)
	if err != nil {
		return fmt.Errorf("update task failed: %w", err)
	}

	// 检查是否更新了记录
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("get rows affected failed: %w", err)
	}
	if rowsAffected == 0 {
		return ErrTaskNotFound
	}

	// 更新标签（先删除旧的，再插入新的）
	if err := r.deleteTags(ctx, task.ID); err != nil {
		return fmt.Errorf("delete old tags failed: %w", err)
	}
	if len(task.Tags) > 0 {
		if err := r.saveTags(ctx, task.ID, task.Tags); err != nil {
			return fmt.Errorf("save new tags failed: %w", err)
		}
	}

	return nil
}

// FindByID 根据 ID 查找任务
func (r *TaskRepositoryImpl) FindByID(ctx context.Context, id string) (*model.Task, error) {
	// SQL 语句
	query := `
		SELECT id, title, description, status, priority, 
		       due_date, created_at, updated_at, completed_at
		FROM tasks
		WHERE id = $1
	`

	// 查询任务
	task := &model.Task{}
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&task.ID,
		&task.Title,
		&task.Description,
		&task.Status,
		&task.Priority,
		&task.DueDate,
		&task.CreatedAt,
		&task.UpdatedAt,
		&task.CompletedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, ErrTaskNotFound
		}
		return nil, fmt.Errorf("query task failed: %w", err)
	}

	// 加载标签
	tags, err := r.loadTags(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("load tags failed: %w", err)
	}
	task.Tags = tags

	return task, nil
}

// Delete 删除任务
func (r *TaskRepositoryImpl) Delete(ctx context.Context, id string) error {
	// SQL 语句（标签会通过外键级联删除）
	query := `DELETE FROM tasks WHERE id = $1`

	// 执行删除
	result, err := r.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("delete task failed: %w", err)
	}

	// 检查是否删除了记录
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("get rows affected failed: %w", err)
	}
	if rowsAffected == 0 {
		return ErrTaskNotFound
	}

	return nil
}

// List 列出任务
func (r *TaskRepositoryImpl) List(ctx context.Context, filter *TaskFilter) ([]*model.Task, int, error) {
	// 构建 WHERE 子句
	whereClause, args := r.buildWhereClause(filter)

	// 查询总数
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM tasks %s", whereClause)
	var totalCount int
	err := r.db.QueryRowContext(ctx, countQuery, args...).Scan(&totalCount)
	if err != nil {
		return nil, 0, fmt.Errorf("count tasks failed: %w", err)
	}

	// 构建查询语句
	query := fmt.Sprintf(`
		SELECT id, title, description, status, priority, 
		       due_date, created_at, updated_at, completed_at
		FROM tasks
		%s
		ORDER BY %s %s
		LIMIT $%d OFFSET $%d
	`, whereClause, filter.SortBy, filter.SortOrder, len(args)+1, len(args)+2)

	// 计算 offset
	offset := (filter.Page - 1) * filter.Limit
	args = append(args, filter.Limit, offset)

	// 执行查询
	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("query tasks failed: %w", err)
	}
	defer rows.Close()

	// 扫描结果
	tasks := make([]*model.Task, 0)
	for rows.Next() {
		task := &model.Task{}
		err := rows.Scan(
			&task.ID,
			&task.Title,
			&task.Description,
			&task.Status,
			&task.Priority,
			&task.DueDate,
			&task.CreatedAt,
			&task.UpdatedAt,
			&task.CompletedAt,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("scan task failed: %w", err)
		}

		// 加载标签
		tags, err := r.loadTags(ctx, task.ID)
		if err != nil {
			return nil, 0, fmt.Errorf("load tags failed: %w", err)
		}
		task.Tags = tags

		tasks = append(tasks, task)
	}

	if err := rows.Err(); err != nil {
		return nil, 0, fmt.Errorf("rows iteration failed: %w", err)
	}

	return tasks, totalCount, nil
}

// Exists 检查任务是否存在
func (r *TaskRepositoryImpl) Exists(ctx context.Context, id string) (bool, error) {
	query := `SELECT EXISTS(SELECT 1 FROM tasks WHERE id = $1)`

	var exists bool
	err := r.db.QueryRowContext(ctx, query, id).Scan(&exists)
	if err != nil {
		return false, fmt.Errorf("check task existence failed: %w", err)
	}

	return exists, nil
}

// ============================================
// 私有辅助方法
// ============================================

// saveTags 保存标签
func (r *TaskRepositoryImpl) saveTags(ctx context.Context, taskID string, tags []model.Tag) error {
	if len(tags) == 0 {
		return nil
	}

	// 批量插入
	query := `INSERT INTO task_tags (task_id, tag_name, tag_color) VALUES ($1, $2, $3)`

	for _, tag := range tags {
		_, err := r.db.ExecContext(ctx, query, taskID, tag.Name, tag.Color)
		if err != nil {
			return fmt.Errorf("insert tag failed: %w", err)
		}
	}

	return nil
}

// deleteTags 删除标签
func (r *TaskRepositoryImpl) deleteTags(ctx context.Context, taskID string) error {
	query := `DELETE FROM task_tags WHERE task_id = $1`
	_, err := r.db.ExecContext(ctx, query, taskID)
	return err
}

// loadTags 加载标签
func (r *TaskRepositoryImpl) loadTags(ctx context.Context, taskID string) ([]model.Tag, error) {
	query := `SELECT tag_name, tag_color FROM task_tags WHERE task_id = $1`

	rows, err := r.db.QueryContext(ctx, query, taskID)
	if err != nil {
		return nil, fmt.Errorf("query tags failed: %w", err)
	}
	defer rows.Close()

	tags := make([]model.Tag, 0)
	for rows.Next() {
		var tag model.Tag
		if err := rows.Scan(&tag.Name, &tag.Color); err != nil {
			return nil, fmt.Errorf("scan tag failed: %w", err)
		}
		tags = append(tags, tag)
	}

	return tags, rows.Err()
}

// buildWhereClause 构建 WHERE 子句
func (r *TaskRepositoryImpl) buildWhereClause(filter *TaskFilter) (string, []interface{}) {
	conditions := make([]string, 0)
	args := make([]interface{}, 0)
	argIndex := 1

	// 按状态筛选
	if filter.Status != nil {
		conditions = append(conditions, fmt.Sprintf("status = $%d", argIndex))
		args = append(args, *filter.Status)
		argIndex++
	}

	// 按优先级筛选
	if filter.Priority != nil {
		conditions = append(conditions, fmt.Sprintf("priority = $%d", argIndex))
		args = append(args, *filter.Priority)
		argIndex++
	}

	// 按标签筛选
	if filter.Tag != nil {
		conditions = append(conditions, fmt.Sprintf(
			"id IN (SELECT task_id FROM task_tags WHERE tag_name = $%d)", argIndex))
		args = append(args, *filter.Tag)
		argIndex++
	}

	// 按截止日期范围筛选
	if filter.DueDateFrom != nil {
		conditions = append(conditions, fmt.Sprintf("due_date >= $%d", argIndex))
		args = append(args, *filter.DueDateFrom)
		argIndex++
	}
	if filter.DueDateTo != nil {
		conditions = append(conditions, fmt.Sprintf("due_date <= $%d", argIndex))
		args = append(args, *filter.DueDateTo)
		argIndex++
	}

	// 关键词搜索（标题或描述）
	if filter.Keyword != nil {
		conditions = append(conditions, fmt.Sprintf(
			"(title ILIKE $%d OR description ILIKE $%d)", argIndex, argIndex+1))
		keyword := "%" + *filter.Keyword + "%"
		args = append(args, keyword, keyword)
		argIndex += 2
	}

	// 组合 WHERE 子句
	if len(conditions) == 0 {
		return "", args
	}

	whereClause := "WHERE " + conditions[0]
	for i := 1; i < len(conditions); i++ {
		whereClause += " AND " + conditions[i]
	}

	return whereClause, args
}

// ============================================
// 扩展方法（用于统计和分析）
// ============================================

// CountByStatus 按状态统计任务数量
func (r *TaskRepositoryImpl) CountByStatus(ctx context.Context) (map[model.TaskStatus]int, error) {
	query := `SELECT status, COUNT(*) FROM tasks GROUP BY status`

	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("count by status failed: %w", err)
	}
	defer rows.Close()

	result := make(map[model.TaskStatus]int)
	for rows.Next() {
		var status model.TaskStatus
		var count int
		if err := rows.Scan(&status, &count); err != nil {
			return nil, fmt.Errorf("scan status count failed: %w", err)
		}
		result[status] = count
	}

	return result, rows.Err()
}

// FindOverdueTasks 查找逾期任务
func (r *TaskRepositoryImpl) FindOverdueTasks(ctx context.Context) ([]*model.Task, error) {
	query := `
		SELECT id, title, description, status, priority, 
		       due_date, created_at, updated_at, completed_at
		FROM tasks
		WHERE status != 'completed' 
		  AND due_date IS NOT NULL 
		  AND due_date < NOW()
		ORDER BY due_date ASC
	`

	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("query overdue tasks failed: %w", err)
	}
	defer rows.Close()

	tasks := make([]*model.Task, 0)
	for rows.Next() {
		task := &model.Task{}
		err := rows.Scan(
			&task.ID,
			&task.Title,
			&task.Description,
			&task.Status,
			&task.Priority,
			&task.DueDate,
			&task.CreatedAt,
			&task.UpdatedAt,
			&task.CompletedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("scan task failed: %w", err)
		}

		// 加载标签
		tags, err := r.loadTags(ctx, task.ID)
		if err != nil {
			return nil, fmt.Errorf("load tags failed: %w", err)
		}
		task.Tags = tags

		tasks = append(tasks, task)
	}

	return tasks, rows.Err()
}

// ============================================
// 类型转换辅助函数
// ============================================

// tagsToJSON 将标签转换为 JSON（如果需要存储为 JSON 列）
func tagsToJSON(tags []model.Tag) (string, error) {
	if len(tags) == 0 {
		return "[]", nil
	}
	data, err := json.Marshal(tags)
	if err != nil {
		return "", fmt.Errorf("marshal tags failed: %w", err)
	}
	return string(data), nil
}

// tagsFromJSON 从 JSON 解析标签
func tagsFromJSON(data string) ([]model.Tag, error) {
	if data == "" || data == "[]" {
		return []model.Tag{}, nil
	}
	var tags []model.Tag
	if err := json.Unmarshal([]byte(data), &tags); err != nil {
		return nil, fmt.Errorf("unmarshal tags failed: %w", err)
	}
	return tags, nil
}

