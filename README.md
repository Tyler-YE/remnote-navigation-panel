# Document Navigator v1.0.0

这是当前 Document Navigator 的 GitHub 发布版，保留原本地版的 H1–H5、搜索、跳转、紧凑行距、面板高度修正和 Word 式展开行为。发布版本从 **1.0.0** 开始编号。

选择 **Show H1** 会先收起下级标题，仍可用箭头逐层展开到 H4、H5。级别选项不是硬性过滤器。

## GitHub 和 RemNote 分别负责什么

| 环节 | 用途 |
| --- | --- |
| GitHub 仓库 | 保存源码，供自己维护及 RemNote 审核 |
| GitHub Actions | 自动安装编译依赖、测试并生成插件 ZIP |
| GitHub Release | 保存 v1.0.0 的版本说明和下载附件，供长期分发 |
| RemNote 的 Upload plugin | 提交编译后的插件 ZIP，进入 RemNote 审核流程 |
| RemNote 插件页面 | 审核通过后安装使用 |

只把代码或 ZIP 放到 GitHub，并不会自动在 RemNote 中安装，也不会自动提交审核。这份包不使用 GitHub Pages。按下面的方法操作，无需在 Windows 上安装 Git 或 Node.js 来打包。

含 JavaScript 的插件需要提供公开 GitHub 源码并经过 RemNote 审核。默认设置 `unlisted: true`，供个人或分享链接使用；它不会在插件市场公开列表中展示，但仍需审核。公开 GitHub 仓库中的源码任何人可见。本包不包含你的笔记或账户凭据。

## 1. 创建 GitHub 仓库

1. 登录 GitHub，打开 https://github.com/new 。
2. Repository name 建议填 `remnote-document-navigator`。
3. Description 可填 `Word-style document outline for RemNote`。
4. 选择 **Public**。暂不勾选 Add a README、.gitignore 或 license，包里已有需要的项目文件。
5. 点击 **Create repository**。

## 2. 上传源代码

1. 将下载的 `RemNote-Document-Navigator-GitHub-v1.0.0.zip` 完整解压。
2. 进入解压后的 `RemNote-Document-Navigator-GitHub-v1.0.0` 文件夹。
3. 在空仓库页面点击 **uploading an existing file**；已有文件时点击 **Add file > Upload files**。
4. 将这个文件夹内的全部文件和子文件夹拖入网页。上传的是里面的内容，不是外层文件夹，也不是整个 ZIP。
5. 确认包括 `.github/workflows/build-plugin.yml`。如果 Windows 看不到点号开头的文件，可在资源管理器里开启显示隐藏项目。
6. Commit message 填 `Initial release v1.0.0`，提交到 `main`。

成功后，仓库首页应该直接显示 `package.json`、`README.md`、`src`、`public`、`scripts`、`tests` 和 `.github`。如果这些都藏在另一层文件夹内，Actions 找不到项目。

上传的文件少于 100 个，单个文件远小于 GitHub 网页上传限制。不要上传运行测试时产生的 `node_modules`、`dist` 或 `release` 文件夹。

## 3. 让 GitHub 生成安装包

1. 点击仓库上方 **Actions**。
2. 打开 **Build RemNote plugin**。上传到 main 会自动触发；如果没有开始，点击 **Run workflow > Run workflow**。
3. 等待本次运行显示成功。失败时点开失败的步骤查看日志。
4. 在本次运行页面底部找到 **Artifacts**，下载 **RemNote-plugin-package**。下载时需登录 GitHub。
5. 解压这个下载包一层，里面应有：

| 文件 | 用途 |
| --- | --- |
| `Document-Navigator-v1.0.0.zip` | 真正提交到 RemNote 的安装包；保持 ZIP 格式 |
| `INSTALL.txt` | 你的实际插件编号、仓库地址和审核通过后的安装地址 |
| `SHA256SUMS.txt` | 安装包校验值 |
| `build-report.json` | 本次构建的版本和源码 commit |

