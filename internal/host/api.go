package host

import (
    "encoding/json"
    "log"
    "net/http"
    "path/filepath"
)

type rpcRequest struct {
	ID       string          `json:"id,omitempty"`
	Method   string          `json:"method"`
	Params   json.RawMessage `json:"params,omitempty"`
	PluginID string          `json:"pluginId,omitempty"`
}

type rpcResponse struct {
	ID     string   `json:"id,omitempty"`
	Result any      `json:"result,omitempty"`
	Error  *rpcError `json:"error,omitempty"`
}

type rpcError struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
}

func (h *PluginHost) StartHTTPServer(addr string) error {
	mux := http.NewServeMux()
	mux.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(200)
		_, _ = w.Write([]byte("ok"))
	})
    mux.HandleFunc("/events", h.handleSSE)
	mux.HandleFunc("/rpc", h.handleRPC)
    mux.HandleFunc("/market", h.handleMarket)
    // Serve SDK and plugin static assets
    sdkDir := filepath.Join(h.config.RootDir, "sdk")
    webDir := filepath.Join(h.config.RootDir, "web")
    mux.Handle("/sdk/", http.StripPrefix("/sdk/", http.FileServer(http.Dir(sdkDir))))
    mux.Handle("/plugins/", http.StripPrefix("/plugins/", http.FileServer(http.Dir(h.config.PluginsDir))))
    mux.Handle("/web/", http.StripPrefix("/web/", http.FileServer(http.Dir(webDir))))
	log.Printf("HTTP server listening on %s", addr)
	return http.ListenAndServe(addr, mux)
}

func (h *PluginHost) handleRPC(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	var req rpcRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeRPCError(w, req.ID, 400, "invalid json")
		return
	}
	switch req.Method {
    case "host.getPlugins":
        type pluginInfo struct {
            ID          string       `json:"id"`
            Name        string       `json:"name"`
            Version     string       `json:"version"`
            Entrypoints *Entrypoints `json:"entrypoints,omitempty"`
        }
        h.pluginsMu.RLock()
        infos := make([]pluginInfo, 0, len(h.plugins))
        for _, p := range h.plugins {
            infos = append(infos, pluginInfo{ID: p.Manifest.ID, Name: p.Manifest.Name, Version: p.Manifest.Version, Entrypoints: p.Manifest.Entrypoints})
        }
        h.pluginsMu.RUnlock()
        writeRPCResult(w, req.ID, infos)
	case "vault.list":
		if !h.hasPermission(req.PluginID, "vault.read") {
			writeRPCError(w, req.ID, 403, "missing permission: vault.read")
			return
		}
		paths, err := h.listVaultFiles()
		if err != nil {
			writeRPCError(w, req.ID, 500, err.Error())
			return
		}
		writeRPCResult(w, req.ID, paths)
	case "vault.read":
		if !h.hasPermission(req.PluginID, "vault.read") {
			writeRPCError(w, req.ID, 403, "missing permission: vault.read")
			return
		}
		var p struct{ Path string `json:"path"` }
		if err := json.Unmarshal(req.Params, &p); err != nil || p.Path == "" {
			writeRPCError(w, req.ID, 400, "missing path")
			return
		}
		data, err := h.readVaultFile(p.Path)
		if err != nil {
			writeRPCError(w, req.ID, 404, err.Error())
			return
		}
		writeRPCResult(w, req.ID, struct {
			Path    string `json:"path"`
			Content string `json:"content"`
		}{Path: p.Path, Content: string(data)})
	case "vault.write":
		if !h.hasPermission(req.PluginID, "vault.write") {
			writeRPCError(w, req.ID, 403, "missing permission: vault.write")
			return
		}
		var p struct {
			Path    string `json:"path"`
			Content string `json:"content"`
		}
		if err := json.Unmarshal(req.Params, &p); err != nil || p.Path == "" {
			writeRPCError(w, req.ID, 400, "missing params")
			return
		}
		if err := h.writeVaultFile(p.Path, []byte(p.Content)); err != nil {
			writeRPCError(w, req.ID, 500, err.Error())
			return
		}
		writeRPCResult(w, req.ID, struct{ Ok bool `json:"ok"` }{Ok: true})
    case "commands.register":
        if !h.hasPermission(req.PluginID, "commands.register") {
            writeRPCError(w, req.ID, 403, "missing permission: commands.register")
            return
        }
        var p struct {
            ID    string `json:"id"`
            Title string `json:"title"`
        }
        if err := json.Unmarshal(req.Params, &p); err != nil || p.ID == "" || p.Title == "" {
            writeRPCError(w, req.ID, 400, "missing params")
            return
        }
        h.registerCommand(Command{ID: p.ID, Title: p.Title, PluginID: req.PluginID})
        writeRPCResult(w, req.ID, struct{ Ok bool `json:"ok"` }{Ok: true})
    case "commands.list":
        cmds := h.listCommands()
        writeRPCResult(w, req.ID, cmds)
    case "commands.invoke":
        var p struct{ ID string `json:"id"` }
        if err := json.Unmarshal(req.Params, &p); err != nil || p.ID == "" || req.PluginID == "" {
            writeRPCError(w, req.ID, 400, "missing params")
            return
        }
        ok := h.invokeCommand(req.PluginID, p.ID)
        if !ok {
            writeRPCError(w, req.ID, 404, "unknown command")
            return
        }
        writeRPCResult(w, req.ID, struct{ Ok bool `json:"ok"` }{Ok: true})
	default:
		writeRPCError(w, req.ID, 404, "unknown method")
	}
}

