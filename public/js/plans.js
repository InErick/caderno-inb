// Conteúdo dos dois cronogramas (Edital INB nº 01/2026 – FGV).
// Gera 61 dias (10/11/2026 → 09/01/2027). Compartilhado entre navegador e servidor.
(function (root) {
const START = [2026, 10, 10], END = [2027, 0, 9], FINAL_START = [2027, 0, 4];

function dataAnalista() {

const ESP = [
 {a:"Engenharia de Software",t:"Processo de software e modelos de desenvolvimento",k:["ciclo de vida do software","modelo cascata","modelo incremental","modelo espiral","prototipação","RUP processo unificado fases","modelos tradicionais vs ágeis"],f:"Saber <b>vantagens/desvantagens</b> de cada modelo e quando usar. FGV cobra comparação cascata × espiral × incremental."},
 {a:"Requisitos",t:"Requisitos I — levantamento, análise, especificação e validação",k:["técnicas de levantamento de requisitos","entrevista JAD brainstorming","requisitos funcionais e não funcionais","ISO 25010 qualidade","validação de requisitos"],f:"Saber <b>classificar</b> um requisito como funcional ou não funcional — cai muito."},
 {a:"Requisitos",t:"Requisitos II — regras de negócio, aceite, rastreabilidade e mudanças",k:["regra de negócio vs requisito","critérios de aceitação Gherkin","matriz de rastreabilidade","gerenciamento de requisitos","análise de impacto de mudanças","documentação técnica e funcional"],f:"Entenda o formato <b>Dado / Quando / Então</b> e rastreabilidade para frente/para trás."},
 {a:"Orientação a Objetos",t:"POO + princípios SOLID + coesão e acoplamento",k:["4 pilares POO encapsulamento herança polimorfismo abstração","interface vs classe abstrata","composição vs herança","princípios SOLID exemplos","alta coesão baixo acoplamento"],f:"Você já sabe POO do Java: foque em <b>SOLID</b> — saber identificar qual princípio um código viola."},
 {a:"UML",t:"UML I — casos de uso e diagrama de classes",k:["diagrama de casos de uso include extend","generalização de atores","diagrama de classes associação agregação composição","multiplicidade UML","visibilidade UML + - #"],f:"Diferença <b>include × extend</b> e <b>agregação × composição</b> são clássicos de prova."},
 {a:"UML",t:"UML II — sequência, atividades e componentes",k:["diagrama de sequência fragmentos alt opt loop","mensagem síncrona assíncrona UML","diagrama de atividades fork join raias","diagrama de componentes interface fornecida requerida"],f:"Saber <b>ler</b> um diagrama e reconhecer qual é qual pelos símbolos."},
 {a:"Banco de Dados",t:"Modelagem conceitual, lógica e física",k:["modelo conceitual lógico físico","modelo entidade relacionamento MER","cardinalidade 1:1 1:N N:N","entidade fraca","atributo multivalorado composto"],f:"Saber o que pertence a cada <b>nível</b> de modelagem."},
 {a:"Banco de Dados",t:"Modelo relacional, chaves e normalização",k:["chave primária estrangeira candidata","integridade referencial ON DELETE CASCADE","normalização 1FN 2FN 3FN","forma normal Boyce-Codd","dependência funcional"],f:"Treine identificar <b>em que forma normal</b> uma tabela está — questão certa na FGV."},
 {a:"SQL Server",t:"SQL I — SELECT, filtros, agregação e DML/DDL",k:["SQL SELECT WHERE ORDER BY","GROUP BY HAVING diferença WHERE","funções de agregação COUNT SUM AVG","SQL Server TOP DISTINCT","INSERT UPDATE DELETE","DDL DML DCL diferença"],f:"<b>WHERE × HAVING</b> e o que COUNT(*) × COUNT(coluna) retornam com NULL."},
 {a:"SQL Server",t:"SQL II — JOINs, subqueries e UNION",k:["INNER LEFT RIGHT FULL JOIN","CROSS JOIN self join","subquery correlacionada","EXISTS vs IN SQL","UNION vs UNION ALL"],f:"Pratique: dadas 2 tabelas pequenas, <b>quantas linhas</b> cada JOIN retorna."},
 {a:"SQL Server",t:"SQL III — views, procedures, functions, triggers e transações",k:["SQL Server view","stored procedure SQL Server","function escalar vs tabela SQL Server","trigger AFTER INSTEAD OF inserted deleted","transação ACID BEGIN TRAN COMMIT ROLLBACK","níveis de isolamento SQL Server"],f:"Saber a <b>diferença procedure × function</b> e as propriedades <b>ACID</b>."},
 {a:"C# / .NET",t:"C# I — tipos, variáveis, operadores e controle de fluxo",k:["C# tipos valor vs referência","struct vs class C#","nullable C# ?? ?.","C# if else switch expression","C# estruturas de repetição for foreach while do-while","string vs StringBuilder"],f:"Compare com Java — a sintaxe é parecida, foque nas <b>diferenças</b> (struct, nullable, properties)."},
 {a:"C# / .NET",t:"C# II — métodos, classes, herança e modificadores",k:["C# ref out in params","C# propriedades get set","modificadores de acesso C# internal protected","virtual override abstract sealed C#","static class C#","interfaces C#"],f:"<b>ref × out</b> e <b>internal</b> são pegadinhas típicas."},
 {a:"C# / .NET",t:"C# III — Generics e Collections",k:["C# generics constraints where T","List Dictionary HashSet C#","Queue Stack C#","IEnumerable ICollection IList diferença"],f:"Saber qual coleção usar em cada cenário e o que cada interface oferece."},
 {a:"C# / .NET",t:"C# IV — LINQ e expressões lambda",k:["LINQ Where Select OrderBy","LINQ GroupBy First FirstOrDefault Any","query syntax vs method syntax LINQ","LINQ execução adiada deferred execution","expressões lambda C#"],f:"<b>First × FirstOrDefault × Single</b> e execução adiada caem muito."},
 {a:"C# / .NET",t:"C# V — delegates, events e exceções",k:["delegates C# Func Action Predicate","events C#","try catch finally C#","throw vs throw ex","exceção customizada C#","using IDisposable"],f:"Por que <b>throw;</b> preserva o stack trace e <b>throw ex;</b> não."},
 {a:"C# / .NET",t:"C# VI — assincronismo e NuGet",k:["async await C#","Task vs Task<T> vs void","CancellationToken C#","deadlock .Result .Wait","NuGet gerenciamento de pacotes"],f:"Entender o que acontece no <b>await</b> e por que evitar <b>async void</b>."},
 {a:"ASP.NET Core",t:"ASP.NET Core I — estrutura do projeto, MVC e Razor",k:["ASP.NET Core Program.cs estrutura","ASP.NET Core MVC controllers actions","Razor syntax","model binding ASP.NET Core","ViewBag ViewData TempData","Razor Pages vs MVC"],f:"Você já viu o básico na faculdade — revise o <b>fluxo request → controller → view</b>."},
 {a:"ASP.NET Core",t:"ASP.NET Core II — middleware, DI, configuração e logging",k:["middleware pipeline ASP.NET Core ordem","Use Run Map middleware","injeção de dependência Singleton Scoped Transient","appsettings.json por ambiente","variáveis de ambiente ASPNETCORE_ENVIRONMENT","IOptions pattern","ILogger níveis de log","UseExceptionHandler ProblemDetails","sessão ASP.NET Core"],f:"<b>Lifetimes da DI</b> e <b>ordem dos middlewares</b> são os mais cobrados."},
 {a:"ASP.NET Core",t:"ASP.NET Core III — autenticação, autorização, roles e policies",k:["autenticação vs autorização","JWT ASP.NET Core","cookie authentication ASP.NET Core","[Authorize] roles","authorization policies claims"],f:"Não confundir <b>401</b> (não autenticado) com <b>403</b> (sem permissão)."},
 {a:"APIs REST",t:"REST I — princípios, métodos HTTP e status codes",k:["restrições REST Fielding","stateless REST","métodos HTTP idempotentes seguros","PUT vs PATCH","códigos de status HTTP 200 201 204 400 401 403 404 409 422 500"],f:"Decore quais métodos são <b>idempotentes</b> e os status codes principais."},
 {a:"APIs REST",t:"REST II — Web API no ASP.NET Core, DTOs, Swagger, versionamento",k:["ASP.NET Core Web API ApiController","ActionResult<T>","DTO padrão","validação DataAnnotations ModelState","Swagger OpenAPI ASP.NET Core","versionamento de API","paginação e filtros API"],f:"Por que usar <b>DTO</b> em vez de expor a entidade; formas de versionar (URL, header, query)."},
 {a:"Entity Framework Core",t:"EF Core I — DbContext, entidades, relacionamentos e migrations",k:["ORM o que é","DbContext DbSet","relacionamentos EF Core 1:N N:N","Fluent API vs Data Annotations","Code First vs Database First","EF Core migrations Add-Migration Update-Database"],f:"<b>Code First × Database First</b> e para que servem as migrations."},
 {a:"Entity Framework Core",t:"EF Core II — consultas, carregamento e transações",k:["LINQ to Entities","eager loading Include ThenInclude","lazy loading explicit loading","AsNoTracking","change tracker SaveChanges","EF Core transações BeginTransaction"],f:"<b>Eager × Lazy × Explicit</b> e o problema N+1."},
 {a:"Arquitetura",t:"Camadas, cliente-servidor, Clean Architecture, SOA e microsserviços",k:["arquitetura em camadas","separação de responsabilidades","arquitetura cliente-servidor","Clean Architecture regra de dependência","SOA vs microsserviços","API Gateway microsserviços"],f:"Saber <b>vantagens/desvantagens</b> de microsserviços e a regra de dependência da Clean Arch."},
 {a:"Front-End",t:"Base web — HTML, CSS, JavaScript moderno e DOM",k:["HTML semântico","CSS box model flexbox","especificidade CSS","JavaScript let const arrow function","destructuring spread operator","Promises async await fetch","manipulação do DOM"],f:"Você não é de front: foque em <b>reconhecer código</b>, não em decorar tudo."},
 {a:"React",t:"React I — componentes, props, state e hooks",k:["React componentes JSX","props vs state","useState","useEffect array de dependências cleanup","ciclo de vida React","renderização condicional key em listas"],f:"<b>useEffect</b> com e sem array de dependências é questão clássica."},
 {a:"React",t:"React II — Context, rotas, formulários, APIs e TypeScript",k:["Context API React","React Router","formulário controlado vs não controlado","validação de formulários React","consumir API React fetch axios tratamento de erros","gerenciamento de estado Redux","TypeScript tipos interfaces","TypeScript props React"],f:"Entender o <b>problema que a Context API resolve</b> (prop drilling)."},
 {a:"Git",t:"Git — branches, merge, conflitos, PR, tags e estratégias",k:["repositório git init clone commit push pull","git branch","git merge fast-forward three-way","git rebase vs merge","resolver conflito de merge","pull request code review","git tag release","Git Flow GitHub Flow trunk-based","git reset revert stash cherry-pick"],f:"<b>reset × revert</b> e <b>merge × rebase</b> são os mais cobrados."},
 {a:"Métodos Ágeis",t:"Ágil — Manifesto, Scrum, Kanban, backlog e user stories",k:["Manifesto Ágil valores princípios","Scrum Guide 2020 papéis eventos artefatos","Sprint Planning Daily Review Retrospectiva","Product Goal Sprint Goal Definition of Done","Kanban WIP lead time cycle time","user story INVEST","backlog refinamento"],f:"Use o <b>Scrum Guide 2020</b> (FGV segue ele): timeboxes, 3 responsabilidades, 3 artefatos + compromissos."},
 {a:"Inteligência Artificial",t:"IA generativa, LLMs, engenharia de prompt e integração",k:["IA generativa o que é","LLM tokens temperatura","alucinação LLM","engenharia de prompt zero-shot few-shot","chain of thought prompt","uso responsável IA privacidade LGPD","integração API de IA REST","RAG embeddings conceito"],f:"Tema novo nos editais: questões costumam ser <b>conceituais</b> (limitações, validação, privacidade)."}
];
const POR = [
 {a:"Interpretação",t:"Interpretação de texto — coesão, coerência e intertextualidade",k:["interpretação de texto FGV","coesão referencial e sequencial","coerência textual","intertextualidade"],f:"FGV cobra muito <b>inferência</b> e “o que o texto NÃO diz”."},
 {a:"Tipologia",t:"Tipos textuais, modos discursivos e funções da linguagem",k:["tipos textuais narração descrição dissertação injunção","textos informativo normativo didático","texto literário vs não literário","funções da linguagem Jakobson","elementos da comunicação emissor receptor","registros formal informal"],f:"Saber identificar o <b>tipo predominante</b> de um trecho."},
 {a:"Classes de palavras",t:"Classes de palavras I — substantivo, adjetivo, artigo, numeral, pronome",k:["classes gramaticais resumo","pronomes relativos","pronomes demonstrativos uso","adjetivo vs advérbio"],f:"Foque em <b>pronomes relativos e demonstrativos</b> (coesão)."},
 {a:"Classes de palavras",t:"Classes de palavras II — verbos, advérbios, conjunções e modalizadores",k:["conjunções valor semântico","conjunções coordenativas subordinativas","modalizadores discursivos","tempos e modos verbais"],f:"<b>Valor semântico das conjunções</b> é o tema mais cobrado da FGV."},
 {a:"Sintaxe",t:"Sintaxe — termos da oração e orações",k:["termos essenciais integrantes acessórios","orações coordenadas","orações subordinadas substantivas adjetivas adverbiais","ordem direta e inversa","discurso direto indireto"],f:"Oração <b>adjetiva restritiva × explicativa</b> (ligada à vírgula)."},
 {a:"Pontuação",t:"Pontuação e sinais gráficos",k:["uso da vírgula regras","vírgula FGV","ponto e vírgula dois-pontos travessão","vírgula antes de e"],f:"Regras da vírgula: <b>nunca separar sujeito do verbo</b>, aposto, adjunto deslocado."},
 {a:"Norma culta",t:"Estrutura da frase, reescrita e norma culta",k:["reescrita de frases FGV","tipos de frase declarativa interrogativa exclamativa","problemas estruturais da frase paralelismo","concordância verbal e nominal","regência verbal","crase regras","colocação pronominal"],f:"FGV pede “reescrita que <b>mantém o sentido</b> e a correção”."},
 {a:"Semântica",t:"Semântica, vocabulário, dicionários, formação de palavras e ortografia",k:["sinônimos antônimos parônimos homônimos","hiperônimo hipônimo","polissemia ambiguidade","sentido figurado denotação conotação","neologismo arcaísmo estrangeirismo latinismo","formação de palavras derivação composição","abreviação sigla abreviatura","tipos de dicionários e organização de verbetes","acentuação gráfica novo acordo"],f:"<b>Ambiguidade</b> e <b>parônimos</b> (descrição/discrição, ratificar/retificar)."}
];
const NOR = [
 {m:"NOR",a:"Administração pública",t:"Art. 37 da CF, responsabilidade dos empregados públicos e Lei 9.784/1999",k:["art. 37 Constituição Federal LIMPE","empresa pública sociedade de economia mista","acumulação de cargos art. 37","responsabilidade civil penal administrativa empregado público","Lei 9.784/99 resumo","delegação e avocação","prazos e recurso Lei 9.784"],f:"<b>LIMPE</b>, acumulação de cargos (INB é <b>estatal</b>) e, na 9.784, prazos (recurso <b>10 dias</b>) e o que <b>não pode ser delegado</b>."},
 {m:"NOR",a:"Proteção de dados",t:"LGPD (Lei 13.709/2018) e noções de segurança da informação",k:["LGPD resumo","dados pessoais sensíveis LGPD","bases legais LGPD art. 7","princípios LGPD art. 6","direitos do titular LGPD","controlador operador encarregado","LGPD dados de candidatos em concurso e processo seletivo","ANPD","confidencialidade integridade disponibilidade"],f:"<b>Bases legais</b> e <b>agentes de tratamento</b> — e o tripé CID da segurança."},
 {m:"NOR",a:"Integridade",t:"Lei Anticorrupção 12.846/13, Decreto 11.129/22, conflito de interesses e governança",k:["Lei 12.846/2013 resumo","responsabilidade objetiva pessoa jurídica","acordo de leniência","programa de integridade Decreto 11.129","conflito de interesses Lei 12.813","Lei 13.303/2016 governança estatais"],f:"Responsabilidade <b>objetiva</b> da empresa e requisitos do <b>acordo de leniência</b>."},
 {m:"ING",a:"Língua Inglesa",t:"Inglês I — estratégias de leitura, compreensão e vocabulário",k:["skimming e scanning","palavras-chave e ideia principal do texto","inferência em textos em inglês","cognatos e falsos cognatos","prefixos e sufixos inglês","expressões idiomáticas técnicas inglês","marcadores discursivos linking words however although"],f:"Só 10 questões de peso 1: o objetivo é <b>não zerar</b>. Treine achar a <b>ideia principal</b> e o <b>objetivo</b> do texto."},
 {m:"NOR",a:"Integridade",t:"Improbidade (Lei 14.230/21) e Lei de Acesso à Informação (12.527/11)",k:["Lei 14.230/2021 mudanças improbidade","improbidade exige dolo","atos de improbidade art. 9 10 11","Lei de Acesso à Informação resumo","prazo LAI 20 dias prorrogação","classificação ultrassecreta secreta reservada prazos"],f:"Após 2021 improbidade exige <b>dolo</b>. LAI: <b>20+10 dias</b>; sigilo 25/15/5 anos."},
 {m:"NOR",a:"Segurança nuclear",t:"Segurança nuclear e radiológica — CNEN, ANSN e radioproteção",k:["CNEN o que faz","ANSN Autoridade Nacional de Segurança Nuclear","princípios proteção radiológica justificação otimização limitação","ALARA","tempo distância blindagem","segurança operacional em instalações nucleares","procedimentos básicos de radioproteção dosímetro área controlada","salvaguardas materiais nucleares","INB ciclo do combustível nuclear"],f:"Os <b>3 princípios</b> da radioproteção e a divisão CNEN × ANSN."},
 {m:"ING",a:"Língua Inglesa",t:"Inglês II — textos técnicos e normativos",k:["gêneros textuais técnicos report manual abstract","interpretação de gráficos e tabelas em inglês","vocabulário de normas internacionais ISO IAEA","vocabulário regulatório shall should may","termos de segurança qualidade e conformidade compliance","linguagem formal técnica inglês"],f:"Em normas, <b>shall</b> = obrigação, <b>should</b> = recomendação, <b>may</b> = permissão. Leia 1 trecho de norma da IAEA ou ISO."},
 {m:"NOR",a:"Trabalho e meio ambiente",t:"NR-01, Lei 6.938/81, licenciamento, resíduos e qualidade",k:["NR-01 GRO PGR","prevenção de acidentes industriais","Lei 6.938/81 Política Nacional do Meio Ambiente","SISNAMA","licença prévia instalação operação","responsabilidade ambiental objetiva civil penal administrativa","Política Nacional de Resíduos Sólidos","gestão de resíduos industriais classificação","ISO 14001 gestão ambiental sustentabilidade","princípios do desenvolvimento sustentável","ciclo PDCA","ISO 9001 gestão de processos"],f:"<b>GRO/PGR</b>, as 3 licenças (LP/LI/LO) e o ciclo <b>PDCA</b>."}
];
const FINAL = [
 {m:"FIN",a:"Reta final",t:"Revisão: C#, .NET, ASP.NET Core, EF Core e APIs",k:["questões FGV C#","questões FGV ASP.NET Core","questões FGV Entity Framework"],f:"Releia seus resumos e faça <b>20 questões</b> mistas. Anote o que errar."},
 {m:"FIN",a:"Reta final",t:"Revisão: Banco de dados, SQL e UML",k:["questões FGV SQL","questões FGV normalização","questões FGV UML"],f:"Refaça na mão 3 consultas com <b>JOIN + GROUP BY</b>."},
 {m:"FIN",a:"Reta final",t:"Revisão: Eng. de software, requisitos, arquitetura, Git, ágil, IA, React",k:["questões FGV Scrum","questões FGV Git","questões FGV engenharia de software"],f:"Foque nos temas em que você mais errou durante as revisões de domingo."},
 {m:"FIN",a:"Reta final",t:"Mini-simulado: 10 Português + 10 Normas + 10 Inglês",k:["prova FGV analista de sistemas 2024 pdf","prova FGV nível superior português"],f:"Cronometre: <b>~3 min por questão</b>. Corrija e anote os erros."},
 {m:"FIN",a:"Reta final",t:"Revisão: LGPD, LAI, Anticorrupção, nuclear + vírgula e crase",k:["LGPD bases legais resumo","prazos LAI","princípios proteção radiológica","vírgula e crase resumo"],f:"Revisão leve de <b>prazos e listas</b> que são decoreba."},
 {m:"FIN",a:"Véspera",t:"Véspera — revisão leve dos erros + logística da prova",k:["cartão de confirmação FGV INB","local de prova INB"],f:"Revise só seu caderno de erros. Separe <b>documento com foto</b> e caneta preta transparente, confira o local e o horário (<b>portões fecham 8h30</b>). Durma cedo."}
];


  return { ESP, POR, NOR, FINAL };
}

function dataAssistente() {

const ESP = [
 {a:"Noções de Administração",t:"Conceitos, princípios e funções administrativas",k:["o que é administração conceito","teoria clássica Fayol princípios","administração científica Taylor","funções administrativas PODC planejamento organização direção controle","eficiência vs eficácia vs efetividade"],f:"<b>PODC</b> e <b>eficiência × eficácia</b> são certeza de questão."},
 {a:"Noções de Administração",t:"Planejamento e controle",k:["planejamento estratégico tático operacional","análise SWOT","missão visão valores","metas SMART","tipos de controle preventivo concorrente posterior","indicadores de desempenho"],f:"Saber os <b>3 níveis</b> de planejamento e quem faz cada um."},
 {a:"Organização administrativa",t:"Estruturas organizacionais e organograma",k:["estrutura linear funcional linha-staff","estrutura matricial","estrutura por projetos","organograma tipos","estrutura formal e informal"],f:"<b>Vantagens/desvantagens</b> da estrutura linear × funcional × matricial."},
 {a:"Organização administrativa",t:"Departamentalização, autoridade, centralização e delegação",k:["tipos de departamentalização funcional produto geográfica cliente processo","divisão do trabalho especialização","autoridade e responsabilidade","centralização vs descentralização","delegação","amplitude de controle"],f:"Identificar o <b>tipo de departamentalização</b> num exemplo prático."},
 {a:"Gestão da qualidade",t:"Qualidade I — conceitos, princípios e melhoria contínua",k:["gestão da qualidade total TQM","Deming 14 pontos","Juran trilogia","ciclo PDCA","Kaizen melhoria contínua","ISO 9001 princípios da qualidade"],f:"<b>PDCA</b> etapa por etapa — a FGV adora."},
 {a:"Gestão da qualidade",t:"Qualidade II — ferramentas básicas",k:["diagrama de Ishikawa 6M","gráfico de Pareto 80/20","5W2H","programa 5S sensos","matriz GUT","folha de verificação histograma fluxograma"],f:"Saber <b>para que serve</b> cada ferramenta (causa, priorização, plano de ação)."},
 {a:"Recursos Humanos",t:"RH I — departamento pessoal",k:["rotinas departamento pessoal","admissão documentos CTPS digital","eSocial o que é","jornada de trabalho CLT horas extras","férias 13º salário FGTS","tipos de rescisão contrato de trabalho"],f:"Noções gerais da CLT: <b>férias, 13º, FGTS</b> e tipos de demissão."},
 {a:"Recursos Humanos",t:"RH II — remuneração, administração de pessoal e relações no trabalho",k:["remuneração vs salário benefícios","recrutamento interno externo","seleção de pessoas","treinamento e desenvolvimento","avaliação de desempenho 360 graus","motivação Maslow Herzberg","liderança estilos"],f:"<b>Maslow × Herzberg</b> (fatores higiênicos × motivacionais) cai muito."},
 {a:"Atendimento ao público",t:"Atendimento I — comunicação e relacionamento interpessoal",k:["elementos da comunicação emissor receptor ruído","barreiras da comunicação","comunicação assertiva","empatia no atendimento","comunicação verbal e não verbal","relacionamento interpessoal no trabalho"],f:"FGV dá uma <b>situação de atendimento</b> e pede a postura correta."},
 {a:"Atendimento ao público",t:"Atendimento II — qualidade no atendimento e reclamações",k:["qualidade no atendimento ao público","cliente interno e externo","como tratar reclamações","atendimento telefônico técnicas","ouvidoria função","Lei 13.460 usuário do serviço público"],f:"Na reclamação: <b>ouvir, não interromper, registrar e dar retorno</b>."},
 {a:"Técnicas administrativas",t:"Técnicas organizativas, instrumentos, planilhas e gráficos",k:["fluxograma símbolos","organograma vs fluxograma","manuais administrativos tipos","formulários administrativos","cronograma e gráfico de Gantt","gráficos administrativos tipos barra pizza linha"],f:"Saber escolher o <b>gráfico/instrumento certo</b> para cada situação."},
 {a:"Redação administrativa",t:"Redação I — Manual de Redação da Presidência",k:["Manual de Redação da Presidência 3ª edição","atributos redação oficial clareza concisão impessoalidade","padrão ofício estrutura","pronomes de tratamento redação oficial","fechos Atenciosamente Respeitosamente"],f:"Desde 2018 tudo segue o <b>padrão ofício</b>; “Respeitosamente” só para autoridade superior."},
 {a:"Redação administrativa",t:"Redação II — documentos, e-mail e reuniões",k:["tipos de documentos ofício ata relatório requerimento","correspondência oficial e empresarial","como fazer uma ata","circular e comunicado","e-mail corporativo boas práticas CC CCO","organização de reuniões pauta convocação"],f:"Saber o que é <b>ata</b> e o que deve ter nela."},
 {a:"Gestão de documentos",t:"Arquivo I — conceitos, ciclo vital e protocolo",k:["gestão de documentos conceito Lei 8.159/91","teoria das três idades arquivo corrente intermediário permanente","protocolo recebimento registro","classificação de documentos","tramitação de documentos"],f:"<b>Teoria das 3 idades</b> é a questão mais certa de arquivologia."},
 {a:"Gestão de documentos",t:"Arquivo II — métodos de arquivamento, conservação e temporalidade",k:["métodos de arquivamento alfabético numérico geográfico","método ideográfico cronológico","regras de alfabetação","tabela de temporalidade","conservação de documentos","consulta e empréstimo de documentos"],f:"Treine as <b>regras de alfabetação</b> (sobrenome, partículas, nomes compostos)."},
 {a:"Materiais e patrimônio",t:"Materiais I — classificação, compras, recebimento e armazenagem",k:["classificação de materiais","curva ABC estoque","processo de compras etapas","recebimento provisório e definitivo","armazenagem PEPS UEPS FIFO LIFO","layout de almoxarifado"],f:"<b>Curva ABC</b> e <b>PEPS × UEPS</b> são clássicos."},
 {a:"Materiais e patrimônio",t:"Materiais II — controle de estoques, inventário e patrimônio",k:["estoque mínimo estoque de segurança","ponto de pedido fórmula","lote econômico de compra","giro de estoque","inventário rotativo e geral","controle patrimonial tombamento","depreciação de bens"],f:"Saber calcular <b>ponto de pedido</b> e <b>giro</b> (contas simples)."},
 {a:"Financeiro e orçamento",t:"Financeiro I — receitas, despesas e orçamento",k:["receita e despesa conceitos","orçamento empresarial tipos","orçamento base zero","orçamento-programa","ciclo orçamentário","custos fixos e variáveis"],f:"Diferenciar <b>receita × despesa</b> e <b>custo fixo × variável</b>."},
 {a:"Financeiro e orçamento",t:"Financeiro II — fluxo de caixa, controles e matemática financeira",k:["fluxo de caixa o que é","controles financeiros internos","conciliação bancária","contas a pagar e receber","juros simples fórmula","juros compostos fórmula","desconto simples"],f:"Treine contas de <b>juros simples e compostos</b> — também caem em Raciocínio Lógico."},
 {a:"Gestão de contratos",t:"Gestão e fiscalização de contratos",k:["gestor vs fiscal de contrato","fiscalização de contratos","Lei 13.303 contratos estatais","Lei 14.133 gestão de contratos noções","termo aditivo","prazos e vigência de contratos","obrigações do contratado e do contratante","documentação contratual"],f:"INB é estatal: contratos seguem a <b>Lei 13.303/2016</b>. Saber o papel do <b>gestor × fiscal</b>."},
 {a:"Informática",t:"Informática I — Windows, navegação web e e-mail",k:["Windows atalhos de teclado","explorador de arquivos Windows","navegador abas histórico navegação anônima","cookies e cache","e-mail CC CCO anexos","phishing e-mail"],f:"<b>CCO</b> e atalhos (Ctrl+C/V/X/Z, Win+E, Win+D) caem muito."},
 {a:"Informática",t:"Informática II — Word",k:["Word formatação de parágrafo","Word estilos e sumário","Word cabeçalho rodapé quebra de página","Word mala direta","atalhos Word"],f:"Saber <b>em qual guia</b> fica cada recurso."},
 {a:"Informática",t:"Informática III — Excel",k:["Excel referência relativa absoluta $","Excel SOMA MÉDIA MÁXIMO MÍNIMO","Excel função SE","PROCV PROCX","CONT.SE SOMASE","Excel filtros e gráficos"],f:"Você já é intermediário: foque em <b>calcular o resultado</b> de uma fórmula dada."},
 {a:"Informática",t:"Informática IV — PowerPoint e segurança básica",k:["PowerPoint layouts slide mestre","transição vs animação PowerPoint","PowerPoint modo de apresentação F5","backup tipos","vírus malware antivírus"],f:"<b>Transição × animação</b> e <b>F5 × Shift+F5</b>."},
 {a:"Ética",t:"Ética e comportamento no ambiente organizacional",k:["ética vs moral","ética profissional","postura profissional no trabalho","assédio moral no trabalho","sigilo profissional","código de conduta empresa estatal"],f:"Questões situacionais: escolha sempre a atitude <b>ética, sigilosa e respeitosa</b>."}
];
const RLM = [
 {m:"ING",a:"Raciocínio lógico",t:"Lógica I — proposições, conectivos, tabela-verdade e associação",k:["proposição lógica o que é","conectivos e ou se então se e somente se","tabela-verdade","problemas de associação lógica quem é quem"],f:"Decore quando cada conectivo é <b>falso</b> (o “se… então” só é falso em V→F)."},
 {m:"ING",a:"Raciocínio lógico",t:"Lógica II — equivalências, negações e quantificadores",k:["equivalência lógica contrapositiva","leis de De Morgan","negação do se então","negação todo algum nenhum","quantificadores e predicados lógica"],f:"<b>Negação de “se A então B” = A e não B</b> — cai em toda prova FGV."},
 {m:"ING",a:"Matemática",t:"Conjuntos, números e porcentagem",k:["diagrama de Venn problemas","operações com conjuntos união interseção","frações e números racionais","porcentagem aumento e desconto sucessivo","MMC MDC problemas"],f:"<b>Aumentos sucessivos</b> não se somam (10% + 10% = 21%)."},
 {m:"ING",a:"Matemática",t:"Proporcionalidade, regra de três, juros e medidas",k:["regra de três simples e composta","grandezas diretamente e inversamente proporcionais","juros simples e compostos exercícios","conversão de medidas comprimento área volume massa","medidas de tempo conversão"],f:"Na regra de três composta, <b>identifique se é direta ou inversa</b> antes de montar."},
 {m:"ING",a:"Matemática",t:"Contagem e probabilidade",k:["princípio fundamental da contagem","permutação arranjo combinação diferença","probabilidade básica exercícios","probabilidade evento complementar"],f:"Pergunta-chave: <b>a ordem importa?</b> Sim = arranjo, não = combinação."},
 {m:"ING",a:"Matemática",t:"Geometria básica e plano cartesiano",k:["área e perímetro de figuras planas","triângulos tipos Pitágoras","soma dos ângulos internos polígono","plano cartesiano coordenadas","distância entre dois pontos"],f:"Fórmulas de <b>área</b> e <b>Pitágoras</b> resolvem a maioria."},
 {m:"ING",a:"Raciocínio lógico",t:"Estatística, gráficos e raciocínio (sequencial, espacial, verbal)",k:["média moda mediana","desvio padrão conceito","interpretação de gráficos e tabelas","sequências lógicas numéricas e de letras","orientação espacial e temporal questões","problemas matriciais raciocínio lógico","raciocínio verbal formação de conceitos discriminação de elementos"],f:"<b>Mediana</b>: ordene os dados primeiro! Nas questões de raciocínio, desenhe uma <b>tabela</b> para organizar as informações."}
];
const POR = [
 {a:"Interpretação",t:"Interpretação de texto — coesão, coerência e intertextualidade",k:["interpretação de texto FGV","coesão referencial e sequencial","coerência textual","intertextualidade"],f:"FGV cobra muito <b>inferência</b> e “o que o texto NÃO diz”."},
 {a:"Tipologia",t:"Tipos textuais, modos discursivos e funções da linguagem",k:["tipos textuais narração descrição dissertação injunção","textos informativo normativo didático","texto literário vs não literário","funções da linguagem Jakobson","registros formal informal","elementos da comunicação"],f:"Saber identificar o <b>tipo predominante</b> de um trecho."},
 {a:"Classes de palavras",t:"Classes de palavras I — substantivo, adjetivo, artigo, numeral, pronome",k:["classes gramaticais resumo","pronomes relativos","pronomes demonstrativos uso","adjetivo vs advérbio"],f:"Foque em <b>pronomes relativos e demonstrativos</b> (coesão)."},
 {a:"Classes de palavras",t:"Classes de palavras II — verbos, advérbios, conjunções e modalizadores",k:["conjunções valor semântico","conjunções coordenativas subordinativas","modalizadores discursivos","tempos e modos verbais"],f:"<b>Valor semântico das conjunções</b> é o tema mais cobrado da FGV."},
 {a:"Sintaxe",t:"Sintaxe — termos da oração e orações",k:["termos essenciais integrantes acessórios","orações coordenadas","orações subordinadas substantivas adjetivas adverbiais","ordem direta e inversa","discurso direto indireto"],f:"Oração <b>adjetiva restritiva × explicativa</b> (ligada à vírgula)."},
 {a:"Pontuação",t:"Pontuação e sinais gráficos",k:["uso da vírgula regras","vírgula FGV","ponto e vírgula dois-pontos travessão","vírgula antes de e"],f:"Regras da vírgula: <b>nunca separar sujeito do verbo</b>, aposto, adjunto deslocado."},
 {a:"Norma culta",t:"Estrutura da frase, reescrita e norma culta",k:["reescrita de frases FGV","tipos de frase declarativa interrogativa exclamativa","problemas estruturais da frase paralelismo","concordância verbal e nominal","regência verbal","crase regras","colocação pronominal"],f:"FGV pede “reescrita que <b>mantém o sentido</b> e a correção”."},
 {a:"Semântica",t:"Semântica, vocabulário, dicionários, formação de palavras e ortografia",k:["sinônimos antônimos parônimos homônimos","hiperônimo hipônimo","polissemia ambiguidade","neologismo arcaísmo estrangeirismo latinismo","formação de palavras derivação composição","abreviação siglas","tipos de dicionários e organização de verbetes","acentuação gráfica novo acordo"],f:"<b>Ambiguidade</b> e <b>parônimos</b> (descrição/discrição, ratificar/retificar)."}
];
const NOR = [
 {m:"NOR",a:"Administração pública",t:"Art. 37 da CF e responsabilidade dos empregados públicos",k:["art. 37 Constituição Federal LIMPE","princípios da administração pública","empresa pública sociedade de economia mista","acumulação de cargos art. 37","responsabilidade civil penal administrativa servidor"],f:"<b>LIMPE</b> + regras de concurso e acumulação. INB é <b>empresa estatal</b>."},
 {m:"NOR",a:"Administração pública",t:"Lei 9.784/1999 — processo administrativo federal",k:["Lei 9.784/99 resumo","princípios processo administrativo","delegação e avocação","prazos Lei 9.784","recurso administrativo Lei 9.784"],f:"Prazos (recurso <b>10 dias</b>, decisão 30 dias) e o que <b>não pode ser delegado</b>."},
 {m:"NOR",a:"Proteção de dados",t:"LGPD (Lei 13.709/2018) e noções de segurança da informação",k:["LGPD resumo","dados pessoais sensíveis LGPD","bases legais LGPD art. 7","princípios LGPD art. 6","direitos do titular LGPD","controlador operador encarregado","LGPD dados de candidatos em concurso e processo seletivo","confidencialidade integridade disponibilidade"],f:"<b>Bases legais</b> e <b>agentes de tratamento</b> — e o tripé CID da segurança."},
 {m:"NOR",a:"Integridade",t:"Lei Anticorrupção 12.846/13, Decreto 11.129/22, conflito de interesses e governança",k:["Lei 12.846/2013 resumo","responsabilidade objetiva pessoa jurídica","acordo de leniência","programa de integridade Decreto 11.129","conflito de interesses Lei 12.813","Lei 13.303/2016 governança estatais"],f:"Responsabilidade <b>objetiva</b> da empresa e requisitos do <b>acordo de leniência</b>."},
 {m:"NOR",a:"Integridade",t:"Improbidade (Lei 14.230/21) e Lei de Acesso à Informação (12.527/11)",k:["Lei 14.230/2021 mudanças improbidade","improbidade exige dolo","atos de improbidade art. 9 10 11","Lei de Acesso à Informação resumo","prazo LAI 20 dias prorrogação","classificação ultrassecreta secreta reservada prazos"],f:"Após 2021 improbidade exige <b>dolo</b>. LAI: <b>20+10 dias</b>; sigilo 25/15/5 anos."},
 {m:"NOR",a:"Segurança nuclear",t:"Segurança nuclear e radiológica — CNEN, ANSN e radioproteção",k:["CNEN o que faz","ANSN Autoridade Nacional de Segurança Nuclear","princípios proteção radiológica justificação otimização limitação","ALARA","tempo distância blindagem","segurança operacional em instalações nucleares","procedimentos básicos de radioproteção dosímetro área controlada","salvaguardas materiais nucleares","INB ciclo do combustível nuclear"],f:"Os <b>3 princípios</b> da radioproteção e a divisão CNEN × ANSN."},
 {m:"NOR",a:"Trabalho e meio ambiente",t:"NR-01, Lei 6.938/81, licenciamento, resíduos e qualidade",k:["NR-01 GRO PGR","prevenção de acidentes industriais","Lei 6.938/81 Política Nacional do Meio Ambiente","SISNAMA","licença prévia instalação operação","responsabilidade ambiental objetiva civil penal administrativa","Política Nacional de Resíduos Sólidos","gestão de resíduos industriais classificação","ISO 14001 gestão ambiental sustentabilidade","princípios do desenvolvimento sustentável","ciclo PDCA gestão de processos"],f:"<b>GRO/PGR</b>, as 3 licenças (LP/LI/LO) e o ciclo <b>PDCA</b>."}
];
// Sábados: 7 de Normas + 1 de Raciocínio (estatística) no meio
const SAT = [NOR[0],NOR[1],NOR[2],NOR[3],RLM[6],NOR[4],NOR[5],NOR[6]];
const FINAL = [
 {m:"FIN",a:"Reta final",t:"Revisão: Administração, organização, qualidade e RH",k:["questões FGV noções de administração","questões FGV gestão da qualidade","questões FGV recursos humanos"],f:"Releia seus resumos e faça <b>20 questões</b> mistas. Anote o que errar."},
 {m:"FIN",a:"Reta final",t:"Revisão: Arquivo, redação oficial, atendimento e materiais",k:["questões FGV arquivologia","questões FGV redação oficial","questões FGV administração de materiais"],f:"Revise <b>teoria das 3 idades</b>, padrão ofício e <b>curva ABC</b>."},
 {m:"FIN",a:"Reta final",t:"Revisão: Informática, financeiro, contratos e ética",k:["questões FGV Excel","questões FGV informática nível médio","questões FGV fluxo de caixa"],f:"Refaça 5 fórmulas de Excel e 3 contas de juros na mão."},
 {m:"FIN",a:"Reta final",t:"Mini-simulado: 10 Português + 10 Normas + 10 Raciocínio Lógico",k:["prova FGV assistente administrativo pdf","prova FGV nível médio raciocínio lógico"],f:"Cronometre: <b>~3 min por questão</b>. Corrija e anote os erros."},
 {m:"FIN",a:"Reta final",t:"Revisão: LGPD, LAI, Anticorrupção, nuclear + vírgula, crase e negações lógicas",k:["LGPD bases legais resumo","prazos LAI","princípios proteção radiológica","negação de proposições resumo"],f:"Revisão leve de <b>prazos, listas e negações</b>."},
 {m:"FIN",a:"Véspera",t:"Véspera — revisão leve dos erros + logística da prova",k:["cartão de confirmação FGV INB","local de prova INB"],f:"Revise só seu caderno de erros. Separe <b>documento com foto</b> e caneta preta transparente, confira o local e o horário (<b>portões fecham 15h30</b>). Durma cedo."}
];


  return { ESP, RLM, POR, NOR, SAT, FINAL };
}

// =====================================================================
// Analista de Sistemas — cronograma DIÁRIO (19/11/2026 → 09/01/2027)
// Rotina: Seg/Ter/Qui/Sáb = TI · Qua = Português · Sex = Normas · Dom = Inglês + revisão
// Cada bloco: a = área, t = título, s = subtópicos do edital, k = buscas no YouTube, f = foco
// =====================================================================
const DIARIO_START = [2026, 10, 19], SIM_START = [2027, 0, 7];

function dataAnalistaDiario() {
const W = [
 { // Semana 1 · 19/11 a 25/11
  ESP: [
   {a:"C#",t:"C# básico — tipos, variáveis, operadores, condicionais, laços e métodos",s:["Tipos e variáveis","Operadores","Condicionais (if/switch)","Laços (for, foreach, while)","Métodos e parâmetros"],k:["C# para iniciantes tipos e variáveis","C# operadores e estruturas condicionais","C# laços for foreach while","C# métodos parâmetros ref out"],f:"Atenção a <b>divisão inteira</b> (7/2 = 3), <b>tipos de valor × referência</b> e <b>ref/out</b>: a FGV cobra com trechos de código."},
   {a:"Orientação a Objetos",t:"POO I — classes, objetos, encapsulamento e herança",s:["Classes e objetos","Encapsulamento e modificadores de acesso","Herança"],k:["C# classes e objetos","C# encapsulamento propriedades get set","C# herança virtual override"],f:"Saiba os modificadores <b>public, private, protected, internal</b> e quando a herança gera acoplamento."},
   {a:"Orientação a Objetos",t:"POO II — polimorfismo, abstração, interfaces e composição",s:["Polimorfismo (override × overload)","Abstração e classes abstratas","Interfaces","Composição × herança"],k:["C# polimorfismo override overload","C# classe abstrata vs interface","composição vs herança orientação a objetos"],f:"Diferencie <b>sobrescrita</b> (execução) de <b>sobrecarga</b> (compilação) e <b>classe abstrata × interface</b>."},
   {a:"Boas práticas",t:"Exceções + SOLID, coesão e acoplamento",s:["Exceções (try/catch/finally, throw)","Princípios SOLID","Coesão e acoplamento"],k:["C# tratamento de exceções try catch finally","princípios SOLID exemplos C#","coesão e acoplamento engenharia de software"],f:"FGV dá um código e pergunta <b>qual princípio SOLID foi violado</b>. Lembre: <b>throw;</b> preserva o stack trace."}
  ],
  POR: {a:"Leitura",t:"Interpretação de texto, coesão, coerência e intertextualidade",s:["Interpretação de texto","Coesão (referencial e sequencial)","Coerência","Intertextualidade"],k:["interpretação de texto FGV dicas","coesão e coerência textual","intertextualidade paráfrase paródia"],f:"Elimine alternativas que <b>extrapolam</b>, <b>reduzem</b> ou <b>contradizem</b> o texto."},
  NOR: {a:"Administração pública",t:"Art. 37 da CF (princípios) e Lei 9.784/1999 (processo administrativo)",s:["Princípios da Administração Pública (art. 37 CF)","Processo administrativo (Lei 9.784/1999)"],k:["art. 37 Constituição LIMPE","Lei 9.784/99 resumo prazos","delegação e avocação Lei 9.784"],f:"<b>LIMPE</b>; recurso em <b>10 dias</b>, reconsideração em 5, decisão em 30; não se delega <b>atos normativos, recursos e competência exclusiva</b>."},
  ING: {a:"Inglês instrumental",t:"Skimming, scanning e palavras-chave",s:["Skimming","Scanning","Palavras-chave"],k:["skimming e scanning inglês instrumental","inglês instrumental palavras-chave"],f:"Skimming = ideia geral; scanning = informação específica. Na 2ª metade, refaça os <b>erros da semana</b>."}
 },
 { // Semana 2 · 26/11 a 02/12
  ESP: [
   {a:"C# avançado",t:"Generics e Collections",s:["Generics e restrições (where)","Collections (List, Dictionary, HashSet, Queue, Stack)"],k:["C# generics restrições where","C# List Dictionary HashSet diferenças"],f:"Saiba qual coleção usar: <b>Dictionary</b> para busca por chave, <b>HashSet</b> sem duplicatas."},
   {a:"C# avançado",t:"LINQ, Delegates e Events",s:["LINQ (Where, Select, First, Single, execução adiada)","Delegates (Func, Action, Predicate)","Events"],k:["C# LINQ tutorial","C# delegates Func Action","C# events EventHandler"],f:"<b>Execução adiada</b> do LINQ e a diferença <b>First × Single</b> caem muito."},
   {a:"C# avançado",t:"Programação assíncrona — async/await, Task e CancellationToken",s:["async/await","Task e Task.WhenAll","CancellationToken"],k:["C# async await explicado","C# Task WhenAll WhenAny","C# CancellationToken"],f:"Evite <b>.Result</b> e <b>async void</b>; cancelamento é <b>cooperativo</b>."},
   {a:".NET",t:"Dependency Injection, Configuration, Logging e NuGet",s:["Injeção de dependência (Transient, Scoped, Singleton)","Configuration (appsettings, ambientes)","Logging (ILogger, níveis)","NuGet"],k:["ASP.NET Core injeção de dependência scoped transient singleton","ASP.NET Core appsettings configuration","ILogger níveis de log .NET","NuGet pacotes .NET"],f:"<b>Scoped</b> = uma instância por requisição. Na configuração, a <b>última fonte vence</b> (variável de ambiente sobrescreve appsettings)."}
  ],
  POR: {a:"Tipologia",t:"Tipos textuais e modos de organização",s:["Descrição","Narração","Exposição","Argumentação","Injunção"],k:["tipos textuais narração descrição dissertação","texto injuntivo características","modos de organização do discurso"],f:"Identifique o <b>verbo predominante</b> e a <b>finalidade</b> do trecho."},
  NOR: {a:"Integridade",t:"Lei Anticorrupção 12.846/2013, Decreto 11.129/2022 e improbidade (Lei 14.230/2021)",s:["Lei Anticorrupção (12.846/2013)","Decreto 11.129/2022 (programa de integridade)","Improbidade administrativa (Lei 14.230/2021)"],k:["Lei 12.846/2013 resumo anticorrupção","acordo de leniência Lei 12.846","Lei 14.230/2021 improbidade dolo"],f:"Pessoa jurídica responde <b>objetivamente</b>; leniência reduz multa em até <b>2/3</b>; improbidade agora exige <b>dolo</b>."},
  ING: {a:"Vocabulário",t:"Cognatos, falsos cognatos, prefixos e sufixos",s:["Cognatos","Falsos cognatos","Prefixos e sufixos"],k:["falsos cognatos inglês lista","prefixos e sufixos em inglês"],f:"<b>Eventually</b> = por fim; <b>actually</b> = na verdade; <b>-less</b> = sem."}
 },
 { // Semana 3 · 03/12 a 09/12
  ESP: [
   {a:"Banco de dados",t:"Modelagem, modelo relacional, chaves e integridade referencial",s:["Modelagem conceitual, lógica e física","Modelo relacional","Chaves (primária, candidata, estrangeira)","Integridade referencial"],k:["modelagem conceitual lógica física banco de dados","modelo relacional chave primária estrangeira","integridade referencial ON DELETE CASCADE"],f:"Relação N:N vira <b>tabela associativa</b>; FK aponta para registro existente ou é nula."},
   {a:"Banco de dados",t:"Normalização (1FN, 2FN, 3FN) + SELECT, INSERT, UPDATE e DELETE",s:["Normalização (1FN, 2FN, 3FN)","SELECT","INSERT, UPDATE e DELETE"],k:["normalização 1FN 2FN 3FN exemplos","SQL Server SELECT WHERE GROUP BY HAVING","SQL INSERT UPDATE DELETE"],f:"2FN = sem dependência <b>parcial</b>; 3FN = sem dependência <b>transitiva</b>. <b>HAVING</b> filtra grupos."},
   {a:"Banco de dados",t:"JOIN, subqueries e views",s:["JOINs (INNER, LEFT, RIGHT, FULL)","Subqueries (IN, EXISTS)","Views"],k:["SQL JOIN inner left right explicado","SQL subquery EXISTS NOT EXISTS","SQL Server view"],f:"LEFT JOIN mantém todas as linhas da esquerda; <b>COUNT(coluna)</b> ignora NULL."},
   {a:"Banco de dados",t:"Procedures, functions, triggers e transações",s:["Stored procedures","Functions","Triggers (inserted/deleted)","Transações e ACID"],k:["SQL Server stored procedure","SQL Server function vs procedure","SQL Server trigger inserted deleted","transações ACID SQL Server"],f:"Trigger de UPDATE: <b>deleted</b> = valor antigo, <b>inserted</b> = novo. ACID e <b>SAVE TRAN</b>."}
  ],
  POR: {a:"Gramática",t:"Pontuação e norma culta",s:["Pontuação (vírgula, ponto e vírgula, dois-pontos)","Norma culta"],k:["uso da vírgula regras FGV","oração adjetiva restritiva explicativa vírgula"],f:"Não se separa <b>sujeito e verbo</b> por vírgula. Restritiva × explicativa muda o sentido."},
  NOR: {a:"Integridade",t:"LAI (Lei 12.527/2011), conflito de interesses e governança corporativa",s:["Lei de Acesso à Informação (12.527/2011)","Conflito de interesses","Governança corporativa"],k:["Lei de Acesso à Informação resumo prazos","conflito de interesses Lei 12.813","governança corporativa princípios estatais Lei 13.303"],f:"LAI: <b>20 + 10 dias</b>; sigilo 25/15/5 anos; não se exige o motivo do pedido."},
  ING: {a:"Leitura",t:"Marcadores discursivos",s:["Marcadores discursivos (however, therefore, although...)"],k:["linking words inglês however therefore although","conectivos em inglês"],f:"Classifique: adição, <b>contraste</b>, causa, <b>resultado</b>, condição (<b>unless</b> = a menos que)."}
 },
 { // Semana 4 · 10/12 a 16/12
  ESP: [
   {a:"ASP.NET Core",t:"ASP.NET Core I — estrutura, Controllers/Actions, MVC, Razor e Middleware",s:["Estrutura do projeto (Program.cs)","Controllers e Actions","MVC","Razor","Middleware"],k:["ASP.NET Core MVC do zero","ASP.NET Core controllers actions","Razor views tag helpers","ASP.NET Core middleware pipeline ordem"],f:"A <b>ordem dos middlewares</b> importa: UseAuthentication antes de UseAuthorization."},
   {a:"ASP.NET Core",t:"ASP.NET Core II — appsettings, ambiente, exceções globais, autenticação e autorização",s:["appsettings e variáveis de ambiente","Tratamento global de exceções","Autenticação","Autorização e roles"],k:["ASP.NET Core appsettings variáveis de ambiente","ASP.NET Core tratamento global de exceções","ASP.NET Core autenticação JWT","ASP.NET Core Authorize roles policies"],f:"<b>401</b> = não autenticado; <b>403</b> = sem permissão."},
   {a:"Web API",t:"Web API — REST, métodos e status HTTP, JSON, DTOs, Swagger, versionamento, paginação e validação",s:["REST","Métodos HTTP","Status HTTP","JSON","DTOs","Swagger/OpenAPI","Versionamento de API","Paginação","Validação"],k:["ASP.NET Core Web API REST","métodos HTTP idempotentes status code","DTO Web API C#","Swagger OpenAPI ASP.NET Core","paginação Web API Skip Take"],f:"<b>POST</b> não é idempotente; <b>201 Created</b> + Location na criação."},
   {a:"Entity Framework Core",t:"EF Core — DbContext, entidades, migrations, Code First/Database First, relacionamentos e carregamento",s:["DbContext e entidades","Migrations","Code First e Database First","Relacionamentos","Carregamento de dados (Include, lazy, explicit)"],k:["Entity Framework Core tutorial","EF Core migrations Code First","EF Core Database First scaffold","EF Core Include eager lazy loading"],f:"<b>Include</b> evita N+1; <b>AsNoTracking</b> para leitura; Fluent API vence Data Annotations."}
  ],
  POR: {a:"Sintaxe",t:"Sintaxe — termos e orações, ordem direta e inversa, tipos de discurso",s:["Termos da oração","Orações coordenadas e subordinadas","Ordem direta e inversa","Discurso direto, indireto e indireto livre"],k:["análise sintática termos da oração","orações subordinadas resumo","discurso direto indireto indireto livre"],f:"Verbo <b>haver</b> (existir) é impessoal: \"Deve haver vagas\"."},
  NOR: {a:"Proteção de dados",t:"LGPD (Lei 13.709/2018) e noções de segurança da informação",s:["LGPD (Lei 13.709/2018)","Segurança da informação (CID)"],k:["LGPD resumo para concurso","bases legais LGPD art 7 art 11","confidencialidade integridade disponibilidade"],f:"Agentes: <b>controlador, operador, encarregado</b>. Dado sensível tem bases próprias (art. 11)."},
  ING: {a:"Leitura técnica",t:"Textos técnicos e normativos",s:["Textos técnicos","Textos normativos (shall, should, may)"],k:["inglês técnico leitura de manuais","shall should may must normas"],f:"Em normas: <b>shall</b> = obrigatório; <b>should</b> = recomendação."}
 },
 { // Semana 5 · 17/12 a 23/12
  ESP: [
   {a:"Engenharia de Software",t:"Ciclo de vida e modelos de processo (tradicionais e ágeis)",s:["Ciclo de vida do software","Modelos tradicionais (cascata, V, incremental, espiral, RUP)","Modelos ágeis"],k:["modelos de processo de software cascata espiral incremental","modelo em V testes","manifesto ágil valores e princípios"],f:"O espiral é <b>iterativo e guiado por riscos</b>; TDD = teste antes do código."},
   {a:"Requisitos",t:"Requisitos — funcionais e não funcionais, regras de negócio, critérios de aceitação e rastreabilidade",s:["Requisitos funcionais e não funcionais","Regras de negócio","Critérios de aceitação","Rastreabilidade"],k:["requisitos funcionais e não funcionais exemplos","regra de negócio vs requisito","critérios de aceitação Gherkin dado quando então","matriz de rastreabilidade de requisitos"],f:"Requisito de desempenho que cita uma função <b>continua não funcional</b>."},
   {a:"UML",t:"UML — casos de uso, classes, sequência, atividades e componentes",s:["Diagrama de casos de uso","Diagrama de classes","Diagrama de sequência","Diagrama de atividades","Diagrama de componentes"],k:["UML casos de uso include extend","UML diagrama de classes relacionamentos","UML diagrama de sequência fragmentos","UML diagrama de atividades fork join"],f:"<b>include</b> = obrigatório; <b>extend</b> = condicional. Losango cheio = composição."},
   {a:"Arquitetura",t:"Arquitetura — camadas, cliente-servidor, Clean Architecture, SOA e microsserviços",s:["Arquitetura em camadas","Cliente-servidor","Clean Architecture","SOA","Microsserviços"],k:["arquitetura em camadas MVC","Clean Architecture explicada","SOA vs microsserviços","microsserviços padrões API gateway circuit breaker"],f:"Clean Architecture: dependências apontam <b>para dentro</b>. Microsserviços: <b>um banco por serviço</b>."}
  ],
  POR: {a:"Morfologia",t:"Classes de palavras — pronomes, conjunções e modalizadores",s:["Classes de palavras","Pronomes","Conjunções","Modalizadores"],k:["classes de palavras resumo","conjunções coordenativas e subordinativas","modalizadores discursivos"],f:"<b>Embora</b> = concessão; <b>pois</b> após o verbo = conclusão."},
  NOR: {a:"Segurança nuclear",t:"Segurança nuclear — ANSN, normas CNEN, proteção radiológica e controle de materiais nucleares",s:["ANSN e CNEN","Normas da CNEN","Proteção radiológica (justificação, otimização, limitação)","Radioproteção na prática (tempo, distância, blindagem)","Controle de materiais nucleares (salvaguardas)"],k:["ANSN Autoridade Nacional de Segurança Nuclear","princípios de proteção radiológica ALARA","CNEN NN 3.01 limites de dose","salvaguardas materiais nucleares ABACC"],f:"Limites: <b>20 mSv/ano</b> (trabalhador) e <b>1 mSv/ano</b> (público)."},
  ING: {a:"Leitura",t:"Gráficos e tabelas em inglês",s:["Leitura de gráficos e tabelas"],k:["describing graphs in english vocabulary","inglês gráficos increase decrease"],f:"Vocabulário de tendência: <b>increase, decrease, peak, steady, drop</b>."}
 },
 { // Semana 6 · 24/12 a 30/12
  ESP: [
   {a:"Front-end",t:"HTML, CSS, JavaScript e DOM",s:["HTML semântico","CSS (box model, flexbox, grid)","JavaScript moderno","DOM"],k:["HTML semântico","CSS flexbox e grid","JavaScript moderno ES6","manipulação do DOM JavaScript"],f:"<b>fetch</b> não rejeita em 404/500; <b>===</b> compara sem coerção."},
   {a:"React",t:"React I — componentes, props, state, hooks e ciclo de vida",s:["Componentes","Props","State","Hooks (useState, useEffect)","Ciclo de vida"],k:["React do zero componentes props","React useState explicado","React useEffect dependências"],f:"setState não é imediato: use a <b>forma funcional</b> (prev =&gt; prev + 1)."},
   {a:"React",t:"React II — Context API, rotas, formulários, consumo de APIs e TypeScript",s:["Context API","Rotas (React Router)","Formulários controlados","Consumo de APIs","TypeScript"],k:["React Context API","React Router useParams useNavigate","React formulário controlado","React TypeScript básico"],f:"<b>useParams</b> lê :id da rota; <b>unknown</b> exige checar o tipo, <b>any</b> não."},
   {a:"Git e ágil",t:"Git (branches, merge, conflitos, PRs, code review, tags) + Scrum e Kanban",s:["Git: branches e merge","Git: conflitos","Pull requests e code review","Tags e versionamento","Scrum (papéis, eventos, artefatos)","Kanban","Backlog e user stories"],k:["git branch merge conflito","pull request code review","Scrum guia 2020 resumo","Kanban WIP limite"],f:"<b>revert</b> é seguro em branch compartilhada; Daily = <b>15 min</b>; Kanban = <b>limitar WIP</b>."}
  ],
  POR: {a:"Semântica",t:"Semântica — sinônimos, antônimos, parônimos, hiperônimos, polissemia e ambiguidade",s:["Sinônimos e antônimos","Parônimos e homônimos","Hiperônimos e hipônimos","Polissemia","Ambiguidade"],k:["parônimos e homônimos lista","hiperônimo hipônimo","ambiguidade e polissemia"],f:"<b>Ratificar</b> = confirmar; <b>retificar</b> = corrigir; <b>iminente</b> = prestes a acontecer."},
  NOR: {a:"Trabalho e meio ambiente",t:"NR-01, Política Nacional do Meio Ambiente (Lei 6.938/1981), licenciamento e resíduos industriais",s:["NR-01 (GRO e PGR)","Política Nacional do Meio Ambiente (Lei 6.938/1981)","Licenciamento ambiental (LP, LI, LO)","Resíduos industriais"],k:["NR 01 GRO PGR","Lei 6.938/81 Política Nacional do Meio Ambiente","licença prévia instalação operação","Política Nacional de Resíduos Sólidos"],f:"LP → LI → LO. EPI é a <b>última</b> medida de controle."},
  ING: {a:"Revisão",t:"Inglês — revisão com questões FGV",s:[],k:["questões FGV inglês nível superior resolvidas"],f:"Resolva questões FGV de inglês e anote o vocabulário que travou."}
 },
 { // Semana 7 · 31/12 a 06/01
  ESP: [
   {a:"Inteligência Artificial",t:"IA I — IA generativa, LLMs e engenharia de prompt",s:["IA generativa","LLMs (Transformers, tokens, contexto)","Engenharia de prompt"],k:["o que é IA generativa","como funcionam LLMs transformers","engenharia de prompt few-shot zero-shot"],f:"<b>Alucinação</b>, <b>few-shot</b> × zero-shot e <b>temperatura</b> caem muito."},
   {a:"Inteligência Artificial",t:"IA II — uso responsável, privacidade e APIs de IA",s:["Uso responsável de IA","Privacidade e dados na IA","APIs de IA (integração)"],k:["uso responsável de inteligência artificial","LGPD e inteligência artificial","RAG retrieval augmented generation explicado"],f:"Chave de API fica <b>no servidor</b>; RAG não altera os pesos do modelo."},
   {a:"Revisão",t:"Revisão dos piores assuntos I",s:[],rev:true,k:["questões FGV desenvolvimento de sistemas"],f:"Abra <b>Desempenho</b>: comece pelos dias com <b>menor % de acerto</b>."},
   {a:"Revisão",t:"Revisão dos piores assuntos II",s:[],rev:true,k:["questões FGV analista de sistemas"],f:"Continue a revisão dos piores assuntos e refaça as questões que errou."}
  ],
  POR: {a:"Ortografia",t:"Ortografia, acentuação, formação de palavras e vocabulário",s:["Ortografia","Acentuação (novo acordo)","Formação de palavras","Vocabulário"],k:["acentuação gráfica novo acordo ortográfico","formação de palavras derivação composição","ortografia FGV questões"],f:"Caiu o acento de <b>ideia</b> e <b>voo</b>; <b>herói</b> mantém."},
  NOR: {a:"Qualidade",t:"Qualidade e gestão de processos + revisão de Normas",s:["Qualidade (PDCA, ISO 9001, ferramentas)","Gestão de processos"],k:["ciclo PDCA","ferramentas da qualidade Ishikawa Pareto 5W2H","gestão de processos BPM"],f:"<b>PDCA</b> = Plan, Do, Check, Act. Revise os prazos das leis de Normas."},
  ING: {a:"Revisão",t:"Inglês — revisão final",s:[],k:["inglês instrumental revisão concurso"],f:"Revise falsos cognatos e marcadores. Na 2ª metade, refaça os erros da semana."}
 }
];
const FINAL = [
 {m:"FIN",kind:"SIM",a:"Simulado",t:"Simulado 1 — prova antiga da FGV, cronometrado (4h) + revisão dos erros",s:[],k:["prova FGV analista de sistemas pdf","prova FGV desenvolvimento de sistemas"],f:"Faça uma prova completa da FGV em <b>4 horas</b>, sem consulta. Lance os acertos <b>por matéria</b> como simulado."},
 {m:"FIN",kind:"SIM",a:"Simulado",t:"Simulado 2 — outra prova da FGV, cronometrado (4h) + revisão dos erros",s:[],k:["prova FGV analista judiciário sistemas pdf"],f:"Compare com o simulado 1. Revise só o que errou."},
 {m:"FIN",kind:"VES",a:"Véspera",t:"Véspera — descanso leve e checklist do dia da prova",s:[],k:["cartão de confirmação FGV INB"],f:"Revisão leve dos erros. Separe <b>documento com foto</b>, caneta preta de corpo transparente e confira o local. Portões fecham <b>8h30</b>. Durma cedo."}
];
return { W, FINAL };
}

// Duração das fases do cronômetro "Dia" por tipo de dia
function phasesFor(d) {
  if (d.kind === "SIM") return [{ mode: "questoes", label: "Simulado", min: 240 }];
  if (d.kind === "VES") return [{ mode: "teoria", label: "Revisão leve", min: 30 }];
  if (d.m === "ING") return [{ mode: "teoria", label: "Inglês", min: 30 }, { mode: "questoes", label: "Revisão dos erros", min: 30 }];
  return [{ mode: "teoria", label: "Teoria (videoaula)", min: 40 }, { mode: "questoes", label: "Questões FGV", min: 20 }];
}

function buildAnalistaDiario() {
  const { W, FINAL } = dataAnalistaDiario();
  const start = new Date(...DIARIO_START), end = new Date(...END), simStart = new Date(...SIM_START);
  const days = []; let iF = 0;
  // dia da semana → matéria da rotina fixa
  const ROT = { 0: "ING", 1: "ESP", 2: "ESP", 3: "POR", 4: "ESP", 5: "NOR", 6: "ESP" };
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const w = d.getDay(), n = days.length, week = Math.floor(n / 7);
    let it;
    if (d >= simStart) it = { ...FINAL[iF++], week: W.length };
    else {
      const m = ROT[w], wk = W[week];
      const espIdx = days.filter(x => x.week === week && x.m === "ESP").length;
      const b = m === "ESP" ? wk.ESP[espIdx] : wk[m];
      it = { m, ...b, week };
      if (m === "ING") it = { ...it, t: it.t + " + revisão dos erros da semana" };
    }
    const key = keyOf(d);
    const sub = (it.s || []).map((n2, j) => ({ id: `${key}#${j}`, n: n2 }));
    const day = { ...it, sub, key, dow: w, index: n + 1, yt: true };
    day.phases = phasesFor(day);
    days.push(day);
  }
  return days;
}

const pad = n => String(n).padStart(2, "0");
const keyOf = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// Cronograma rotativo original (61 dias). Hoje só é seguido pelo Assistente;
// no Analista serve para mostrar a "fase anterior" (10/11 a 18/11).
function buildRotativo(edital) {
  const isAdm = edital === "assistente";
  const D = isAdm ? dataAssistente() : dataAnalista();
  const start = new Date(...START), end = new Date(...END), finalStart = new Date(...FINAL_START);
  const days = []; let ie = 0, ir = 0, ip = 0, iN = 0, iF = 0, weekItems = [], wkNo = 0;
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const w = d.getDay(); let it;
    if (d >= finalStart) it = { ...D.FINAL[iF++] };
    else if (isAdm && w === 4 && ir < 6) it = { ...D.RLM[ir++] };
    else if (w >= 1 && w <= 4) it = { m: "ESP", ...D.ESP[ie++] };
    else if (w === 5) it = { m: "POR", ...D.POR[ip++] };
    else if (w === 6) it = { ...(isAdm ? D.SAT : D.NOR)[iN++] };
    else {
      it = { m: "REV", a: "Revisão semanal", t: "Revisão da semana + questões FGV",
        k: weekItems.slice(0, 6).map(x => "questões FGV " + x.k[0]),
        f: "Releia os resumos e resolva <b>15–20 questões</b> dos temas da semana:<br>• " + weekItems.map(x => x.t).join("<br>• ") };
    }
    if (it.m !== "REV") weekItems.push(it);
    if (w === 0) weekItems = [];
    if (days.length && w === 1) wkNo++;
    const day = { ...it, key: keyOf(d), dow: w, index: days.length + 1, week: wkNo, sub: [] };
    day.phases = [{ mode: "teoria", label: "Teoria", min: 40 }, { mode: "questoes", label: "Questões FGV", min: 20 }];
    days.push(day);
  }
  return days;
}

