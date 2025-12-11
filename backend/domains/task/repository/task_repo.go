package repository

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"github.com/doug-martin/goqu/v9"
	"github.com/erweixin/go-genai-stack/backend/domains/task/model"
)

// TaskRepositoryImpl 任务仓储实现
//
// 使用 database/sql + goqu 实现任务数据访问。
// 使用 goqu 作为 SQL 构建器，支持多数据库方言（PostgreSQL、MySQL、SQLite）。
// 不使用 ORM，使用原生 SQL 保证透明度和性能。
type TaskRepositoryImpl struct {
	db      *sql.DB
	dialect goqu.DialectWrapper
}

// NewTaskRepository 创建任务仓储实例
//
// 参数：
//   - db: 数据库连接
//   - dbType: 数据库类型（postgres, mysql, sqlite），用于选择 SQL 方言
//
// 返回：
//   - *TaskRepositoryImpl: 任务仓储实例
func NewTaskRepository(db *sql.DB, dbType string) *TaskRepositoryImpl {
	// 映射数据库类型到 goqu dialect
	var dialect goqu.DialectWrapper
	switch dbType {
	case "postgres":
		dialect = goqu.Dialect("postgres")
	case "mysql":
		dialect = goqu.Dialect("mysql")
	case "sqlite":
		dialect = goqu.Dialect("sqlite3")
	default:
		// 默认使用 postgres（向后兼容）
		dialect = goqu.Dialect("postgres")
	}

	return &TaskRepositoryImpl{
		db:      db,
		dialect: dialect,
	}
}

// 错误定义
var (
	ErrTaskNotFound = errors.New("TASK_NOT_FOUND: 任务不存在")
)

