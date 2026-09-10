@echo off
title Monitor Duna - UCI RibeiraoShopping
cd /d "%~dp0"
echo Iniciando o monitor. Nao feche esta janela enquanto quiser monitorar.
node app.js
echo.
echo O monitor foi encerrado. Pressione qualquer tecla para fechar.
pause >nul
