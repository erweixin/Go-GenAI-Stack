package handlers

import (
	"context"
	"log"
	"time"

	"github.com/cloudwego/hertz/pkg/app"
	"github.com/erweixin/go-genai-stack/domains/task/http/dto"
	"github.com/erweixin/go-genai-stack/domains/task/model"
	"github.com/erweixin/go-genai-stack/domains/task/repository"
)

// ListTasksHandler 列出任务
//
// 用例：ListTasks（参考 usecases.yaml）
//
// HTTP:
//   - Method: GET
//   - Path: /api/tasks
//
// 输入（Query Parameters）：
//   - status: 按状态筛选
//   - priority: 按优先级筛选
//   - tag: 按标签筛选
//   - due_date_from/to: 按截止日期范围筛选
//   - keyword: 关键词搜索
//   - sort_by: 排序字段
//   - sort_order: 排序方向
//   - page: 页码
//   - limit: 每页数量
//
// 输出：
//   - tasks: 任务列表
//   - total_count: 总数
//   - page: 当前页码
//   - limit: 每页数量
//   - has_more: 是否还有更多
func (s *HandlerService) ListTasksHandler(ctx context.Context, c *app.RequestContext) {
	// Step 1: ValidateQueryParams - 解析查询参数
	var req dto.ListTasksRequest
	if err := c.BindQuery(&req); err != nil {
		c.JSON(400, dto.ErrorResponse{
			Error:   "INVALID_QUERY",
			Message: "查询参数无效",
			Details: err.Error(),
		})
		return
	}

	// 设置默认值
	if req.Page == 0 {
		req.Page = 1
	}
	if req.Limit == 0 {
		req.Limit = 20
	}
	if req.SortBy == "" {
		req.SortBy = "created_at"
	}
	if req.SortOrder == "" {
		req.SortOrder = "desc"
	}

	// Step 2: BuildQuery - 构建筛选条件
	filter := repository.NewTaskFilter()
	filter.Page = req.Page
	filter.Limit = req.Limit
	filter.SortBy = req.SortBy
	filter.SortOrder = req.SortOrder

	if req.Status != "" {
		status := model.TaskStatus(req.Status)
		filter.Status = &status
	}
	if req.Priority != "" {
		priority := model.Priority(req.Priority)
		filter.Priority = &priority
	}
	if req.Tag != "" {
		filter.Tag = &req.Tag
	}
	if req.DueDateFrom != "" {
		filter.DueDateFrom = &req.DueDateFrom
	}
	if req.DueDateTo != "" {
		filter.DueDateTo = &req.DueDateTo
	}
	if req.Keyword != "" {
		filter.Keyword = &req.Keyword
	}

	// Step 3: QueryTasks - 查询任务列表
	tasks, totalCount, err := s.taskRepo.List(ctx, filter)
	if err != nil {
		log.Printf("Error listing tasks: %v", err)
		c.JSON(500, dto.ErrorResponse{
			Error:   "QUERY_FAILED",
			Message: "查询任务失败",
		})
		return
	}

	// Step 4 & 5: FormatResponse - 格式化响应
	taskItems := make([]dto.TaskItem, 0, len(tasks))
	for _, task := range tasks {
		item := dto.TaskItem{
			TaskID:    task.ID,
			Title:     task.Title,
			Status:    string(task.Status),
			Priority:  string(task.Priority),
			CreatedAt: task.CreatedAt.Format(time.RFC3339),
		}

		// 处理可选字段
		if task.DueDate != nil {
			dueDate := task.DueDate.Format(time.RFC3339)
			item.DueDate = &dueDate
		}

		// 处理标签
		tags := make([]string, len(task.Tags))
		for i, tag := range task.Tags {
			tags[i] = tag.Name
		}
		item.Tags = tags

		taskItems = append(taskItems, item)
	}

	// 计算是否还有更多
	hasMore := (req.Page * req.Limit) < totalCount

	// 返回响应
	c.JSON(200, dto.ListTasksResponse{
		Tasks:      taskItems,
		TotalCount: totalCount,
		Page:       req.Page,
		Limit:      req.Limit,
		HasMore:    hasMore,
	})
}
