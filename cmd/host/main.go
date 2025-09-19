package main

import (
	"log"
	"os"
	"path/filepath"

	"example.com/pluginhost/internal/host"
)

func getenv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func main() {
	root := getenv("HOST_ROOT", ".")
	pluginsDir := getenv("HOST_PLUGINS_DIR", filepath.Join(root, "plugins"))
	vaultDir := getenv("HOST_VAULT_DIR", filepath.Join(root, "vault"))
	addr := getenv("HOST_ADDR", ":8080")

	cfg := host.Config{RootDir: root, PluginsDir: pluginsDir, VaultDir: vaultDir}
	h := host.NewPluginHost(cfg)
	if err := h.LoadPlugins(); err != nil {
		log.Fatalf("load plugins: %v", err)
	}
	log.Printf("Loaded %d plugins from %s", h.CountPlugins(), pluginsDir)

	if err := h.StartHTTPServer(addr); err != nil {
		log.Fatal(err)
	}
}

