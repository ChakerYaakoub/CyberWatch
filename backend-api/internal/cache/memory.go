package cache

import (
	"context"
	"encoding/json"
	"sync"
	"time"
)

// Memory is an in-process Cache for unit tests (TTL-aware).
type Memory struct {
	mu    sync.RWMutex
	items map[string]memoryItem
}

type memoryItem struct {
	raw       []byte
	expiresAt time.Time
}

func NewMemory() *Memory {
	return &Memory{items: make(map[string]memoryItem)}
}

func (m *Memory) Get(_ context.Context, key string, dest any) bool {
	m.mu.RLock()
	item, ok := m.items[key]
	m.mu.RUnlock()
	if !ok {
		return false
	}
	if !item.expiresAt.IsZero() && time.Now().After(item.expiresAt) {
		m.mu.Lock()
		delete(m.items, key)
		m.mu.Unlock()
		return false
	}
	return json.Unmarshal(item.raw, dest) == nil
}

func (m *Memory) Set(_ context.Context, key string, value any, ttl time.Duration) {
	raw, err := json.Marshal(value)
	if err != nil {
		return
	}
	var expiresAt time.Time
	if ttl > 0 {
		expiresAt = time.Now().Add(ttl)
	}
	m.mu.Lock()
	m.items[key] = memoryItem{raw: raw, expiresAt: expiresAt}
	m.mu.Unlock()
}

func (m *Memory) Delete(_ context.Context, keys ...string) {
	m.mu.Lock()
	for _, key := range keys {
		delete(m.items, key)
	}
	m.mu.Unlock()
}

func (m *Memory) Ping(_ context.Context) error { return nil }
func (m *Memory) Close() error                 { return nil }

// Len reports stored keys (tests).
func (m *Memory) Len() int {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return len(m.items)
}

// Has reports whether key is present and not expired (tests).
func (m *Memory) Has(key string) bool {
	m.mu.RLock()
	item, ok := m.items[key]
	m.mu.RUnlock()
	if !ok {
		return false
	}
	if !item.expiresAt.IsZero() && time.Now().After(item.expiresAt) {
		return false
	}
	return true
}
