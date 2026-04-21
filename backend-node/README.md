# Backend Node

Backend principal do jogo. Ele orquestra:

- memoria e historico de sessao
- construcao de contexto separado
- streaming para o frontend
- comunicacao com o motor Python

## Rodar

```powershell
cd C:\Users\kayky\Desktop\LocalLoreAI\backend-node
copy .env.example .env
npm.cmd run dev
```

O backend Node assume que o motor Python esta rodando em `http://localhost:8001`.
