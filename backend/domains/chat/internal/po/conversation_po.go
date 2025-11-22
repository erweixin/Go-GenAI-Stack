package po

import "time"

// ConversationPO 对话持久化对象
type ConversationPO struct {
	// 数据库主键
	ID uint64 `gorm:"primaryKey;autoIncrement"`
	
	// 业务字段
	ConversationID string    `gorm:"column:conversation_id;uniqueIndex;type:varchar(64);not null"`
	UserID         string    `gorm:"column:user_id;index;type:varchar(64);not null"`
	Title          string    `gorm:"column:title;type:varchar(200)"`
	CreatedAt      time.Time `gorm:"column:created_at;index;not null"`
	UpdatedAt      time.Time `gorm:"column:updated_at;not null"`
}

// TableName 指定表名
func (ConversationPO) TableName() string {
	return "conversations"
}
