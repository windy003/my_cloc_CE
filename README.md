# GitHub Lines of Code Counter

一个用于统计 GitHub 仓库代码行数的 Chrome 浏览器扩展程序。

## 功能特点

- 🔢 **精确统计**: 统计 GitHub 仓库的总代码行数
- 📊 **详细信息**: 显示文件数量、跳过的文件数和语言分布
- 🎨 **原生风格**: 完美融合 GitHub 的界面设计
- 🚀 **智能缓存**: 1小时内重复查询使用缓存，提升性能
- 🌐 **代理支持**: 支持配置代理服务器访问
- ⚡ **实时反馈**: 加载动画和状态提示
- 🎯 **智能过滤**: 自动排除二进制文件、依赖包和构建产物

## 安装方法

1. 下载或克隆此项目到本地
2. 打开 Chrome 浏览器，访问 `chrome://extensions/`
3. 开启"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择项目文件夹

## 使用方法

1. 打开任意 GitHub 仓库页面
2. 在仓库信息区域会自动显示"Count Lines of Code"按钮
3. 点击按钮开始统计
4. 等待分析完成，查看详细统计结果

### 代理配置

如果需要使用代理访问 GitHub：

1. 在输入框中输入代理服务器地址（例如：`http://127.0.0.1:33000`）
2. 点击"Save"按钮保存设置
3. 清空输入框并保存可以移除代理设置

## 技术特性

### 文件类型识别

扩展会自动识别并跳过以下类型的文件：

- **媒体文件**: 图片、音频、视频文件
- **压缩文件**: zip、rar、7z 等压缩包
- **二进制文件**: 可执行文件、库文件、数据库文件
- **依赖目录**: node_modules、.git、dist、build 等
- **最小化文件**: .min.js、.bundle.css 等

### 支持的编程语言

自动识别并统计以下语言的代码行数：

- JavaScript/TypeScript
- Python
- Java/Kotlin/Scala
- C/C++
- C#/F#
- Go
- Rust
- PHP
- Ruby
- Swift
- HTML/CSS
- Shell
- SQL
- R
- Dart
- Vue/Svelte
- 配置文件 (JSON、YAML、XML)
- 文档文件 (Markdown)

### 性能优化

- **智能缓存**: 相同仓库1小时内使用缓存结果
- **并发处理**: 异步处理文件内容
- **内容检测**: 通过文件内容进一步验证文件类型
- **错误处理**: 优雅处理网络错误和文件读取错误

## 项目结构

```
my_cloc_CE/
├── manifest.json      # 扩展配置文件
├── background.js      # 后台脚本，处理文件分析
├── content.js         # 内容脚本，UI 交互
├── jszip.min.js       # ZIP 文件解析库
└── README.md          # 项目说明文档
```

## 技术实现

- **Manifest V3**: 使用最新的 Chrome 扩展标准
- **JSZip**: 用于解析 GitHub 下载的 ZIP 文件
- **Chrome Storage API**: 存储代理设置和缓存数据
- **GitHub API**: 获取仓库默认分支信息
- **CSS Variables**: 适配 GitHub 的主题样式

## 权限说明

- `activeTab`: 访问当前标签页内容
- `scripting`: 注入内容脚本
- `storage`: 保存用户设置和缓存
- `https://github.com/*`: 访问 GitHub 页面
- `https://api.github.com/`: 调用 GitHub API

## 开发说明

### 本地调试

1. 修改代码后，在扩展管理页面点击刷新按钮
2. 重新加载 GitHub 页面测试功能
3. 使用 F12 开发者工具查看控制台日志

### 代码结构

- `background.js`: 核心分析逻辑
  - `countLinesInZip()`: ZIP 文件解析和统计
  - `isBinary()`: 二进制文件检测
  - `getLanguage()`: 编程语言识别
  
- `content.js`: UI 界面逻辑
  - `injectUI()`: 动态注入界面元素
  - 事件处理和用户交互

## 更新日志

### v1.0 (当前版本)
- ✨ 基础代码行数统计功能
- 🎨 GitHub 原生风格界面
- 📊 文件数量和语言分布统计
- 🚀 智能缓存机制
- 🌐 代理服务器支持
- ⚡ 加载状态和错误提示

## 贡献指南

欢迎提交 Issue 和 Pull Request 来改进这个项目。

## 许可证

MIT License