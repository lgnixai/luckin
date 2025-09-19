## 版本与分发

- **语义化版本**: Host 与 SDK 按 semver 发布；/rpc 接口保持后向兼容，破坏性变更进入 v2 命名空间。
- **插件兼容**: manifest.minAppVersion 控制最低兼容 Host 版本。
- **市场**: 维护 `index.json`（{id, name, version, url, sha256}...）；Host 支持从市场拉取与校验。
- **安装与更新**: 下载插件包后校验 sha256 与 manifest，写入 plugins/<id>/。

