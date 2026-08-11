# X Keywords Blocker

一个运行在 `x.com` 页面内的 Tampermonkey 用户脚本，用于批量添加、查看和删除 X 屏蔽词。请求直接发送到 X，不经过第三方服务器。

当前发布脚本：`x-keywords-blocker-v2.user.js`。

## 脚本介绍

X 原生设置页通常要求逐条添加屏蔽词。脚本把多个词条整理成队列，按 500ms 间隔逐条调用 X 已加载的内部接口，并提供执行前参数确认、重复词预检查、停止剩余队列、失败项重试和删除管理。

脚本不内置屏蔽词，只从 GitHub Raw 读取 `keywords.md`。远程词库首次加载失败时保持空状态；已经成功加载过远程版本后，刷新失败会保留上一次成功版本。

## 功能

- 远程词库：从 GitHub Raw 同步分类和词条。
- 用户词库：读取当前 X 账户已有的屏蔽词。
- 批量添加：支持换行、中文和英文逗号、分号分隔。
- 参数确认：Home timeline、Notifications、From anyone、From people you don't follow，以及 Forever、24 hours、7 days、30 days。
- 重复预检查：添加前读取已有词条，跳过规范化后重复的词。
- 任务托盘：显示成功、已存在、失败和未执行队列。
- 停止剩余任务：只阻止后续请求，不撤销已经发送的请求。
- 删除管理：支持搜索、多选、单项删除、批量删除和失败重试。
- 单字过滤：词库中的单字词不会进入可选列表，降低误杀风险。

## 官方规则参考

官方帮助页说明了 X 的高级屏蔽词选项。脚本中的参数对应关系如下：

| 官方选项 | 脚本请求值 |
| --- | --- |
| Home timeline | `home_timeline,tweet_replies` |
| Notifications | `notifications` |
| From anyone | `mute_options=` |
| From people you don't follow | `mute_options=exclude_following_accounts` |
| Forever | `duration=` |
| 24 hours | `duration=86400000` |
| 7 days | `duration=604800000` |
| 30 days | `duration=2592000000` |

官方参考：[Advanced X mute options](https://help.x.com/en/using-x/advanced-x-mute-options)

脚本只是把官方页面中的单条操作排成队列，不改变 X 的屏蔽范围、来源或时长语义。X 的网页界面和内部接口可能变化，使用时请控制批量规模并自行确认结果。

## 词库格式

词库只使用三级标题分类和列表词条：

```markdown
### 广告引流

- `蓝V互粉`
- `涨粉`
- `multi word phrase`

### 色情骚扰

- `AI裸照`
- `同城上门`
```

规则：

- `###` 表示分类名称。
- 只有整行 `- \`词条\`` 会被加载。
- 不使用四级标题或分类说明。
- 单字词会被脚本过滤。
- 远程词库地址：`https://raw.githubusercontent.com/Stephen-Xu-X/X_keywords_Blocker/main/keywords.md`

## 脚本原理

1. Tampermonkey 在 `x.com` 页面注入 Shadow DOM 工作台，样式不会污染 X 页面。
2. 脚本通过当前页面的 `ct0` 和 X 已加载的 webpack signing module 生成同源请求所需的 CSRF 与 transaction ID。
3. 浏览器自动携带当前登录 Cookie；脚本不读取、不保存、不上传 `auth_token` 或其他账户凭证。
4. 添加请求使用 X 的 `mutes/keywords/create.json`，列表使用 `list.json`，删除使用 `destroy.json`。
5. 远程词库通过 Tampermonkey `GM.xmlHttpRequest` 读取 GitHub Raw，并使用严格 Markdown 解析器转换为分类和词条。

## 本地开发

需要 Node.js、Git 和 PowerShell 7。Windows PowerShell 5.1 不作为默认开发 Shell。

```powershell
$PSVersionTable.PSVersion
(Get-Command pwsh).Source

node --check .\x-keywords-blocker-v2.user.js
git diff --check
git status --short --branch

git add -- README.md keywords.md x-keywords-blocker-v2.user.js AGENTS.md
git commit -m "Describe the change"
git push origin main
```

如果 Git 传输不可用，使用已认证的 `gh api` Contents API 更新明确文件，不要强制推送或重写远程历史。

## Agent 开发入口

项目级开发约束见 [AGENTS.md](./AGENTS.md)。其中包含后端请求逻辑不可变边界、Slush 设计参考、词库格式和单字过滤规则、PowerShell 7 验证指令，以及 Sol/Terra 协作流程。

## 安全与限制

- Cookie 由浏览器自动携带，不写入脚本或仓库。
- CSRF token 只用于当前 X 同源请求。
- 不要在 Issue、日志或截图中提交 Cookie、`auth_token` 或 `ct0`。
- 本项目使用 X 的内部 Web 接口，可能随 X 前端更新而变化。
