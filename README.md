# Monitor de Duna — UCI RibeirãoShopping

## Instalação em outro computador

O computador precisa ter:

- [Node.js](https://nodejs.org/) na versão LTS;
- [Python](https://www.python.org/downloads/), marcando **Add Python to PATH** durante a instalação.

Depois de baixar ou copiar o projeto, abra o PowerShell dentro da pasta e execute uma única vez:

```powershell
python -m pip install -r requirements.txt
python -m playwright install chromium
```

Não é necessário instalar npm, Yarn ou Git para executar o monitor. O npm já acompanha o Node.js, mas não é utilizado por este projeto.

## Como usar

Dê dois cliques em **iniciar-app.bat**. O painel abrirá no navegador e verificará a página do Ingresso a cada cinco minutos.

No painel, clique uma vez em **Ativar notificações** e permita os avisos. Quando **UCI RibeirãoShopping** aparecer, a aba emitirá um som e mostrará uma notificação do Windows.

Para confirmar o funcionamento completo, clique em **Testar com Cinépolis**. O app procurará **Cinépolis Iguatemi Ribeirão Preto**, que já aparece na página, e deverá exibir o alerta de teste.

Deixe a aba e a janela preta abertas; ambas podem ficar minimizadas. Para parar o monitor, feche a janela preta.

O app usa o Python e o Playwright que já foram instalados. Não é necessário agendar uma tarefa no Windows nem configurar e-mail.
