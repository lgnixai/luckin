package host

import (
    "encoding/json"
    "net/http"
    "sync"
)

type Event struct {
    Type string      `json:"type"`
    Data interface{} `json:"data,omitempty"`
}

type sseClient struct {
    ch   chan []byte
    done chan struct{}
}

type EventHub struct {
    mu      sync.RWMutex
    clients map[*sseClient]struct{}
}

func NewEventHub() *EventHub {
    return &EventHub{clients: make(map[*sseClient]struct{})}
}

func (h *EventHub) addClient(c *sseClient) {
    h.mu.Lock()
    h.clients[c] = struct{}{}
    h.mu.Unlock()
}

func (h *EventHub) removeClient(c *sseClient) {
    h.mu.Lock()
    delete(h.clients, c)
    h.mu.Unlock()
}

func (h *EventHub) Broadcast(ev Event) {
    payload, _ := json.Marshal(ev)
    msg := append([]byte("data: "), payload...)
    msg = append(msg, []byte("\n\n")...)
    h.mu.RLock()
    for c := range h.clients {
        select {
        case c.ch <- msg:
        default:
        }
    }
    h.mu.RUnlock()
}

func (h *PluginHost) handleSSE(w http.ResponseWriter, r *http.Request) {
    flusher, ok := w.(http.Flusher)
    if !ok {
        w.WriteHeader(http.StatusInternalServerError)
        return
    }
    w.Header().Set("Content-Type", "text/event-stream")
    w.Header().Set("Cache-Control", "no-cache")
    w.Header().Set("Connection", "keep-alive")

    client := &sseClient{ch: make(chan []byte, 16), done: make(chan struct{})}
    h.eventHub.addClient(client)
    defer func() { h.eventHub.removeClient(client) }()

    // Send a comment to open the stream
    _, _ = w.Write([]byte(":ok\n\n"))
    flusher.Flush()

    notify := r.Context().Done()
    for {
        select {
        case <-notify:
            return
        case msg := <-client.ch:
            if _, err := w.Write(msg); err != nil {
                return
            }
            flusher.Flush()
        }
    }
}

