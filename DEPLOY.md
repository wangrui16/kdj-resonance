# KDJ 超卖共振选股工作台 · 永久托管部署说明

## 现状

| 链接类型 | 地址 | 状态 |
|---|---|---|
| 临时公网（Cloudflare Tunnel） | https://teams-strict-mileage-neon.trycloudflare.com | **已上线，可用** |
| 永久托管（GitHub Pages） | 待创建 | 需 GitHub 授权 |
| 永久托管（Cloudflare Pages） | 待创建 | 需 Cloudflare 授权 |

临时链接的代价：隧道进程跑在本机，**关机或断网就失效**，且地址每次重建都会变。
永久托管一旦上线，关机、换网、跨设备访问都不受影响。

## 方式 A：GitHub Pages（推荐，免费无限流量）

仓库已在本机备好：`D:\video_in\kdj\_pages_repo`（20 个文件，commit 已完成）。

### 执行步骤

```powershell
# 1. 登录（浏览器一次性授权，之后一直有效）
gh auth login -h github.com -p https -w

# 2. 创建公开仓库并推送
cd D:\video_in\kdj\_pages_repo
gh repo create kdj-resonance --public --source=. --remote=origin --push

# 3. 启用 Pages（从 main 分支根目录）
gh api -X POST repos/:owner/kdj-resonance/pages `
  -f "source[branch]=main" -f "source[path]=/"

# 4. 取回线上地址（约 1~2 分钟后生效）
gh api repos/:owner/kdj-resonance/pages --jq .html_url
```

预期地址：`https://<你的用户名>.github.io/kdj-resonance/`

### 注意事项

- 必须是 **public** 仓库，GitHub Pages 免费版不支持私有仓库。
- `.nojekyll` 已放好，防止 Jekyll 吞掉以下划线开头的路径。
- 首次部署后约 1~2 分钟生效；后续 `git push` 后约 1 分钟更新。

## 方式 B：Cloudflare Pages（国内访问通常更快）

```powershell
# 1. 安装 wrangler
npm install -g wrangler

# 2. 登录（浏览器一次性授权）
wrangler login

# 3. 创建项目并上传
cd D:\video_in\kdj\_pages_repo
wrangler pages project create kdj-resonance --production-branch main
wrangler pages deploy . --project-name kdj-resonance
```

预期地址：`https://kdj-resonance.pages.dev`

## 方式 C：什么都不做，直接用临时链接

如果你只是自己用、近期不换机器，临时链接完全够用：

1. 手机浏览器打开 https://teams-strict-mileage-neon.trycloudflare.com
2. iPhone：Safari 分享 → 「添加到主屏幕」
3. Android：Chrome 菜单 → 「安装应用」/「添加到主屏幕」

装到主屏后，即使隧道断了、甚至完全离线，**页面壳仍能秒开**（Service Worker 已缓存全部 19 个文件）。
只是点「刷新数据」拉实时行情时需要网络。

## 部署目录结构

```
D:\video_in\kdj\_deploy_kdj_pwa\      # 构建工作区
├── source.html                       # 原始单文件工作台（构建输入）
├── index.html                        # 注入 PWA 后的发布版（build_index.py 生成）
├── manifest.json                     # PWA 清单
├── sw.js                             # Service Worker
├── icon-192/512.png                  # 普通图标
├── icon-maskable-192/512.png         # Android 自适应图标
├── apple-touch-icon.png              # iOS 主屏图标
├── favicon-32.png
├── splash-*.png                      # iOS 启动屏 9 张
├── generate_icons.py                 # 图标生成
├── build_index.py                    # PWA 注入（更新必走此脚本）
├── server.js                         # 零依赖本地静态服务（端口 8791）
├── _smoke_pwa.py / _smoke_pwa2.py    # 本地冒烟
└── _smoke_online.py                  # 线上冒烟
```

**更新流程**：改 `source.html` → 改 `build_index.py` 里的 `CACHE` 版本号 → `python build_index.py` → 重新部署。

## 已验证项（2026-11-17）

- 8 个关键文件线上 200、MIME 正确、字节数与本地逐一相等
- Service Worker 在 https 下 `activated`，scope = 站点根，`controller` 已接管
- 断网后 reload：标题、5 个面板、3910 字正文全部正常
- `pageerror` = 0
