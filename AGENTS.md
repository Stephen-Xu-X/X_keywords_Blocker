# X Keywords Blocker 项目开发规则

## 项目目标

这是一个运行在 `x.com` 页面内的 Tampermonkey 用户脚本，用于读取远程 `keywords.md`、批量创建 X muted keywords、查看现有词条和删除词条。

当前交付脚本：`x-keywords-blocker-v2.user.js`。

## 绝对边界

- 后端请求逻辑已经验证成功，除非任务明确要求，不得修改以下内容：
  - `CREATE_API`、`DELETE_API`、`LIST_API` 及其签名路径；
  - `csrf()`、webpack signer、`transactionId()`、`api()`；
  - `mute_surfaces`、`mute_options`、`duration` 的请求映射；
  - 添加、删除的 500ms 队列、停止、重试和结果计数语义。
- 前端重构只能修改 Shadow DOM 内的 DOM、CSS、标签、布局和交互绑定。
- 不要把 X Cookie、`auth_token`、`ct0` 或个人会话数据写入文件、日志、README 或 Git 历史。
- 不要使用 CDP 刷新或导航 X；调试前如有需要只使用临时 `window.stop()`。

## 词库格式

`keywords.md` 只使用最小格式：

```markdown
### 分类名称

- `关键词`
- `multi word phrase`
```

- 只有 `###` 分类和整行 `- \`词条\`` 会被解析。
- 单字词由脚本过滤，避免宽泛误杀。
- 不要依赖四级标题、分类说明或脚本内置词库。

## 前端设计参考

- Slush 设计参考：`docs/DESIGN (3).md`、`docs/tokens (1).json`。
- 参考 Slush 的明亮纸张、贴纸式色彩、圆润层次和强分类感，但界面必须保持工作台属性，不做营销落地页。
- 所有样式放在 Shadow DOM 内，避免污染 X 页面。

## 本地验证

使用 PowerShell 7，不要显式调用 Windows PowerShell 5.1：

```powershell
$PSVersionTable.PSVersion
node --check .\x-keywords-blocker-v2.user.js
git diff --check
git status --short --branch
```

真实 PowerShell 7 由 `Get-Command pwsh` 获取；不要使用用户目录下的空 App Execution Alias。

## Git 交付

```powershell
git status --short --branch
git add -- README.md keywords.md x-keywords-blocker-v2.user.js AGENTS.md
git commit -m "Describe the change"
git push origin main
```

如果 Git 传输不可用，使用已认证 GitHub CLI 的 Contents API 更新明确文件，不要强制推送或重写远程历史。

## 审查流程

1. Sol 负责 UI/UX 重构，不修改后端逻辑。
2. Terra 负责只读代码审查。
3. Terra 的问题原样回传 Sol 修复，不能由主代理绕过审查自行改动 Sol 负责的前端方案。
4. Terra 复审通过后再提交 GitHub。