构建会自动把你的仓库地址写入安装包的 `manifest.json`。作者默认采用 GitHub 仓库所有者，插件 ID 默认是 `你的GitHub用户名小写-document-navigator`。例如用户 Alice 会生成 `alice-document-navigator`。示例不是已经创建好的插件地址。

源码中 `public/manifest.json` 的 OWNER/REPOSITORY 是构建模板；Actions 会在生成的 `dist/manifest.json` 中替换。直接压缩 public 或源码目录不能作为安装包。

## 4. 在 GitHub 发布 version 1.0

1. 回到仓库首页，打开右侧 **Releases**，点击 **Create a new release** 或 **Draft a new release**。
2. Tag 填 **v1.0.0**，创建新 tag；Target 选刚刚构建成功的 main 提交。
3. Release title 填 **Document Navigator v1.0.0**。
4. 描述可复制本仓库 `RELEASE-NOTES.md` 的内容。
5. 在附件区域上传第 3 步拿到的 `Document-Navigator-v1.0.0.zip`，可同时附上 `SHA256SUMS.txt`。
6. 检查后点击 **Publish release**。

这一步让你的 GitHub 上有一个明确的 1.0 版本和长期下载地址。它不会替你向 RemNote 提交插件。GitHub 自动附带的 **Source code (zip)** 是源码，不能用来替代编译后的插件 ZIP。Actions 下载产物保留 30 天，长期下载用 Release 附件。

## 5. 提交到 RemNote 并安装

1. 打开 RemNote，进入 **Settings > Plugins > Build**。
2. 点击 **Upload plugin**，选择 **Document-Navigator-v1.0.0.zip**。
3. 按页面要求完成提交并等待审核。Unlisted 的 JavaScript 插件同样需要审核，不保证提交后立即可用。
4. 审核通过后，打开 `INSTALL.txt` 中的插件地址，登录自己的 RemNote 账户并安装。
5. 到 **Settings > Plugins > Manage** 关闭旧的 localhost Document Navigator，避免出现两个相同名称的侧栏。
6. 重新加载 RemNote，打开文档，在右侧栏选 **Document Navigator**，确认标题旁显示 **v1.0.0**。也可按 Ctrl+K 搜索 **Open Document Navigator**。

新版采用单独的发布 ID，避免把旧本地版 v2.4.0 当成降级更新。新插件第一次使用时可能需要重新选择级别设置；不会修改你的笔记内容。

确认审核后的新版能运行，再到旧版文件夹运行 `DISABLE-AUTOSTART.cmd`（如果曾启用登录启动）和 `STOP-BACKGROUND.cmd`。正式安装的新插件由 RemNote 加载，不依赖之前的本地服务器。审核等待期间仍可继续使用旧版。

如果想出现在公开插件市场，将 `plugin.config.json` 中的 `unlisted` 改为 `false`，重新构建并提交。公开上架仍取决于 RemNote 审核和政策，本包不保证审核通过。

## 日常使用

| 选项或操作 | 效果 |
| --- | --- |
| Show H1 | 默认收起 H1 下的后代，保留父标题箭头 |
| Show H2 / H3 / H4 | 默认展开到相应级别 |
| All (H1–H5) | 展开全部支持的标题级别 |
| 标题旁箭头 | 继续展开或收起当前分支，允许超过所选级别 |
| 下拉框旁的小重置按钮 | 重新应用所选级别，清除手动展开状态 |
| 搜索 | 检索全部 H1–H5，临时展开匹配路径；清空后恢复 |
| 点击标题文字 | 跳转到原文中的标题 |

仅缩进或加粗不会被当成 H4/H5，需要 RemNote 原生标题样式。H4/H5 是否可读取取决于 RemNote 客户端 API。没有 H1、从 H2 开始的文档会保留根标题，确保仍能展开。

## 要检查程序，打开哪个文件

