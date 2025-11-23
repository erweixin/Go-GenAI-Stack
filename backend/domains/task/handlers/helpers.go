package handlers

import (
	"errors"
	"strings"

	"github.com/erweixin/go-genai-stack/domains/task/model"
)

// errorCode 从错误中提取错误码
//
// 将领域错误转换为 HTTP 错误码。
func errorCode(err error) string {
	if err == nil {
		return ""
	}

	errMsg := err.Error()

	// 提取错误码（格式：ERROR_CODE: message）
	if idx := strings.Index(errMsg, ":"); idx > 0 {
		return errMsg[:idx]
	}

	// 匹配已知的错误
	switch {
	case errors.Is(err, model.ErrTaskTitleEmpty):
		return "TASK_TITLE_EMPTY"
	case errors.Is(err, model.ErrTaskAlreadyCompleted):
		return "TASK_ALREADY_COMPLETED"
	case errors.Is(err, model.ErrInvalidDueDate):
		return "INVALID_DUE_DATE"
	case errors.Is(err, model.ErrTagNameEmpty):
		return "TAG_NAME_EMPTY"
	case errors.Is(err, model.ErrTooManyTags):
		return "TOO_MANY_TAGS"
	case errors.Is(err, model.ErrDuplicateTag):
		return "DUPLICATE_TAG"
	case errors.Is(err, model.ErrInvalidPriority):
		return "INVALID_PRIORITY"
	default:
		return "UNKNOWN_ERROR"
	}
}
