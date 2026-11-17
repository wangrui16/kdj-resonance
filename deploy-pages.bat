@echo off
chcp 65001 >nul
title KDJ 工作台 - GitHub Pages 永久部署
setlocal enabledelayedexpansion

set GH=C:\Program Files\GitHub CLI\gh.exe
set REPO=D:\video_in\kdj\_pages_repo
set NAME=kdj-resonance

echo ============================================
echo   KDJ 超卖共振选股工作台 - 永久托管部署
echo ============================================
echo.

echo [1/4] 检查 GitHub 登录状态...
"%GH%" auth status >nul 2>&1
if errorlevel 1 (
  echo     未登录，即将打开浏览器授权。
  echo     屏幕上会给一个 8 位代码，复制它，浏览器里粘贴。
  echo.
  "%GH%" auth login -h github.com -p https -w
  if errorlevel 1 (
    echo.
    echo [失败] 授权未完成，请重跑本脚本。
    pause
    exit /b 1
  )
) else (
  echo     已登录。
)
echo.

echo [2/4] 创建仓库并推送 %NAME% ...
"%GH%" repo view %NAME% >nul 2>&1
if errorlevel 1 (
  cd /d "%REPO%"
  "%GH%" repo create %NAME% --public --source=. --remote=origin --push
) else (
  echo     仓库已存在，改为推送更新。
  cd /d "%REPO%"
  "%GH%" repo set-default %NAME% >nul 2>&1
  git remote get-url origin >nul 2>&1
  if errorlevel 1 (
    for /f "delims=" %%o in ('"%GH%" api user --jq .login') do set OWNER=%%o
    git remote add origin https://github.com/!OWNER!/%NAME%.git
  )
  git push -u origin main
)
if errorlevel 1 (
  echo.
  echo [失败] 推送未完成。
  pause
  exit /b 1
)
echo.

echo [3/4] 启用 GitHub Pages（main 分支根目录）...
"%GH%" api -X POST repos/:owner/%NAME%/pages -f "source[branch]=main" -f "source[path]=/" >nul 2>&1
if errorlevel 1 (
  echo     启用接口返回非零（多半是已经启用过，继续）。
) else (
  echo     已提交启用请求。
)
echo.

echo [4/4] 取回线上地址（首次生效需 1~2 分钟）...
for /f "delims=" %%u in ('"%GH%" api repos/:owner/%NAME%/pages --jq .html_url 2^>nul') do set URL=%%u
if defined URL (
  echo.
  echo ============================================
  echo   永久链接:  !URL!
  echo ============================================
  echo.
  echo   手机浏览器打开上面链接，然后：
  echo     iPhone  : Safari 分享 - 添加到主屏幕
  echo     Android : Chrome 菜单 - 安装应用
  echo.
  start "" "!URL!"
) else (
  echo     还没拿到地址，等 1 分钟后手动查看：
  echo     "%GH%" api repos/:owner/%NAME%/pages --jq .html_url
)
echo.
pause