| 文件 | 内容 |
| --- | --- |
| `src/widgets/navigator.tsx` | 面板、下拉框、箭头、搜索与跳转交互 |
| `src/model.ts` | 标题树、默认展开级别和手动展开规则 |
| `src/document.ts` | 从 RemNote 读取标题以及定位原文 |
| `src/panel.css` | 紧凑行距、字体和内部滚动区域 |
| `src/usePanelHeight.ts`、`public/App.css` | 外层侧栏和内部 SDK 容器高度处理 |
| `plugin.config.json` | 作者、固定插件 ID、是否 unlisted |
| `package.json` | 发布版本号和依赖 |
| `build.mjs` | 生成 manifest、脚本和 RemNote 安装 ZIP |
| `.github/workflows/build-plugin.yml` | GitHub 自动测试与打包 |

初次提交后，建议把 INSTALL.txt 里的 Plugin ID 填入 `plugin.config.json` 的 `pluginId`，以后保持不变。这样即使转移仓库所有权，已安装的插件仍有相同身份。若系统提示 ID 已被他人注册，在第一次提交前改成自己的其他唯一 ID。

## 本地编译（可选）

只有想在 Windows 本地自行编译时才需要 Node.js 22.18 或更高兼容版本。在含 package.json 的目录打开终端，运行以下命令。将示例地址换成自己的真实公开仓库地址。

```powershell
npm ci
npm run typecheck
npm test
npm run build -- --repo=https://github.com/你的用户名/remnote-document-navigator
npm run verify:package
```

生成的插件在 `release` 文件夹内。这些命令只构建，不创建仓库、不推送代码、不发布 Release，也不向 RemNote 自动上传。

## 更新到后续版本

修改代码后，将 package.json 和 package-lock.json 中项目版本一致地改为 1.0.1；也可在本地执行 `npm version patch --no-git-tag-version`。生成的 manifest 版本以 package.json 为准。提交到 GitHub 后重新下载 Actions 安装包，在 RemNote 提交新版本，再建立对应的 v1.0.1 Release。已有插件必须保持同一个 Plugin ID。

## 常见问题

- **Actions 没出现**：确认 `.github/workflows/build-plugin.yml` 已上传到仓库根目录下的正确路径，主分支名为 main 或 master，仓库允许 GitHub Actions。
- **找不到 package.json**：源码被多包了一层文件夹，应将文件移到仓库根目录。
- **repoUrl 错误**：使用 Actions 产出的 ZIP；本地编译必须传入真实 GitHub 仓库地址，不能使用旧版的 127.0.0.1 地址或模板地址。
- **manifest 找不到**：上传了源码 ZIP 或 Actions 外层下载 ZIP。真正的安装 ZIP 打开后第一层就有 manifest.json。
- **插件地址打不开**：仓库和 Release 并不会自动创建 RemNote 插件页面，需要先提交并获批。
- **仍显示 v2.4.0**：当前打开的是旧本地版。安装获批的新版本后，禁用旧版，重新加载并确认 v1.0.0。
- **原生 H4/H5 不显示**：选 All 或展开父标题箭头，并确认客户端可以向插件 API 暴露这些标题样式。

## 验证范围

源码包含导航行为测试和发布配置测试，构建后会验证 ZIP 根目录、版本、仓库、权限、CSS 插件标识和校验值。已在模拟 RemNote SDK 宿主中验证关键交互；GitHub Actions 的真实运行、RemNote 审核和 Windows 客户端安装需要在你的账户完成后确认。

## 官方资料

- [RemNote：提交插件](https://plugins.remnote.com/advanced/submitting_plugins)
- [RemNote：Unlisted 插件及安装链接](https://plugins.remnote.com/advanced/unlisted_plugins)
- [RemNote：manifest 字段](https://plugins.remnote.com/advanced/manifest)
- [GitHub：上传文件](https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository)
- [GitHub：下载 Actions 产物](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/download-workflow-artifacts)
- [GitHub：创建 Release](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository)
