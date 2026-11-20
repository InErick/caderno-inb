# Caderno INB: contexto completo do projeto

Documento de contexto para retomar o trabalho em qualquer conversa nova. Atualize ao fim de cada mudança grande.
**O repositório é PÚBLICO**: nada de chave de API, senha, IP de servidor ou questões da banca aqui ou em qualquer arquivo versionado.

---

## 1. Objetivo

App de estudos pessoal do Erick (e de mais 1 pessoa) para o concurso **INB 2026, banca FGV, prova em 10/01/2027**.
Dois cargos / dois cronogramas:

| Edital (id) | Cargo | Nível | Específicos |
|---|---|---|---|
| `analista` | Analista de Sistemas | superior | TI (C#, POO, BD, engenharia de software, redes, segurança…) |
| `assistente` | Assistente Administrativo | médio | Noções de Administração + Raciocínio Lógico |

O nível é **só um rótulo** do cargo. Não filtrar questões por nível (o Erick aceita questões mais difíceis desde que sejam do tema).

## 2. Infra e deploy

- Código: GitHub `InErick/caderno-inb` (público), branch `main`.
- Produção: VPS Hostinger, pasta `/var/www/caderno-inb`, processo **pm2 `caderno-inb`**, domínio **estudos.appwinhub.com** (HTTPS via proxy).
- O Erick roda os comandos na VPS ele mesmo (Claude não tem acesso à VPS). Fluxo de atualização:
  ```bash
  cd /var/www/caderno-inb && git pull && npm install --omit=dev && pm2 restart caderno-inb
  ```
  Arquivos estáticos (apostilas, CSS, JS do front) só precisam de `git pull` (sem restart).
- `.env` na VPS: `PORT`, `JWT_SECRET`, `NODE_ENV=production`, `DB_PATH` (opcional), **`QUEST_API_KEY`** (só no servidor).
- Banco: SQLite em `data/caderno.db` (ignorado no git). Backups automáticos de scripts: `data/backup-antes-remapear-AAAA-MM-DD.db`.
- Windows do Erick: a Área de Trabalho está no OneDrive → para `scp` usar `"$HOME\OneDrive\Desktop\"` ou `.`.
- Pendências de infra: **trocar a chave da Quest API** (uma chave foi exposta em conversa); a VPS pede "System restart required" (antes de reiniciar, confirmar `pm2 startup` + `pm2 save`).

## 3. Stack e estrutura

Node ≥ 22.13, Express 5, `node:sqlite` (sem compilação), bcryptjs, jsonwebtoken, cookie-parser. Front-end SPA em JS puro, sem build.

```
server.js            rotas da API, auth (JWT em cookie), apostilas, notas, banco de questões
db.js                schema + migrações (addColumn, PRAGMA user_version)
game.js              XP, níveis, sequência, conquistas, meta diária de questões
bank.js              sanitização do HTML das questões (allowlist) + saveQuestion()
load-env.js          lê .env
questoes-map.js      dia do cronograma → nomes de matéria/assunto na Quest API
questoes-plano.js    alvo de questões por matéria; dias(ed) → [{ed,key,fontes,alvo,m,title}]
scripts/importar-questoes.js   importa da Quest API (npm run importar)
scripts/remapear-questoes.js   redistribui as questões já baixadas pelos dias (sem gastar crédito)
scripts/exportar-questoes.js   exporta as questões de um período em .txt (para preparar apostilas)
public/index.html, css/style.css
public/js/app.js     telas (Hoje, Cronograma, Questões, Desempenho, Conquistas, Perfil), rotas por hash
public/js/plans.js   os dois cronogramas (buildDiario), EDITAIS (pesos, mínimos), fases do timer
public/js/timer.js   cronômetro/foco (Dia, Pomodoro, Livre), janela flutuante
public/js/reader.js  leitor de apostila: marca-texto 4 cores, notas, "parei aqui", PDF (print)
public/js/api.js, icons.js
public/apostilas/{analista,assistente}/AAAA-MM-DD.html   apostilas (fragmentos HTML)
```

### Rotas da API
`POST /api/auth/register|login|logout` · `GET/PATCH /api/me` (aceita `dailyQGoal` 5–200) · `POST /api/me/password` ·
`GET /api/progress`, `PUT /api/progress/:dayKey` · `GET /api/dashboard` · `/api/questions` (lançamento manual, legado) ·
`GET /api/bank?today=` → `{days:{key:{n,answered,correct,pool}}, unlocked, due, inReview}` ·
`GET /api/bank/day/:key[?scope=all]` · `GET /api/bank/session?mode=treino|erros|extra&materia&n&today` · `POST /api/bank/answer` ·
`/api/sessions` (tempo estudado) · `GET /api/stats` · `GET /api/apostilas` (lista os dias com arquivo) · `GET/PUT /api/notes/:dayKey`.

### Tabelas
`users` (inclui `edital`, `daily_q_goal` padrão 40), `progress`, `sessions`, `notes`, `question_logs`, `achievements`,
`bank_questions` (questões da API, inclui `nivel`), `bank_day` (edital, day_key, question_id, pos; PK edital+question_id),
`bank_answers` (first_correct, chosen, correct, attempts, review_step, review_due, materia, updated_at),
`bank_attempts` (cada tentativa, com mode e materia), `meta_days` (dias em que a meta foi batida), `bank_cursors` (onde cada busca da API parou).

## 4. Cronogramas (plans.js)

- Diário de **19/11/2026 a 09/01/2027**; 10–18/11 ficam como "fase anterior" (legado, com apostilas antigas).
- Rotina semanal pelo peso do edital: **Seg/Ter/Qui/Sáb = Específicos, Qua = Português, Sex = Normas**, domingo alterna **Inglês (analista) ou RLM (assistente)** com **Português**.
  Totais: Específicos 28 dias, Português 10, Normas 7, Inglês/RLM 4.
- Analista: 26 aulas de TI + 2 revisões; simulados de 4 h em 07 e 08/01. Assistente: 25 aulas + 3 revisões; simulados de 3 h.
- Fases do timer: dia normal = **60 min de teoria** (sem fase de questões); domingo 30 teoria + 30 revisão; dias de revisão 60 "Revisão + questões"; simulado 240/180; véspera 30.
- Etiquetas de Específicos mostram a área: "Específicos · Banco de dados".
- Primeira semana (19–25/11):
  - analista: 19 C# básico · 20 Normas (art. 37, Lei 9.784) · 21 POO I · 22 Inglês (estratégias de leitura) · 23 POO II · 24 Exceções + SOLID · 25 Português (interpretação)
  - assistente: 19 Conceitos e funções administrativas · 20 Normas (art. 37) · 21 Planejamento e controle · 22 RLM (lógica proposicional) · 23 Estruturas organizacionais · 24 Departamentalização/delegação · 25 Português

## 5. Banco de questões (Quest API)

- API `https://api.quest.api.br/v2`, header `X-API-Key`. Plano Basic: 50.000 créditos/mês, renova dia **19** de cada mês.
  Custo: 3 créditos por questão, **6 com gabarito** (o importador sempre pede gabarito). Filtros, estatísticas, `/quota` e buscas vazias são grátis.
  Paginação por cursor (`after_id`/`next_cursor`); responde 429 se for rápido demais.
- Situação (20/11/2026): ~42,5 mil créditos usados no ciclo, ~7,4 mil sobrando; **6.971 questões** no banco.
- As questões ficam **só no SQLite do servidor**. Nunca commitar questões (o `.gitignore` ignora `questoes-*.txt`).
- Importação: FGV primeiro, depois CESGRANRIO, FCC, VUNESP… Cebraspe por último. Reaproveita de graça questões já baixadas que servem a outro edital.
  Metas por dia (questoes-plano.js): analista ESP 60 · POR 150 · NOR 100 · ING 140; assistente igual, com RLM 210.
  ```bash
  npm run importar -- --simular              # mostra plano e saldo
  npm run importar -- --max-creditos 6000    # teto de gasto
  node scripts/remapear-questoes.js [--aplicar]   # depois de mudar cronograma/mapa
  node scripts/exportar-questoes.js --de 2026-11-26 --ate 2026-12-02 > questoes-semana2.txt
  ```
- Observação: em alguns dias o banco do tema é mais amplo que o título (ex.: 19/11 analista mistura "Linguagens de Programação" em geral com C#; 19/11 assistente traz liderança, motivação, equipes…). As apostilas cobrem o que as questões cobram. O mapa (questoes-map.js) pode ser refinado depois.

### Como as questões funcionam no app
- **Aula**: as primeiras **20** questões do dia (`pos < 20`) aparecem na aula ("Abrir as questões da aula").
- **Aba Questões**: o restante do banco de cada tema fica liberado **só depois que a aula do dia é concluída** (`#banco/<key>`).
- **Meta diária**: total configurável no Perfil (padrão **40**, opções 20–150), dividido entre as matérias liberadas pelo **peso no edital**
  (mínimo 3 por matéria) e limitado ao que existe disponível. Conta questões distintas (modo extra não conta). Bater a meta dá +20 XP; conquista `meta_7`.
- **Treino misto** (`#treino[/M]`): 60% de temas recentes, pesando pelos pontos fracos, e ~10% de "recordação" (acertadas há 7+ dias).
- **Caderno de erros** (`#erros`): repetição espaçada. Errou → volta em 1 dia; acertos na data certa avançam para 3 e 7 dias; depois disso sai ("graduada"). Refazer antes da data não avança.
- **Extras** (`#extra`): depois de bater a meta, 10 questões já respondidas (pesando erradas/antigas). Não contam para a meta.
- Formatação no cliente (`tidyQuestion` em app.js): LaTeX simples → texto, blocos de código em `pre.qcode`, tabelas em `.tbl`, textos de apoio recolhíveis.
  Servidor (`bank.js`): allowlist de tags; imagens só de `media.quest.api.br`.

## 6. Gamificação (game.js)
XP: dia no prazo +50, dia recuperado +30, acerto +3, conquista +100, meta do dia +20. Níveis, sequência 🔥, conquistas, termômetro de aprovação pelos mínimos do edital.
Desempenho mostra horas, % por matéria e o card do banco (questões feitas × total no banco).

## 7. Apostilas

- Arquivos: `public/apostilas/<edital>/<AAAA-MM-DD>.html`, **fragmento HTML** (sem `<html>`/`<body>`). O botão "📖 Apostila" aparece sozinho quando o arquivo existe.
- Componentes (CSS em style.css, seção `.apostila`):
  `<h1>`, `<p class="lead">`, `<div class="meta-row"><span class="chip-i">…</span></div>`,
  `<div class="roteiro"><div><b>0–10 min</b>…</div></div>`, `h2` numerados, `h3`,
  `<div class="box exemplo|dica|atencao|prova"><span class="bt">Título</span>…</div>`,
  `<div class="tbl"><table>…</table></div>`, `<pre><code>…</code></pre>` (escapar `< > &`),
  flashcards `<div class="cards"><details><summary>pergunta</summary><div>resposta</div></details></div>`,
  questão `<div class="q"><div class="q-n">Questão 1 · inédita</div><p class="q-stem">…</p><ol class="alts"><li class="alt" data-l="A">…</li></ol><details><summary>Ver gabarito comentado</summary><div class="gab-body"><p><b>Gabarito: B.</b> …</p></div></details></div>`,
  `.checklist`, `.reais`, `.src muted small`. O PDF abre todos os `<details>` antes de imprimir.
- **Padrão a partir de 19/11** (pedidos do Erick: os vídeos do YouTube não batiam com as questões; depois, "texto mais extenso e profundo, é estudo para concurso"):
  1. Rodar `exportar-questoes.js` para a semana e ler as 20 questões da aula + o banco do tema, só para saber **o que estudar e em que profundidade**.
  2. Escrever um **capítulo de estudo** completo (60–75 KB de HTML): teoria extensa e aprofundada, em prosa, cobrindo tudo o que o banco cobra e o entorno do tema; exemplos resolvidos e rastreios de código; tabelas comparativas; boxes de pegadinhas e "na prova"; síntese; flashcards; 12–14 exercícios com gabarito comentado (rótulo "Exercício N"); fontes; checklist.
  3. **Não** incluir: roteiro de minutos (bloco `.roteiro`), referências às questões da aula como se já existissem ("as 20 questões da aula", "na questão X", tabela questão → seção), cópia ou paráfrase próxima de questões da API, **inclusive nos exemplos da teoria** (nada de reaproveitar o cenário, os nomes, os números ou a resposta de uma questão do banco: inventar casos novos). O repositório é público.
  4. Revisão independente por um segundo agente (fatos, contas dos exercícios, cobertura do banco, cópias, HTML).
  5. PR → merge → Erick dá `git pull` na VPS.
- Feito: 10–15/11 (fase anterior) e **19/11 a 25/11 dos dois cargos** no padrão novo (19/11 aprovada pelo Erick em 20/11). 20/11 (Normas) e 25/11 (Português) são o mesmo arquivo nos dois cargos, porque o banco dessas aulas é compartilhado. Próximo: 26/11 em diante.
- Lembrete agendado para **26/11/2026 às 9h** (São Paulo): preparar as apostilas da semana 2 (26/11–02/12). O Erick precisa exportar e mandar o .txt.

## 8. Fluxo de git (Claude)
Branch por mudança → commit com trailers (`Co-Authored-By` / `Claude-Session`) → `git -c push.negotiate=true push` →
PR via `gh api repos/InErick/caderno-inb/pulls` → merge via `gh api -X PUT .../pulls/N/merge` → `git checkout main && git pull` e apagar a branch local.
Testes locais: Playwright (Chromium já instalado) com banco de teste semeado; nunca usar o banco real.

## 9. Preferências do Erick
- Conversa em português, direto ao ponto; ele revisa antes de escalar (ex.: apostila de 1 dia antes da semana inteira).
- Quer qualidade de prova FGV, conteúdo alinhado às questões reais, e controle de gasto da API (não estourar o plano).
- Pode pedir mudanças grandes ("pode mexer em tudo"), mas decisões que custam crédito ou mexem em dados reais são confirmadas antes.
