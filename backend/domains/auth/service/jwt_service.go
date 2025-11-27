package service

import (
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// TokenType JWT Token 类型
type TokenType string

const (
	TokenTypeAccess  TokenType = "access"
	TokenTypeRefresh TokenType = "refresh"
)

// Claims JWT Claims 结构
type Claims struct {
	UserID string    `json:"user_id"`
	Email  string    `json:"email,omitempty"`
	Type   TokenType `json:"type"`
	jwt.RegisteredClaims
}

// JWTService JWT 服务
//
// 职责：
//   - 生成 Access Token 和 Refresh Token
//   - 验证 Token 有效性
//   - 解析 Token 中的 Claims
type JWTService struct {
	secret             []byte
	accessTokenExpiry  time.Duration
	refreshTokenExpiry time.Duration
	issuer             string
}

// NewJWTService 创建 JWT 服务
//
// 参数：
//   - secret: JWT 密钥
//   - accessTokenExpiry: Access Token 过期时间
//   - refreshTokenExpiry: Refresh Token 过期时间
//   - issuer: 签发者
//
// 返回：
//   - *JWTService: JWT 服务实例
func NewJWTService(
	secret string,
	accessTokenExpiry time.Duration,
	refreshTokenExpiry time.Duration,
	issuer string,
) *JWTService {
	return &JWTService{
		secret:             []byte(secret),
		accessTokenExpiry:  accessTokenExpiry,
		refreshTokenExpiry: refreshTokenExpiry,
		issuer:             issuer,
	}
}

// GenerateAccessToken 生成 Access Token
//
// 参数：
//   - userID: 用户 ID
//   - email: 邮箱
//
// 返回：
//   - string: Token 字符串
//   - time.Time: 过期时间
//   - error: 错误信息
func (s *JWTService) GenerateAccessToken(userID, email string) (string, time.Time, error) {
	now := time.Now()
	expiresAt := now.Add(s.accessTokenExpiry)

	claims := Claims{
		UserID: userID,
		Email:  email,
		Type:   TokenTypeAccess,
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    s.issuer,
			ExpiresAt: jwt.NewNumericDate(expiresAt),
			IssuedAt:  jwt.NewNumericDate(now),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(s.secret)
	if err != nil {
		return "", time.Time{}, fmt.Errorf("生成 Access Token 失败: %w", err)
	}

	return tokenString, expiresAt, nil
}

// GenerateRefreshToken 生成 Refresh Token
//
// 参数：
//   - userID: 用户 ID
//
// 返回：
//   - string: Token 字符串
//   - time.Time: 过期时间
//   - error: 错误信息
func (s *JWTService) GenerateRefreshToken(userID string) (string, time.Time, error) {
	now := time.Now()
	expiresAt := now.Add(s.refreshTokenExpiry)

	claims := Claims{
		UserID: userID,
		Type:   TokenTypeRefresh,
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    s.issuer,
			ExpiresAt: jwt.NewNumericDate(expiresAt),
			IssuedAt:  jwt.NewNumericDate(now),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(s.secret)
	if err != nil {
		return "", time.Time{}, fmt.Errorf("生成 Refresh Token 失败: %w", err)
	}

	return tokenString, expiresAt, nil
}

// VerifyToken 验证 Token
//
// 参数：
//   - tokenString: Token 字符串
//
// 返回：
//   - *Claims: Token Claims
//   - error: 错误信息
//
// 验证项：
//   - 签名是否正确
//   - Token 是否过期
//   - Issuer 是否匹配
func (s *JWTService) VerifyToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		// 验证签名算法
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("INVALID_SIGNING_METHOD: 签名算法无效")
		}
		return s.secret, nil
	})

	if err != nil {
		return nil, fmt.Errorf("INVALID_TOKEN: Token 验证失败: %w", err)
	}

	if !token.Valid {
		return nil, fmt.Errorf("INVALID_TOKEN: Token 无效")
	}

	claims, ok := token.Claims.(*Claims)
	if !ok {
		return nil, fmt.Errorf("INVALID_TOKEN: Claims 解析失败")
	}

	// 验证 Issuer
	if claims.Issuer != s.issuer {
		return nil, fmt.Errorf("INVALID_ISSUER: Issuer 不匹配")
	}

	return claims, nil
}

// VerifyAccessToken 验证 Access Token
//
// 参数：
//   - tokenString: Token 字符串
//
// 返回：
//   - *Claims: Token Claims
//   - error: 错误信息
//
// 额外验证：Token 类型必须是 "access"
func (s *JWTService) VerifyAccessToken(tokenString string) (*Claims, error) {
	claims, err := s.VerifyToken(tokenString)
	if err != nil {
		return nil, err
	}

	if claims.Type != TokenTypeAccess {
		return nil, fmt.Errorf("INVALID_TOKEN_TYPE: Token 类型必须是 access")
	}

	return claims, nil
}

// VerifyRefreshToken 验证 Refresh Token
//
// 参数：
//   - tokenString: Token 字符串
//
// 返回：
//   - *Claims: Token Claims
//   - error: 错误信息
//
// 额外验证：Token 类型必须是 "refresh"
func (s *JWTService) VerifyRefreshToken(tokenString string) (*Claims, error) {
	claims, err := s.VerifyToken(tokenString)
	if err != nil {
		return nil, err
	}

	if claims.Type != TokenTypeRefresh {
		return nil, fmt.Errorf("INVALID_TOKEN_TYPE: Token 类型必须是 refresh")
	}

	return claims, nil
}

// ExtractUserID 从 Token 中提取用户 ID
//
// 参数：
//   - tokenString: Token 字符串
//
// 返回：
//   - string: 用户 ID
//   - error: 错误信息
func (s *JWTService) ExtractUserID(tokenString string) (string, error) {
	claims, err := s.VerifyToken(tokenString)
	if err != nil {
		return "", err
	}

	return claims.UserID, nil
}
