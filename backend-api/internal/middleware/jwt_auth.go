package middleware

import (
	"context"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/MicahParks/keyfunc/v3"
	"github.com/cyberwatch/backend-api/internal/auth"
	"github.com/cyberwatch/backend-api/internal/response"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

type JWTConfig struct {
	KeycloakURL string
	Realm       string
	Audience    string // optional; cyberwatch-api client id when using audience validation
}

type Claims struct {
	Email             string                          `json:"email"`
	PreferredUsername string                          `json:"preferred_username"`
	Name              string                          `json:"name"`
	RealmAccess       RealmAccess                     `json:"realm_access"`
	ResourceAccess    map[string]ClientResourceAccess `json:"resource_access"`
	jwt.RegisteredClaims
}

type RealmAccess struct {
	Roles []string `json:"roles"`
}

type ClientResourceAccess struct {
	Roles []string `json:"roles"`
}

func NewJWTAuth(cfg JWTConfig) (gin.HandlerFunc, error) {
	jwksURL := fmt.Sprintf("%s/realms/%s/protocol/openid-connect/certs",
		strings.TrimRight(cfg.KeycloakURL, "/"),
		cfg.Realm,
	)
	issuer := fmt.Sprintf("%s/realms/%s", strings.TrimRight(cfg.KeycloakURL, "/"), cfg.Realm)

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	var jwks keyfunc.Keyfunc
	var lastErr error
	for attempt := 1; attempt <= 5; attempt++ {
		jwks, lastErr = keyfunc.NewDefaultCtx(ctx, []string{jwksURL})
		if lastErr == nil {
			break
		}
		time.Sleep(time.Duration(attempt) * time.Second)
	}
	if lastErr != nil {
		return nil, fmt.Errorf("load Keycloak JWKS from %s: %w", jwksURL, lastErr)
	}

	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		if header == "" || !strings.HasPrefix(strings.ToLower(header), "bearer ") {
			response.Error(c, http.StatusUnauthorized, "missing or invalid authorization header")
			return
		}

		tokenString := strings.TrimSpace(header[7:])
		claims := &Claims{}

		token, err := jwt.ParseWithClaims(tokenString, claims, jwks.Keyfunc, jwt.WithIssuer(issuer))
		if err != nil || !token.Valid {
			response.Error(c, http.StatusUnauthorized, "invalid or expired token")
			return
		}

		roles := extractRoles(claims, cfg.Audience)
		if len(roles) == 0 {
			// Still authenticated, but no app roles — later RequireRole will 403.
			roles = []string{}
		}

		user := auth.User{
			Subject: claims.Subject,
			Email:   firstNonEmpty(claims.Email, claims.PreferredUsername),
			Name:    firstNonEmpty(claims.Name, claims.PreferredUsername, claims.Email),
			Roles:   roles,
		}

		c.Set(auth.ContextUserKey, user)
		c.Set(auth.ContextRolesKey, roles)
		c.Next()
	}, nil
}

func RequireRoles(allowed ...string) gin.HandlerFunc {
	allowedSet := make(map[string]struct{}, len(allowed))
	for _, role := range allowed {
		allowedSet[role] = struct{}{}
	}

	return func(c *gin.Context) {
		raw, ok := c.Get(auth.ContextUserKey)
		if !ok {
			response.Error(c, http.StatusUnauthorized, "unauthorized")
			return
		}

		user, ok := raw.(auth.User)
		if !ok {
			response.Error(c, http.StatusUnauthorized, "unauthorized")
			return
		}

		for _, role := range user.Roles {
			if _, exists := allowedSet[role]; exists {
				c.Next()
				return
			}
		}

		response.Error(c, http.StatusForbidden, "forbidden")
	}
}

func extractRoles(claims *Claims, apiClientID string) []string {
	seen := map[string]struct{}{}
	var roles []string

	add := func(list []string) {
		for _, role := range list {
			role = strings.TrimSpace(role)
			if role == "" {
				continue
			}
			if role != auth.RoleAdmin && role != auth.RoleAnalyst {
				continue
			}
			if _, ok := seen[role]; ok {
				continue
			}
			seen[role] = struct{}{}
			roles = append(roles, role)
		}
	}

	add(claims.RealmAccess.Roles)
	if apiClientID != "" {
		if clientRoles, ok := claims.ResourceAccess[apiClientID]; ok {
			add(clientRoles.Roles)
		}
	}
	// Also check frontend client roles if present.
	for clientID, access := range claims.ResourceAccess {
		if clientID == apiClientID {
			continue
		}
		add(access.Roles)
	}

	return roles
}

func firstNonEmpty(values ...string) string {
	for _, v := range values {
		if strings.TrimSpace(v) != "" {
			return v
		}
	}
	return ""
}

// TestAuth injects a fake authenticated user (for unit tests only).
func TestAuth(user auth.User) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Set(auth.ContextUserKey, user)
		c.Set(auth.ContextRolesKey, user.Roles)
		c.Next()
	}
}
