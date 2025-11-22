package validator

import (
	"regexp"
	"strings"

	"github.com/go-playground/validator/v10"
)

// IsValidUUID 验证 UUID 格式
func IsValidUUID(fl validator.FieldLevel) bool {
	uuid := fl.Field().String()
	matched, _ := regexp.MatchString(`^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$`, uuid)
	return matched
}

// IsValidModelName 验证模型名称
func IsValidModelName(fl validator.FieldLevel) bool {
	model := fl.Field().String()
	validModels := []string{
		"gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo",
		"claude-3-opus", "claude-3-sonnet", "claude-3-haiku",
		"claude-3.5-sonnet",
	}
	for _, valid := range validModels {
		if model == valid {
			return true
		}
	}
	return false
}

// IsValidMessageRole 验证消息角色
func IsValidMessageRole(fl validator.FieldLevel) bool {
	role := fl.Field().String()
	validRoles := []string{"user", "assistant", "system", "function"}
	for _, valid := range validRoles {
		if role == valid {
			return true
		}
	}
	return false
}

// IsNotProfanity 验证是否包含敏感词
func IsNotProfanity(fl validator.FieldLevel) bool {
	content := fl.Field().String()
	// 简单的敏感词检测（实际应用中应该使用更完善的敏感词库）
	profanityWords := []string{"fuck", "shit", "damn"}
	lowerContent := strings.ToLower(content)

	for _, word := range profanityWords {
		if strings.Contains(lowerContent, word) {
			return false
		}
	}
	return true
}

// IsValidTokenCount 验证 Token 数量
func IsValidTokenCount(fl validator.FieldLevel) bool {
	count := fl.Field().Int()
	return count >= 0 && count <= 1000000
}

// IsValidTemperature 验证温度参数（0-2）
func IsValidTemperature(fl validator.FieldLevel) bool {
	temp := fl.Field().Float()
	return temp >= 0 && temp <= 2
}

// IsValidTopP 验证 Top-P 参数（0-1）
func IsValidTopP(fl validator.FieldLevel) bool {
	topP := fl.Field().Float()
	return topP >= 0 && topP <= 1
}

// IsValidStrategy 验证路由策略
func IsValidStrategy(fl validator.FieldLevel) bool {
	strategy := fl.Field().String()
	validStrategies := []string{"latency", "cost", "quality", "random"}
	for _, valid := range validStrategies {
		if strategy == valid {
			return true
		}
	}
	return false
}

// IsValidProvider 验证提供商名称
func IsValidProvider(fl validator.FieldLevel) bool {
	provider := fl.Field().String()
	validProviders := []string{"openai", "anthropic", "local", "eino"}
	for _, valid := range validProviders {
		if provider == valid {
			return true
		}
	}
	return false
}

// IsValidConversationTitle 验证对话标题
func IsValidConversationTitle(fl validator.FieldLevel) bool {
	title := fl.Field().String()
	// 标题长度限制
	if len(title) > 200 {
		return false
	}
	// 不能只包含空白字符
	if strings.TrimSpace(title) == "" {
		return false
	}
	return true
}

// IsValidPaginationLimit 验证分页限制
func IsValidPaginationLimit(fl validator.FieldLevel) bool {
	limit := fl.Field().Int()
	return limit > 0 && limit <= 100
}

// IsValidOffset 验证分页偏移量
func IsValidOffset(fl validator.FieldLevel) bool {
	offset := fl.Field().Int()
	return offset >= 0
}

// RegisterAllCustomValidators 注册所有自定义验证器
func RegisterAllCustomValidators(v *validator.Validate) {
	v.RegisterValidation("uuid", IsValidUUID)
	v.RegisterValidation("model_name", IsValidModelName)
	v.RegisterValidation("message_role", IsValidMessageRole)
	v.RegisterValidation("not_profanity", IsNotProfanity)
	v.RegisterValidation("token_count", IsValidTokenCount)
	v.RegisterValidation("temperature", IsValidTemperature)
	v.RegisterValidation("top_p", IsValidTopP)
	v.RegisterValidation("strategy", IsValidStrategy)
	v.RegisterValidation("provider", IsValidProvider)
	v.RegisterValidation("conversation_title", IsValidConversationTitle)
	v.RegisterValidation("pagination_limit", IsValidPaginationLimit)
	v.RegisterValidation("pagination_offset", IsValidOffset)
}

