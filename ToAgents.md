# X Keywords Blocker Agent Guide

这份文档用于帮助 Agent 快速理解仓库内容和脚本边界。它不描述某台机器的开发环境，也不规定个人工作习惯。

## 文件结构

| 文件 | 作用 |
| --- | --- |
| `x-keywords-blocker-v2.user.js` | Tampermonkey 用户脚本，包含 UI、词库读取、X 请求和任务队列 |
| `keywords.md` | 远程词库源文件，使用三级标题和反引号词条 |
| `README.md` | 面向使用者的安装、使用、原理和风险说明 |
| `LICENSE` | 项目许可证 |
| `ToAgents.md` | 本文件，面向 Agent 的代码结构和保护边界说明 |

## 脚本结构

脚本位于 `x-keywords-blocker-v2.user.js`，使用 IIFE 包裹，运行在 `https://x.com/*` 页面中。

主要区域如下：

1. **用户脚本元信息**
   - `@match` 限定 X 页面。
   - `@grant GM.xmlHttpRequest` 用于读取远程 `keywords.md`。
   - `@grant unsafeWindow` 用于访问页面上下文。

2. **接口常量和运行参数**
   - `CREATE_API`：创建屏蔽词。
   - `DELETE_API`：删除屏蔽词。
   - `LIST_API`：读取当前账户的屏蔽词。
   - 对应的 `*_SIGN` 常量用于请求签名或页面请求映射。
   - `KEYWORDS_URL`：远程词库地址。
   - `DELAY`：队列请求之间的等待时间，当前默认值为 `3000` 毫秒。
   - `RETRIES`：失败重试次数。

3. **词条和 Markdown 解析**
   - `parseWords()` 处理手动输入的词条。
   - 输入区支持普通空格、回车、换行和中英文逗号。
   - 输入完成后会显示为可删除、可双击编辑的胶囊词条。
   - `parseKeywordMarkdown()` 处理远程 `keywords.md`。
   - 只有 `### 分类名称` 和整行 `- \`词条\`` 或 `* \`词条\`` 会被加载。
   - 词条按规范化结果去重，单字词会被忽略。
   - 远程词库中的多词短语必须按文件原样保留。

4. **请求封装**
   - `api()` 负责向 X 发送请求，并处理 CSRF、headers、响应错误和签名。
   - `createKeyword()`、`listKeywords()`、`deleteKeyword()` 分别对应创建、列表和删除操作。
   - 当前页面会话负责携带登录 Cookie；不要把 Cookie、`auth_token`、`ct0` 或其他凭证写入文件、日志或截图。

5. **任务队列**
   - `runAdd()` 负责批量添加。
   - `runDelete()` 负责批量删除。
   - `sendWithRetry()` 负责可重试错误。
   - 停止操作只阻止尚未发送的请求，已经发送的请求不会回滚。
   - 任务结果会记录成功、重复、失败和可重试项目。

6. **界面**
   - UI 创建在脚本自己的 Shadow DOM 中。
   - 样式和元素使用 `xmks-` 前缀，避免污染宿主页面。
   - 当前界面包含批量添加、用户词库、远程词库、任务结果、参数确认和删除确认区域。
   - 修改 UI 时不能通过新增请求、改变调用顺序或修改参数来实现视觉效果。

## 后端保护边界

除非任务明确要求并有充分验证，不得修改以下内容：

- `CREATE_API`、`DELETE_API`、`LIST_API`。
- `CREATE_SIGN`、`DELETE_SIGN`、`LIST_SIGN`。
- `api()` 中的签名、CSRF 和 headers 处理。
- `mute_surfaces`、`mute_options`、`duration` 的参数映射。
- `DELAY` 的队列语义、`runAdd()`、`runDelete()`、`sendWithRetry()`、停止和重试行为。
- 添加前的列表读取、重复词判断和结果计数。

前端需求应在现有状态和事件模型内完成。不要为了刷新 UI 额外调用 `LIST_API`，不要在任务完成时偷偷增加请求，也不要把凭证打印到控制台。

## 词库格式

```markdown
### 广告引流

- `蓝标互粉`
- `涨粉`

### 广告引流

- `免费领取`
```

不要使用 `A 默认`、`B 自选` 等旧分类前缀；不要把说明文字写成列表项；不要加入单字词或未包在反引号中的词条。

## 阅读边界

Agent 应先阅读本文件，再根据具体任务阅读脚本对应区域。不要把本文件当成命令清单；它只用于说明仓库结构、脚本原理和不能越过的后端边界。
