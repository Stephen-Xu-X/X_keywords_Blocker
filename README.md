# X Keywords Blocker

这是一个运行在 `x.com` 页面里的 Tampermonkey 用户脚本，用来批量添加、查看和删除 X 屏蔽词。

我写它是因为 X 中文区的评论里经常会遇到广告、引流、色情骚扰和投资诈骗内容。X 官方设置页一次只能添加一条词，词库稍微大一点，手工维护就会变成重复劳动。这个脚本把这部分操作放到一个小面板里，词条仍然由 X 账户自己管理，请求也只发往 X。

## 安装

1. 安装 [Tampermonkey](https://www.tampermonkey.net/)。
2. 打开脚本的 [Raw 安装地址](https://raw.githubusercontent.com/Stephen-Xu-X/X_keywords_Blocker/main/x-keywords-blocker-v2.user.js)，在 Tampermonkey 中确认安装。
3. 打开已经登录的 [x.com](https://x.com/)。脚本图标会出现在 X 导航区域附近。

## 使用

打开脚本面板后，可以从三个页面进入：

- **批量添加**：输入词条，选择屏蔽位置、来源和时长，确认后逐条发送。
- **用户词库**：读取当前 X 账户已有的屏蔽词，可以搜索、筛选、批量选择和删除。
- **远程词库**：从仓库的 `keywords.md` 同步分类词条，选择后批量添加。

批量添加输入区支持普通空格、回车、换行和中英文逗号。输入分隔符后，词条会变成胶囊；单击胶囊右侧的 `×` 可以删除，双击词条可以重新编辑。远程词库中的多词短语会按词库文件原样保留。

## 官方屏蔽选项

X 的官方帮助页允许为每个词或短语设置以下选项：

| 设置 | 脚本值 |
| --- | --- |
| Home timeline | `home_timeline,tweet_replies` |
| Notifications | `notifications` |
| From anyone | 空的 `mute_options` |
| From people you don't follow | `exclude_following_accounts` |
| Forever | 空的 `duration` |
| 24 hours | `86400000` |
| 7 days | `604800000` |
| 30 days | `2592000000` |

官方说明：<https://help.x.com/en/using-x/advanced-x-mute-options>

X 的说明还提到：屏蔽词匹配不区分大小写，词条可以包含标点，也可以使用短语、用户名、表情符号和 hashtag。屏蔽主要影响通知和 Home timeline，通过搜索仍可能看到相关内容。具体行为以 X 当前页面为准。

## 词库格式

远程词库就是仓库根目录的 [`keywords.md`](./keywords.md)。文件只需要三级标题和带反引号的列表词条：

```markdown
### 广告引流

- `蓝标互粉`
- `涨粉`

### 投资引流

- `免费荐股`
- `快速获利`
```

解析规则很简单：

- `###` 是分类名称。
- 词库只读取两类内容：以 `### ` 开头的分类行，以及整行写成 `- \`词条\`` 或 `* \`词条\`` 的词条行。比如 `- \`广告\`` 会加载，普通句子、未加反引号的列表项和四级标题不会加载。
- 同一个词只保留一次，大小写按规范化结果去重。
- 单字词会被过滤，以减少误杀。
- 分类说明、四级标题和其他普通文本不会进入词库。

要维护自己的词库，可以编辑 `keywords.md`，提交到自己的仓库，再把脚本顶部的 `KEYWORDS_URL` 改成对应的 Raw 地址。脚本不会把词库写回 X 或其他服务器。

## 脚本原理

脚本在已经登录的 `x.com` 页面中运行，并把界面放进 Shadow DOM，避免样式污染 X 页面。添加、列表和删除操作调用 X 页面正在使用的 muted keywords 接口；当前浏览器会话负责携带登录 Cookie，脚本只读取当前请求需要的 `ct0`，不保存或上传 `auth_token`、Cookie 或其他账户凭证。

远程词库通过 Tampermonkey 的 `GM.xmlHttpRequest` 从 GitHub Raw 读取。批量任务会先读取现有词条，跳过规范化后已经存在的词，再按队列逐条请求。作者个人测试中，一个批次十几个到二十个词，在 `500ms` 间隔下可以完成添加和删除；这只是个人测试，不代表 X 官方保证，也不代表所有账户和网络环境都会得到相同结果。公开版本默认请求间隔为 `3000ms`，用于降低连续请求过快带来的风险。失败项可以重试，停止操作只阻止尚未发送的请求。

## 可手动调整

以下调整适合熟悉 JavaScript 和 X 请求流程的开发者。普通使用不需要改动脚本。

### 调整请求间隔

原代码：

```javascript
const DELAY = 3000;
```

例如改成 5 秒：

```javascript
const DELAY = 5000;
```

数值单位是毫秒。间隔越短，连续请求越密集，越容易遇到限流或验证。

### 调整屏蔽时长

官方页面目前只提供 Forever、24 hours、7 days 和 30 days 这几个选项。请求中的 `duration` 参数实际按毫秒计算，因此也可以自行尝试其他数值。

例如：

```javascript
duration: 86400
```

实测中，`86400` 可以表示约 24 分钟的屏蔽时长。这个值不属于官方界面提供的选项，X 是否接受、实际持续多久以及以后是否继续支持，都可能变化。可以自行测试，但不要把测试结果当成官方承诺。

### 更换远程词库

原代码：

```javascript
const KEYWORDS_URL = 'https://raw.githubusercontent.com/Stephen-Xu-X/X_keywords_Blocker/main/keywords.md';
```

替换成自己的 Raw 地址：

```javascript
const KEYWORDS_URL = 'https://raw.githubusercontent.com/<user>/<repo>/main/keywords.md';
```

不要为了排查普通问题修改 API 地址、签名路径、CSRF/header、请求参数、队列函数或重试逻辑。改错这些部分可能导致请求失败，也可能让账户遇到异常验证。

## Agent 开发入口

需要让 Codex、Claude 或其他代码 Agent 继续开发时，直接发送下面这段内容：

```text
git clone https://github.com/Stephen-Xu-X/X_keywords_Blocker.git
THEN READ ToAgents.md AND USE IT AS THE MUST-READ FILE BEFORE ANY SECONDARY DEVELOPMENT.
```

## 风险与限制

- 这是一个个人维护的用户脚本，不是 X 官方扩展。
- X 可能修改网页结构、内部接口、签名模块或限流规则，脚本因此可能失效。
- 批量请求可能触发限流、要求验证、限制功能，甚至导致账号被锁定或封禁。请控制批次大小，并在 X 页面确认结果。
- 使用前请遵守 X 服务条款和所在地区适用的法律法规。使用者自行承担操作后果。
