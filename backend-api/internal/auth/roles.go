package auth

const (
	RoleAdmin   = "ADMIN"
	RoleAnalyst = "ANALYST"

	ContextUserKey  = "authUser"
	ContextRolesKey = "authRoles"
)

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

func (u User) IsAnalyst() bool {
	return u.HasRole(RoleAnalyst) || u.IsAdmin()
}
