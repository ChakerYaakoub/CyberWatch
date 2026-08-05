package cache

import (
	"context"
	"encoding/json"
	"log"
	"strings"
	"sync/atomic"
	"time"

	"github.com/redis/go-redis/v9"
)

const (
	redisDialTimeout  = 200 * time.Millisecond
	redisReadTimeout  = 200 * time.Millisecond
	redisWriteTimeout = 200 * time.Millisecond
	redisPoolTimeout  = 200 * time.Millisecond
	// When Redis is down, skip all ops for this long so requests stay fast.
	redisCooldown = 5 * time.Second
)

// Redis implements Cache with go-redis v9. All operations soft-fail:
// errors are logged and treated as miss / no-op so PostgreSQL remains source of truth.
type Redis struct {
	client    *redis.Client
	live      atomic.Bool
	downUntil atomic.Int64 // unix nano; skip Redis until this time when live=false
}

// NewFromURL builds a Redis cache from REDIS_URL.
// Empty URL → Noop. Unreachable Redis → soft-fail with circuit breaker (no request stalls).
func NewFromURL(redisURL string) (Cache, error) {
	redisURL = strings.TrimSpace(redisURL)
	if redisURL == "" {
		log.Printf("cache: REDIS_URL unset — caching disabled")
		return NewNoop(), nil
	}

	opts, err := redis.ParseURL(redisURL)
	if err != nil {
		return nil, err
	}
	opts.DialTimeout = redisDialTimeout
	opts.ReadTimeout = redisReadTimeout
	opts.WriteTimeout = redisWriteTimeout
	opts.PoolTimeout = redisPoolTimeout
	opts.MaxRetries = 0
	opts.MinRetryBackoff = 0
	opts.MaxRetryBackoff = 0

	client := redis.NewClient(opts)
	r := &Redis{client: client}

	ctx, cancel := context.WithTimeout(context.Background(), redisDialTimeout)
	defer cancel()
	if err := client.Ping(ctx).Err(); err != nil {
		log.Printf("cache: redis unavailable at startup (%v) — using PostgreSQL (will retry every %s)", err, redisCooldown)
		r.markDown(err)
	} else {
		log.Printf("cache: redis connected")
		r.live.Store(true)
	}

	return r, nil
}

func (r *Redis) Get(ctx context.Context, key string, dest any) bool {
	if !r.allowAttempt() {
		return false
	}

	opCtx, cancel := context.WithTimeout(ctx, redisReadTimeout)
	defer cancel()

	raw, err := r.client.Get(opCtx, key).Bytes()
	if err == redis.Nil {
		log.Printf("cache: miss key=%s", key)
		return false
	}
	if err != nil {
		r.markDown(err)
		log.Printf("cache: miss key=%s (redis error: %v)", key, err)
		return false
	}
	if err := json.Unmarshal(raw, dest); err != nil {
		log.Printf("cache: miss key=%s (decode error: %v)", key, err)
		_ = r.client.Del(opCtx, key).Err()
		return false
	}
	r.markUp()
	log.Printf("cache: hit key=%s", key)
	return true
}

func (r *Redis) Set(ctx context.Context, key string, value any, ttl time.Duration) {
	if !r.allowAttempt() {
		return
	}

	raw, err := json.Marshal(value)
	if err != nil {
		log.Printf("cache: set skipped key=%s (encode error: %v)", key, err)
		return
	}

	opCtx, cancel := context.WithTimeout(ctx, redisWriteTimeout)
	defer cancel()
	if err := r.client.Set(opCtx, key, raw, ttl).Err(); err != nil {
		r.markDown(err)
		log.Printf("cache: set failed key=%s: %v", key, err)
		return
	}
	r.markUp()
}

func (r *Redis) Delete(ctx context.Context, keys ...string) {
	if len(keys) == 0 || !r.allowAttempt() {
		return
	}

	opCtx, cancel := context.WithTimeout(ctx, redisWriteTimeout)
	defer cancel()
	if err := r.client.Del(opCtx, keys...).Err(); err != nil {
		r.markDown(err)
		log.Printf("cache: delete failed keys=%v: %v", keys, err)
		return
	}
	r.markUp()
}

func (r *Redis) Ping(ctx context.Context) error {
	opCtx, cancel := context.WithTimeout(ctx, redisDialTimeout)
	defer cancel()
	err := r.client.Ping(opCtx).Err()
	if err != nil {
		r.markDown(err)
		return err
	}
	r.markUp()
	return nil
}

func (r *Redis) Close() error {
	return r.client.Close()
}

// allowAttempt is true when Redis is live, or when the cooldown expired (one probe).
func (r *Redis) allowAttempt() bool {
	if r.live.Load() {
		return true
	}
	return time.Now().UnixNano() >= r.downUntil.Load()
}

func (r *Redis) markDown(err error) {
	wasLive := r.live.Swap(false)
	r.downUntil.Store(time.Now().Add(redisCooldown).UnixNano())
	if wasLive {
		log.Printf("cache: redis connection lost (%v) — using PostgreSQL for %s", err, redisCooldown)
	}
}

func (r *Redis) markUp() {
	if !r.live.Swap(true) {
		r.downUntil.Store(0)
		log.Printf("cache: redis reconnect")
	}
}
