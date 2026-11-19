# Caderno INB 📚⏱️

App de estudos para o concurso **INB 2026 (banca FGV)** com:

- **Login e cadastro**: cada pessoa tem o próprio tempo e progresso salvos.
- **Dois cronogramas**. Você escolhe um ao criar a conta e pode trocar no Perfil.
  - Os dois seguem um cronograma **diário** de 19/11/2026 a 09/01/2027, 1 h por dia (40 min de videoaula + 20 min de questões FGV), com os subtópicos do edital e termos de busca no YouTube. Os dias de 10 a 18/11 ficam como "fase anterior".
  - **Analista de Sistemas** (nível superior): Seg/Ter/Qui/Sáb = TI, Qua = Português, Sex = Normas, Dom = Inglês + revisão dos erros. Simulados de 4 h em 07 e 08/01.
  - **Assistente Administrativo** (nível médio): Seg/Ter/Qui/Sáb = Específicos, Qua = Português, Sex = Normas, Dom = Raciocínio lógico + revisão dos erros. Simulados de 3 h em 07 e 08/01.
- **Tela Hoje**: tarefa do dia, cronômetro de 40 + 20 min (modo "Dia" do foco) e botão **Concluir dia**.
- **Gamificação**: XP (+50 por dia no prazo, +30 por dia recuperado, +3 por acerto, +100 por conquista), níveis, sequência 🔥 e conquistas.
- **Questões do dia**: lance quantas fez e quantas acertou; o app mostra o % de acerto por dia, por matéria e no total.
- **Termômetro de aprovação**: estima a nota com base no seu % de acerto por matéria e avisa se ficar abaixo dos mínimos do edital.
- **Calendário** com dias concluídos, recuperados, atrasados e futuros, e lista de **atrasados** para recuperar.
- **Progresso do edital**: % de tópicos cobertos, no geral e por matéria.
- **Modo foco**: ao iniciar, a tela **cresce e ocupa a tela inteira**. Há três modos: Meta do dia, Pomodoro (25 min) e Livre.
- **Janela flutuante (Chrome/Edge no PC)**: o cronômetro fica por cima de qualquer aba ou programa, mesmo fora da página.
- **Apostilas diárias** com teoria, exemplos, exercícios com gabarito e questões reais referenciadas, abertas num leitor com **marca-texto** (4 cores), **notas**, **"parei aqui"** e botão para **baixar em PDF**.
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

## Banco de questões

Cada dia do cronograma tem questões de provas anteriores sobre o tema do dia, importadas da [Quest API](https://quest.api.br). Elas ficam **só no banco do servidor** (o repositório é público); o mapa tema → matérias da API está em `questoes-map.js`.

Na aba **Questões**: meta diária (padrão 20, ajustável no Perfil, +20 XP ao bater), **Treino do dia** (≈60% dos assuntos mais recentes + sorteio dos desbloqueados, com mais peso nos de pior acerto), **Caderno de erros** (cada erro volta em 1, 3 e 7 dias; 3 acertos seguidos e sai) e a lista de assuntos, que abrem no dia do cronograma ou ao concluir o dia. A 1ª resposta de cada questão conta para o desempenho e dá +3 XP por acerto.

1. Coloque a chave no `.env` do servidor: `QUEST_API_KEY=qk_...`
2. `npm run importar -- --simular` mostra o saldo e quanto vai gastar
3. `npm run importar` completa cada dia até a meta (Específicos 60 · Português 150 · Normas 100 · Inglês 80 · Raciocínio lógico 120)
   - `--materia POR`, `--dias 2026-11-19`, `--edital analista`, `--por-dia 30` para importar só uma parte

Cada questão com gabarito custa 6 créditos. O script reaproveita de graça questões que já estão no banco (por exemplo, Português entre os dois cronogramas), para quando o saldo acaba e guarda onde parou cada busca, então rodar de novo nunca paga a mesma questão.

## Apostilas

Cada apostila é um arquivo HTML em `public/apostilas/<edital>/<AAAA-MM-DD>.html`, com `<edital>` igual a `analista` ou `assistente`. O app só mostra o botão 📖 nos dias que têm arquivo, e só baixa a apostila quando ela é aberta, então o app continua leve.

As marcações ficam na tabela `notes`, por usuário, cronograma e dia. Para publicar apostilas novas, adicione os arquivos e rode `git pull && pm2 restart caderno-inb` na VPS.

## Estrutura

```
server.js          API (auth, progresso, sessões, estatísticas) + arquivos estáticos
db.js              criação das tabelas SQLite
load-env.js        lê o .env sem dependências
public/
  index.html
  css/style.css
  js/plans.js      conteúdo dos 2 cronogramas (Edital INB nº 01/2026)
  js/reader.js     leitor de apostilas: marca-texto, notas, parei aqui, PDF
  apostilas/       uma apostila por dia (HTML)
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
