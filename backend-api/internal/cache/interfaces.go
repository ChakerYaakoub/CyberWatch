package cache

import (
	"context"
	"time"
)

// Cache is a read-through / write-aside store. Implementations must never
// surface Redis errors to callers in a way that fails business requests —
// Get returns ok=false on miss or backend failure; Set/Delete are best-effort.
type Cache interface {
	Get(ctx context.Context, key string, dest any) (ok bool)
	Set(ctx context.Context, key string, value any, ttl time.Duration)
	Delete(ctx context.Context, keys ...string)
	Ping(ctx context.Context) error
	Close() error
}
