package validator

import (
	"fmt"
	"reflect"
	"strings"

	"github.com/go-playground/validator/v10"
)

// Validator 验证器接口
type Validator interface {
	// Validate 验证结构体
	Validate(data interface{}) error

	// ValidateVar 验证单个变量
	ValidateVar(field interface{}, tag string) error

	// RegisterValidation 注册自定义验证规则
	RegisterValidation(tag string, fn ValidationFunc) error
}

// ValidationFunc 自定义验证函数
type ValidationFunc func(fl validator.FieldLevel) bool

// customValidator 自定义验证器实现
type customValidator struct {
	validate *validator.Validate
}

// New 创建验证器
//
// Example:
//
//	v := validator.New()
//	
//	type User struct {
//	    Username string `validate:"required,min=3,max=20"`
//	    Email    string `validate:"required,email"`
//	    Age      int    `validate:"gte=0,lte=130"`
//	}
//	
//	user := User{Username: "test", Email: "test@example.com", Age: 25}
//	if err := v.Validate(user); err != nil {
//	    log.Println("Validation error:", err)
//	}
func New() Validator {
	v := validator.New()

	// 使用 JSON 标签作为字段名
	v.RegisterTagNameFunc(func(fld reflect.StructField) string {
		name := strings.SplitN(fld.Tag.Get("json"), ",", 2)[0]
		if name == "-" {
			return ""
		}
		return name
	})

	cv := &customValidator{validate: v}

	// 注册自定义验证规则
	cv.registerCustomValidations()

	return cv
}

// Validate 验证结构体
func (c *customValidator) Validate(data interface{}) error {
	err := c.validate.Struct(data)
	if err == nil {
		return nil
	}

	// 转换为友好的错误消息
	if validationErrors, ok := err.(validator.ValidationErrors); ok {
		return NewValidationError(validationErrors)
	}

	return err
}

// ValidateVar 验证单个变量
func (c *customValidator) ValidateVar(field interface{}, tag string) error {
	err := c.validate.Var(field, tag)
	if err == nil {
		return nil
	}

	return err
}

// RegisterValidation 注册自定义验证规则
func (c *customValidator) RegisterValidation(tag string, fn ValidationFunc) error {
	return c.validate.RegisterValidation(tag, validator.Func(fn))
}

// registerCustomValidations 注册自定义验证规则
func (c *customValidator) registerCustomValidations() {
	// 注册自定义验证规则

	// model_name: 验证 LLM 模型名称
	c.validate.RegisterValidation("model_name", func(fl validator.FieldLevel) bool {
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
	})

	// conversation_id: 验证对话 ID 格式
	c.validate.RegisterValidation("conversation_id", func(fl validator.FieldLevel) bool {
		id := fl.Field().String()
		return len(id) > 0 && len(id) <= 100
	})

	// message_role: 验证消息角色
	c.validate.RegisterValidation("message_role", func(fl validator.FieldLevel) bool {
		role := fl.Field().String()
		validRoles := []string{"user", "assistant", "system"}
		for _, valid := range validRoles {
			if role == valid {
				return true
			}
		}
		return false
	})

	// token_count: 验证 Token 数量
	c.validate.RegisterValidation("token_count", func(fl validator.FieldLevel) bool {
		count := fl.Field().Int()
		return count >= 0 && count <= 1000000
	})
}

// ValidationError 验证错误
type ValidationError struct {
	Errors map[string]string `json:"errors"`
}

// Error 实现 error 接口
func (v *ValidationError) Error() string {
	var errors []string
	for field, msg := range v.Errors {
		errors = append(errors, fmt.Sprintf("%s: %s", field, msg))
	}
	return strings.Join(errors, "; ")
}

// NewValidationError 创建验证错误
func NewValidationError(validationErrors validator.ValidationErrors) *ValidationError {
	errors := make(map[string]string)

	for _, err := range validationErrors {
		field := err.Field()
		message := getErrorMessage(err)
		errors[field] = message
	}

	return &ValidationError{Errors: errors}
}

// getErrorMessage 获取友好的错误消息
func getErrorMessage(err validator.FieldError) string {
	field := err.Field()
	tag := err.Tag()
	param := err.Param()

	switch tag {
	case "required":
		return fmt.Sprintf("%s is required", field)
	case "email":
		return fmt.Sprintf("%s must be a valid email address", field)
	case "min":
		return fmt.Sprintf("%s must be at least %s characters", field, param)
	case "max":
		return fmt.Sprintf("%s must be at most %s characters", field, param)
	case "gte":
		return fmt.Sprintf("%s must be greater than or equal to %s", field, param)
	case "lte":
		return fmt.Sprintf("%s must be less than or equal to %s", field, param)
	case "oneof":
		return fmt.Sprintf("%s must be one of: %s", field, param)
	case "model_name":
		return fmt.Sprintf("%s is not a valid model name", field)
	case "message_role":
		return fmt.Sprintf("%s must be one of: user, assistant, system", field)
	case "token_count":
		return fmt.Sprintf("%s must be between 0 and 1000000", field)
	default:
		return fmt.Sprintf("%s failed validation for '%s'", field, tag)
	}
}

// Global validator instance
var globalValidator Validator

// SetGlobalValidator 设置全局验证器
func SetGlobalValidator(v Validator) {
	globalValidator = v
}

// GetGlobalValidator 获取全局验证器
func GetGlobalValidator() Validator {
	if globalValidator == nil {
		globalValidator = New()
	}
	return globalValidator
}

// Validate 使用全局验证器验证
func Validate(data interface{}) error {
	return GetGlobalValidator().Validate(data)
}

// ValidateVar 使用全局验证器验证单个变量
func ValidateVar(field interface{}, tag string) error {
	return GetGlobalValidator().ValidateVar(field, tag)
}

