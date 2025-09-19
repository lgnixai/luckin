package host

import (
    "crypto/sha256"
    "encoding/hex"
    "encoding/json"
    "fmt"
    "io"
    "net/http"
    "os"
    "path/filepath"
    "strings"
)

type MarketItem struct {
    ID      string `json:"id"`
    Name    string `json:"name"`
    Version string `json:"version"`
    URL     string `json:"url"`
    SHA256  string `json:"sha256"`
    Desc    string `json:"description,omitempty"`
}

func (h *PluginHost) fetchMarketIndex() ([]MarketItem, error) {
    src := h.config.MarketIndex
    if src == "" {
        // Use local fallback from /plugins/index.json if exists
        p := filepath.Join(h.config.PluginsDir, "index.json")
        b, err := os.ReadFile(p)
        if err != nil {
            if os.IsNotExist(err) {
                return []MarketItem{}, nil
            }
            return nil, err
        }
        var items []MarketItem
        if err := json.Unmarshal(b, &items); err != nil {
            return nil, err
        }
        return items, nil
    }
    // Remote fetch
    resp, err := http.Get(src)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()
    b, err := io.ReadAll(resp.Body)
    if err != nil {
        return nil, err
    }
    var items []MarketItem
    if err := json.Unmarshal(b, &items); err != nil {
        return nil, err
    }
    return items, nil
}

func (h *PluginHost) installPluginFromURL(id, url, wantSHA string) error {
    resp, err := http.Get(url)
    if err != nil {
        return err
    }
    defer resp.Body.Close()
    data, err := io.ReadAll(resp.Body)
    if err != nil {
        return err
    }
    if wantSHA != "" {
        sum := sha256.Sum256(data)
        hexsum := hex.EncodeToString(sum[:])
        if !strings.EqualFold(hexsum, wantSHA) {
            return fmt.Errorf("sha256 mismatch")
        }
    }
    // Expect a single-file manifest.json or a zip in future; for v1 assume JSON bundle
    // with fields: files: {path -> base64 or text}. For now, accept a simple manifest.json
    // placed as-is if content-type is application/json and contains manifest.id
    var mf Manifest
    if err := json.Unmarshal(data, &mf); err == nil && mf.ID != "" {
        // single manifest file plugin (trivial demo)
        dir := filepath.Join(h.config.PluginsDir, mf.ID)
        if err := os.MkdirAll(dir, 0o755); err != nil {
            return err
        }
        if err := os.WriteFile(filepath.Join(dir, "manifest.json"), data, 0o644); err != nil {
            return err
        }
        h.pluginsMu.Lock()
        h.plugins[mf.ID] = &Plugin{Manifest: mf}
        h.pluginsMu.Unlock()
        return nil
    }
    return fmt.Errorf("unsupported plugin package format")
}

func (h *PluginHost) uninstallPlugin(id string) error {
    dir := filepath.Join(h.config.PluginsDir, id)
    if err := os.RemoveAll(dir); err != nil {
        return err
    }
    h.pluginsMu.Lock()
    delete(h.plugins, id)
    h.pluginsMu.Unlock()
    return nil
}

