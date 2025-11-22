package po

import "time"

// MessagePO 消息持久化对象
// 这是数据库表的映射，使用 GORM 标签
// 注意：这是内部实现细节，不暴露给领域外部
type MessagePO struct {
	// 数据库主键（自增）
	ID uint64 `gorm:"primaryKey;autoIncrement"`
	
	// 业务字段
	MessageID      string    `gorm:"column:message_id;uniqueIndex;type:varchar(64);not null"`
	ConversationID string    `gorm:"column:conversation_id;index;type:varchar(64);not null"`
	Role           string    `gorm:"column:role;type:varchar(20);not null"`
	Content        string    `gorm:"column:content;type:text;not null"`
	Tokens         int       `gorm:"column:tokens;default:0"`
	Model          string    `gorm:"column:model;type:varchar(50)"`
	Timestamp      time.Time `gorm:"column:timestamp;index;not null"`
	
	// GORM 自动管理字段
	CreatedAt time.Time `gorm:"autoCreateTime"`
	UpdatedAt time.Time `gorm:"autoUpdateTime"`
}

// TableName 指定表名
func (MessagePO) TableName() string {
	return "messages"
}
