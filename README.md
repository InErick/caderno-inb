# Caderno INB 📚⏱️

App de estudos para o concurso **INB 2026 (banca FGV)** com:

- **Login e cadastro**: cada pessoa tem o próprio tempo e progresso salvos.
- **Dois cronogramas** de 61 dias (10/11/2026 → 09/01/2027). Você escolhe um ao criar a conta e pode trocar no Perfil.
  - Analista de Sistemas (nível superior)
  - Assistente Administrativo (nível médio)
- **Modo foco**: ao iniciar, a tela **cresce e ocupa a tela inteira**. Há três modos: Meta do dia, Pomodoro (25 min) e Livre.
- **Janela flutuante (Chrome/Edge no PC)**: o cronômetro fica por cima de qualquer aba ou programa, mesmo fora da página.
- Estatísticas: sequência de dias, tempo por dia (últimos 14 dias), tempo por matéria e sessões recentes.
- Funciona no celular (layout mobile com barra inferior) e no PC (menu lateral).

**Stack:** Node.js + Express, SQLite (o `node:sqlite`, que já vem no Node, então não há nada para compilar) e front-end em HTML/CSS/JS puro, sem etapa de build.

---

## Rodar localmente

Requisito: **Node.js 22.13 ou mais novo** (ou 23/24).

```bash
npm install
cp .env.example .env      # depois edite o JWT_SECRET
npm start                 # abre em http://localhost:3000
```

Para desenvolver com recarregamento automático, use `npm run dev`.

## Hospedar

O banco é um arquivo (`data/caderno.db`), então **a hospedagem precisa ter disco persistente**.

### Opção A: VPS (Hostinger VPS, DigitalOcean etc.)

```bash
# no servidor (Ubuntu)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
git clone <seu-repo> caderno-inb && cd caderno-inb
npm install --omit=dev
cp .env.example .env && nano .env      # defina JWT_SECRET e PORT
sudo npm i -g pm2
pm2 start npm --name caderno-inb -- start
pm2 save && pm2 startup
```

Depois aponte o domínio com Nginx (proxy reverso para `localhost:3000`) e ative HTTPS com o Certbot:

```nginx
server {
  server_name estudos.seudominio.com.br;
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

```bash
sudo certbot --nginx -d estudos.seudominio.com.br
```

### Opção B: hospedagem com "Node.js App" (painel da Hostinger, Render, Railway)

- Comando de build: `npm install`
- Comando de início: `npm start`
- Variáveis de ambiente: `JWT_SECRET`, `NODE_ENV=production` e, se o painel pedir, `PORT`.
- No Render ou Railway, crie um **disco/volume persistente** e defina `DB_PATH` apontando para ele (ex.: `/data/caderno.db`). Sem isso, as contas somem a cada novo deploy.

> ⚠️ A janela flutuante e a tela cheia só funcionam em **HTTPS** (ou em `localhost`).

## Como funciona a janela flutuante

Ela usa a API **Document Picture-in-Picture**, disponível no Chrome e no Edge para computador (versão 116 ou mais nova):

- Por padrão, ela abre sozinha ao clicar em **Iniciar** no PC. Dá para desligar isso na tela *Foco*.
- Também pode ser aberta pelo botão 🗗 no canto da tela de foco.
- Ela fica **sempre por cima**, mesmo trocando de aba ou abrindo outro programa, e tem botões de pausar e finalizar.
- O navegador exige um clique para abrir a janela, então ela não abre sozinha só por você sair da aba.
- No celular essa API não existe. Lá a tela de foco entra em **tela cheia**, e o tempo continua contando certo mesmo com a tela bloqueada, porque o cálculo é feito pelo relógio e não por contador.

Se o PiP não estiver disponível, a aba mostra o tempo no título (`⏱ 24:13 · Caderno INB`). Quando uma contagem regressiva termina, toca um bipe e aparece uma notificação do sistema, se você permitir.

## Estrutura

```
server.js          API (auth, progresso, sessões, estatísticas) + arquivos estáticos
db.js              criação das tabelas SQLite
load-env.js        lê o .env sem dependências
public/
  index.html
  css/style.css
  js/plans.js      conteúdo dos 2 cronogramas (Edital INB nº 01/2026)
  js/timer.js      modo foco: cronômetro, animação de tela cheia, PiP, bipe/notificação
  js/app.js        telas: login/cadastro, início, cronograma, foco, estatísticas, perfil
  js/api.js        chamadas ao backend
  js/icons.js      ícones SVG
```

### Banco de dados

| Tabela     | O que guarda |
|------------|--------------|
| `users`    | nome, e-mail, hash da senha (bcrypt), cronograma escolhido, meta diária |
| `progress` | dias do cronograma marcados como concluídos (por usuário e por cronograma) |
| `sessions` | cada sessão de foco: duração, modo, dia do cronograma e data |

### API

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/auth/register` | `{name, email, password, edital}` |
| POST | `/api/auth/login` | `{email, password}` |
| POST | `/api/auth/logout` | |
| GET / PATCH | `/api/me` | dados do usuário / alterar `name`, `edital`, `dailyGoal` |
| POST | `/api/me/password` | `{current, next}` |
| GET | `/api/progress` | dias concluídos |
| PUT | `/api/progress/:dia` | `{done: true/false}` |
| GET / POST | `/api/sessions` | listar / salvar sessão de foco |
| DELETE | `/api/sessions/:id` | apagar sessão |
| GET | `/api/stats?today=AAAA-MM-DD` | hoje, semana, total, sequência, últimos 14 dias, tempo por dia do cronograma |

O login fica num cookie `httpOnly` com JWT válido por 30 dias. Há também um limite de tentativas de login por IP.

---

O conteúdo segue o Anexo I do Edital nº 01/2026 da INB (FGV). A prova está prevista para 10/01/2027, mas a data pode mudar. Confira sempre a página do concurso na FGV.
