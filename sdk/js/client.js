// Minimal JS SDK for plugin authors

export class HostClient {
  constructor({ baseUrl, pluginId }) {
    this.baseUrl = baseUrl || "http://localhost:8080";
    this.pluginId = pluginId;
  }

  async rpc(method, params) {
    const res = await fetch(`${this.baseUrl}/rpc`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method, params, pluginId: this.pluginId })
    });
    const data = await res.json();
    if (data.error) {
      const err = new Error(data.error.message);
      err.code = data.error.code;
      throw err;
    }
    return data.result;
  }

  async listFiles() {
    return this.rpc("vault.list", {});
  }

  async readFile(path) {
    return this.rpc("vault.read", { path });
  }

  async writeFile(path, content) {
    return this.rpc("vault.write", { path, content });
  }
}

