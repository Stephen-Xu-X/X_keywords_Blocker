# X Keywords Blocker

一个运行在 `x.com` 页面内的开源 Tampermonkey 工具，用于批量添加、查看和删除 X 屏蔽词。请求直接发送到 X，不经过第三方服务器。

## 安装

安装 `x-keywords-blocker.user.js` 到 Tampermonkey。脚本本身可独立运行，并从 GitHub Raw 读取 `keywords.md`；远程读取失败时会回退到内置词库。

## Studio 功能

- 批量添加，支持换行、中英文逗号和分号。
- 选择 Home timeline、Notifications 或两者。
- 选择 From anyone 或 From people you don't follow。
- 选择 Forever、24 hours、7 days 或 30 days。
- 读取现有屏蔽词，并显示位置、来源和时长标签。
- 搜索、多选、单项删除和批量删除。
- 按类别展示默认词库，以胶囊形式选择后批量添加。
- 请求间隔 0.5 秒，支持停止与逐项结果。

## 请求参数

| UI | 请求值 |
| --- | --- |
| Home timeline | `home_timeline,tweet_replies` |
| Notifications | `notifications` |
| From anyone | `mute_options=` |
| From people you don't follow | `mute_options=exclude_following_accounts` |
| Forever | `duration=` |
| 24 hours | `duration=86400000` |
| 7 days | `duration=604800000` |
| 30 days | `duration=2592000000` |

## 默认词库

Studio 配置的 Raw 地址：

```text
https://raw.githubusercontent.com/Stephen-Xu-X/X_keywords_Blocker/main/keywords.md
```

格式：三级标题表示分类，四级标题表示说明，只有反引号包裹的列表项会被加载：

```markdown
### 分类名称

#### 分类说明

- `词一`
- `词二`
- `word three`
```

用户可以 Fork 仓库并修改 `keywords.md`，再将脚本中的 `KEYWORDS_URL` 改为自己的 Raw 地址。

## 安全

- Cookie 由浏览器自动携带，不写入脚本或仓库。
- CSRF Token 仅从当前 X 页面读取并用于同源请求。
- `x-client-transaction-id` 使用 X 当前页面已经加载的签名模块实时生成。
- 不要在 Issue、日志或截图中提交 Cookie、`auth_token` 或 `ct0`。

## `debugger;` 导致页面暂停

`debugger;` 是主动断点，不是刷新代码。DevTools 打开且断点启用时，页面执行到该语句会暂停，看起来像一直加载。

优先在 DevTools Sources 面板点击 **Deactivate breakpoints**，快捷键为 `Ctrl+F8`。也可以关闭 Pause on exceptions。通常不需要重启 Chrome，也不应逐个修改第三方脚本。

CDP 调试只使用临时 `window.stop()`；不要注入永久 `beforeunload` 拦截。

## 免责声明

本项目使用 X 的内部 Web 接口，可能随 X 前端更新而变化。请控制批量规模并遵守 X 的服务条款和适用法律。