// Create 创建任务
func (r *TaskRepositoryImpl) Create(ctx context.Context, task *model.Task) error {
	// 使用 goqu 构建 INSERT 语句
	query, args, err := r.dialect.Insert("tasks").
		Cols("id", "user_id", "title", "description", "status", "priority",
			"due_date", "created_at", "updated_at", "completed_at").
		Vals(goqu.Vals{
			task.ID,
			task.UserID,
			task.Title,
			task.Description,
			task.Status,
			task.Priority,
			task.DueDate,
			task.CreatedAt,
			task.UpdatedAt,
			task.CompletedAt,
		}).
		ToSQL()
	if err != nil {
		return fmt.Errorf("build insert query failed: %w", err)
	}

	// 执行插入
	_, err = r.db.ExecContext(ctx, query, args...)
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
	// 使用 goqu 构建 UPDATE 语句
	query, args, err := r.dialect.Update("tasks").
		Set(goqu.Record{
			"title":        task.Title,
			"description":  task.Description,
			"status":       task.Status,
			"priority":     task.Priority,
			"due_date":     task.DueDate,
			"updated_at":   task.UpdatedAt,
			"completed_at": task.CompletedAt,
		}).
		Where(goqu.C("id").Eq(task.ID)).
		ToSQL()
	if err != nil {
		return fmt.Errorf("build update query failed: %w", err)
	}

	// 执行更新
	result, err := r.db.ExecContext(ctx, query, args...)
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
	// 使用 goqu 构建 SELECT 语句
	query, args, err := r.dialect.From("tasks").
		Select("id", "user_id", "title", "description", "status", "priority",
			"due_date", "created_at", "updated_at", "completed_at").
		Where(goqu.C("id").Eq(id)).
		ToSQL()
	if err != nil {
		return nil, fmt.Errorf("build select query failed: %w", err)
	}

	// 查询任务
	task := &model.Task{}
	err = r.db.QueryRowContext(ctx, query, args...).Scan(
		&task.ID,
		&task.UserID,
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
	// 使用 goqu 构建 DELETE 语句（标签会通过外键级联删除）
	query, args, err := r.dialect.Delete("tasks").
		Where(goqu.C("id").Eq(id)).
		ToSQL()
	if err != nil {
		return fmt.Errorf("build delete query failed: %w", err)
	}

	// 执行删除
	result, err := r.db.ExecContext(ctx, query, args...)
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
	// 构建基础查询
	baseQuery := r.dialect.From("tasks")

	// 构建 WHERE 条件
	baseQuery = r.buildWhereConditions(baseQuery, filter)

	// 查询总数
	countSQL, countArgs, err := baseQuery.Select(goqu.COUNT(goqu.Star())).ToSQL()
	if err != nil {
		return nil, 0, fmt.Errorf("build count query failed: %w", err)
	}

	var totalCount int
	err = r.db.QueryRowContext(ctx, countSQL, countArgs...).Scan(&totalCount)
	if err != nil {
		return nil, 0, fmt.Errorf("count tasks failed: %w", err)
	}

	// 构建 SELECT 查询
	offset := (filter.Page - 1) * filter.Limit
	selectQuery := baseQuery.
		Select("id", "user_id", "title", "description", "status", "priority",
			"due_date", "created_at", "updated_at", "completed_at")

	// 排序
	if filter.SortOrder == "asc" {
		selectQuery = selectQuery.Order(goqu.C(filter.SortBy).Asc())
	} else {
		selectQuery = selectQuery.Order(goqu.C(filter.SortBy).Desc())
	}

	selectQuery = selectQuery.Limit(uint(filter.Limit)).Offset(uint(offset))

	query, args, err := selectQuery.ToSQL()
	if err != nil {
		return nil, 0, fmt.Errorf("build select query failed: %w", err)
	}

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
			&task.UserID,
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
	// 使用 goqu 构建 EXISTS 查询
	// 注意：goqu 的 EXISTS 子查询需要单独构建，然后作为参数传递
	subQuery := r.dialect.From("tasks").
		Select(goqu.L("1")).
		Where(goqu.C("id").Eq(id))

	query, args, err := r.dialect.Select(goqu.L("EXISTS(?)", subQuery)).
		ToSQL()
	if err != nil {
		return false, fmt.Errorf("build exists query failed: %w", err)
	}

	var exists bool
	err = r.db.QueryRowContext(ctx, query, args...).Scan(&exists)
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

	// 使用 goqu 批量插入标签
	for _, tag := range tags {
		query, args, err := r.dialect.Insert("task_tags").
			Cols("task_id", "tag_name", "tag_color").
			Vals(goqu.Vals{taskID, tag.Name, tag.Color}).
			ToSQL()
		if err != nil {
			return fmt.Errorf("build insert tag query failed: %w", err)
		}

		_, err = r.db.ExecContext(ctx, query, args...)
		if err != nil {
			return fmt.Errorf("insert tag failed: %w", err)
		}
	}

	return nil
}

// deleteTags 删除标签
func (r *TaskRepositoryImpl) deleteTags(ctx context.Context, taskID string) error {
	query, args, err := r.dialect.Delete("task_tags").
		Where(goqu.C("task_id").Eq(taskID)).
		ToSQL()
	if err != nil {
		return fmt.Errorf("build delete tags query failed: %w", err)
	}

	_, err = r.db.ExecContext(ctx, query, args...)
	return err
}

// loadTags 加载标签
func (r *TaskRepositoryImpl) loadTags(ctx context.Context, taskID string) ([]model.Tag, error) {
	query, args, err := r.dialect.From("task_tags").
		Select("tag_name", "tag_color").
		Where(goqu.C("task_id").Eq(taskID)).
		ToSQL()
	if err != nil {
		return nil, fmt.Errorf("build select tags query failed: %w", err)
	}

	rows, err := r.db.QueryContext(ctx, query, args...)
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

// buildWhereConditions 构建 WHERE 条件（使用 goqu）
func (r *TaskRepositoryImpl) buildWhereConditions(query *goqu.SelectDataset, filter *TaskFilter) *goqu.SelectDataset {
	// 按用户 ID 筛选（必需）
	if filter.UserID != nil {
		query = query.Where(goqu.C("user_id").Eq(*filter.UserID))
	}

	// 按状态筛选
	if filter.Status != nil {
		query = query.Where(goqu.C("status").Eq(*filter.Status))
	}

	// 按优先级筛选
	if filter.Priority != nil {
		query = query.Where(goqu.C("priority").Eq(*filter.Priority))
	}

	// 按标签筛选
	if filter.Tag != nil {
		subQuery := r.dialect.From("task_tags").
			Select("task_id").
			Where(goqu.C("tag_name").Eq(*filter.Tag))
		query = query.Where(goqu.C("id").In(subQuery))
	}

	// 按截止日期范围筛选
	if filter.DueDateFrom != nil {
		query = query.Where(goqu.C("due_date").Gte(*filter.DueDateFrom))
	}
	if filter.DueDateTo != nil {
		query = query.Where(goqu.C("due_date").Lte(*filter.DueDateTo))
	}

	// 关键词搜索（标题或描述）
	// 注意：ILIKE 是 PostgreSQL 特有，其他数据库使用 LIKE
	// goqu 会根据 dialect 自动处理，但为了兼容性，我们使用 LIKE
	if filter.Keyword != nil {
		keyword := "%" + *filter.Keyword + "%"
		query = query.Where(
			goqu.Or(
				goqu.C("title").Like(keyword),
				goqu.C("description").Like(keyword),
			),
		)
	}

	return query
}

// ============================================
// 扩展方法（用于统计和分析）
// ============================================

// CountByStatus 按状态统计任务数量
func (r *TaskRepositoryImpl) CountByStatus(ctx context.Context) (map[model.TaskStatus]int, error) {
	query, args, err := r.dialect.From("tasks").
		Select("status", goqu.COUNT(goqu.Star())).
		GroupBy("status").
		ToSQL()
	if err != nil {
		return nil, fmt.Errorf("build count by status query failed: %w", err)
	}

	rows, err := r.db.QueryContext(ctx, query, args...)
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
	query, args, err := r.dialect.From("tasks").
		Select("id", "user_id", "title", "description", "status", "priority",
			"due_date", "created_at", "updated_at", "completed_at").
		Where(goqu.C("status").Neq("completed")).
		Where(goqu.C("due_date").IsNotNull()).
		Where(goqu.C("due_date").Lt(goqu.L("CURRENT_TIMESTAMP"))).
		Order(goqu.C("due_date").Asc()).
		ToSQL()
	if err != nil {
		return nil, fmt.Errorf("build find overdue tasks query failed: %w", err)
	}

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("query overdue tasks failed: %w", err)
	}
	defer rows.Close()

	tasks := make([]*model.Task, 0)
	for rows.Next() {
		task := &model.Task{}
		err := rows.Scan(
			&task.ID,
			&task.UserID,
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
