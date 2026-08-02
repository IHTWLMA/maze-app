@echo off
chcp 65001 >nul
title Maze 启动器

echo ========================================
echo   Maze 一键启动
echo ========================================
echo.

:: 设置Node路径
set PATH=C:\Users\WenPeng Huang\Downloads\node_install\node-v20.19.0-win-x64;%PATH%

:: 启动API服务器
echo [1/3] 启动API服务器...
cd /d "C:\Users\WenPeng Huang\knowledge-sink"
start /B python api_server.py
timeout /t 2 >nul

:: 启动移动端Expo
echo [2/3] 启动移动端服务...
cd /d "C:\Users\WenPeng Huang\knowledge-sink"
start /B npx expo start --port 8089
timeout /t 5 >nul

:: 启动桌面端
echo [3/3] 启动桌面端...
cd /d "C:\Users\WenPeng Huang\knowledge-sink-desktop"
start /B npx electron .

echo.
echo ========================================
echo   全部启动完成!
echo ========================================
echo.
echo   桌面端: 已自动打开
echo   移动端: exp://192.168.0.213:8089
echo   API服务: http://localhost:8099
echo.
echo   手机请安装 Expo Go 扫码或输入地址
echo ========================================
echo.
pause