function build(edital) {
  return edital === "analista" ? buildAnalistaDiario() : buildRotativo(edital);
}

// Dias da fase anterior do Analista (antes do cronograma diário), só para consulta
function legacy(edital) {
  if (edital !== "analista") return [];
  const first = keyOf(new Date(...DIARIO_START));
  return buildRotativo("analista").filter(d => d.key < first).map(d => ({ ...d, legacy: true }));
}

const EDITAIS = {
  analista: {
    id: "analista", nome: "Analista de Sistemas", nivel: "Nível superior",
    prova: "10/01/2027 · 9h às 13h", portoes: "8h30", examISO: "2027-01-10T09:00:00-03:00",
    pesos: [["Específicos", 60, "ESP"], ["Português", 20, "POR"], ["Normas", 13, "NOR"], ["Inglês", 7, "ING"]],
    minimo: "≥ 45 pts em Específicos · ≥ 75 pts no total · não zerar nenhuma matéria",
    pontos: { ESP: 90, POR: 30, NOR: 20, ING: 10 }, minEsp: 45, minTotal: 75, totalMax: 150,
    labels: { ESP: "Específicos", POR: "Português", NOR: "Normas", ING: "Inglês", REV: "Revisão", FIN: "Reta final" }
  },
  assistente: {
    id: "assistente", nome: "Assistente Administrativo", nivel: "Nível médio",
    prova: "10/01/2027 · 16h às 19h", portoes: "15h30", examISO: "2027-01-10T16:00:00-03:00",
    pesos: [["Específicos", 50, "ESP"], ["Português", 25, "POR"], ["Normas", 17, "NOR"], ["Raciocínio lógico", 8, "ING"]],
    minimo: "≥ 30 pts em Específicos · ≥ 60 pts no total · não zerar nenhuma matéria",
    pontos: { ESP: 60, POR: 30, NOR: 20, ING: 10 }, minEsp: 30, minTotal: 60, totalMax: 120,
    labels: { ESP: "Específicos", POR: "Português", NOR: "Normas", ING: "Raciocínio lógico", REV: "Revisão", FIN: "Reta final" }
  }
};

const api = { EDITAIS, build, legacy, keyOf };
if (typeof module !== "undefined" && module.exports) module.exports = api;
else root.Plans = api;
})(typeof window !== "undefined" ? window : globalThis);