func (h *PluginHost) handleMarket(w http.ResponseWriter, r *http.Request) {
    switch r.Method {
    case http.MethodGet:
        items, err := h.fetchMarketIndex()
        if err != nil {
            w.WriteHeader(http.StatusBadGateway)
            _, _ = w.Write([]byte(err.Error()))
            return
        }
        w.Header().Set("Content-Type", "application/json")
        _ = json.NewEncoder(w).Encode(items)
    case http.MethodPost:
        var p struct {
            ID     string `json:"id"`
            URL    string `json:"url"`
            SHA256 string `json:"sha256"`
        }
        if err := json.NewDecoder(r.Body).Decode(&p); err != nil || p.ID == "" || p.URL == "" {
            w.WriteHeader(http.StatusBadRequest)
            return
        }
        if err := h.installPluginFromURL(p.ID, p.URL, p.SHA256); err != nil {
            w.WriteHeader(http.StatusBadRequest)
            _, _ = w.Write([]byte(err.Error()))
            return
        }
        w.WriteHeader(http.StatusCreated)
    case http.MethodDelete:
        id := r.URL.Query().Get("id")
        if id == "" {
            w.WriteHeader(http.StatusBadRequest)
            return
        }
        if err := h.uninstallPlugin(id); err != nil {
            w.WriteHeader(http.StatusBadRequest)
            _, _ = w.Write([]byte(err.Error()))
            return
        }
        w.WriteHeader(http.StatusNoContent)
    default:
        w.WriteHeader(http.StatusMethodNotAllowed)
    }
}

func writeRPCResult(w http.ResponseWriter, id string, result any) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(rpcResponse{ID: id, Result: result})
}

func writeRPCError(w http.ResponseWriter, id string, code int, msg string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(httpStatusForCode(code))
	_ = json.NewEncoder(w).Encode(rpcResponse{ID: id, Error: &rpcError{Code: code, Message: msg}})
}

func httpStatusForCode(code int) int {
	switch code {
	case 400:
		return http.StatusBadRequest
	case 401:
		return http.StatusUnauthorized
	case 403:
		return http.StatusForbidden
	case 404:
		return http.StatusNotFound
	default:
		return http.StatusInternalServerError
	}
}

