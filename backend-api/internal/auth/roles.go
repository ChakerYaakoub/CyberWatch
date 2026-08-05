// Package auth defines application roles shared by JWT middleware and routes.
package auth

const (
	RoleAdmin   = "ADMIN"
	RoleAnalyst = "ANALYST"

	// Gin context keys set after successful JWT validation.
	ContextUserKey  = "authUser"
	ContextRolesKey = "authRoles"
)

// User is the authenticated principal extracted from the access token.
type User struct {
	Subject string
	Email   string
	Name    string
	Roles   []string
}

func (u User) HasRole(role string) bool {
	for _, r := range u.Roles {
		if r == role {
			return true
		}
	}
	return false
}

func (u User) IsAdmin() bool {
	return u.HasRole(RoleAdmin)
}

// IsAnalyst is true for ANALYST or ADMIN (admins can do analyst actions).
func (u User) IsAnalyst() bool {
	return u.HasRole(RoleAnalyst) || u.IsAdmin()
}
