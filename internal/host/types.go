package host

type Config struct {
	RootDir    string
	PluginsDir string
	VaultDir   string
    MarketIndex string
}

type Manifest struct {
	ID            string       `json:"id"`
	Name          string       `json:"name"`
	Version       string       `json:"version"`
	MinAppVersion string       `json:"minAppVersion,omitempty"`
	Author        string       `json:"author,omitempty"`
	Description   string       `json:"description,omitempty"`
	Entrypoints   *Entrypoints `json:"entrypoints,omitempty"`
	Permissions   []string     `json:"permissions,omitempty"`
}

type Entrypoints struct {
	Frontend string `json:"frontend,omitempty"`
	Backend  string `json:"backend,omitempty"`
}

type Plugin struct {
	Manifest Manifest
}

type Command struct {
	ID       string `json:"id"`
	Title    string `json:"title"`
	PluginID string `json:"pluginId"`
}

