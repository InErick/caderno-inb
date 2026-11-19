// =====================================================================
// Tema de cada dia do cronograma (Específicos, Português, Normas e Inglês/RLM) → nomes de matéria/assunto na Quest API.
// Cada dia é uma lista de nomes, ou { f: [nomes], alvo: N } para mudar a meta de questões do dia.
// O importador busca cada nome como "materia" e como "assunto" (a API usa
// os dois campos de forma misturada), primeiro na FGV e depois em outras
// bancas, até completar as questões do dia. Nomes = valor exato da API
// (descobertos em GET /v2/filtros/materias).
// =====================================================================
const LGPD = "Lei nº 13.709/2018 - Lei Geral de Proteção de Dados Pessoais (LGPD)";
const L14133 = "Lei nº 14.133/2021 - Lei de Licitações e Contratos Administrativos.";

const L12846 = "Lei nº 12.846/2013 - Dispõe sobre a responsabilização administrativa e civil de pessoas jurídicas pela prática de atos contra a administração pública, nacional ou estrangeira";
const D11129 = "Decreto 11.129/2022 - Regulamenta a Lei nº 12.846, de 1º de agosto de 2013, que dispõe sobre a responsabilização administrativa e civil de pessoas jurídicas pela prática de atos contra a administração pública, nacional ou estrangeira.";
const IMPROB = ["Improbidade Administrativa", "Lei nº 8.429/92 - Lei de Improbidade Administrativa", "Improbidade Administrativa - Lei 8.429/92 e suas alterações"];
const LAI = ["Lei nº 12.527/2011 - Lei de Acesso à Informação", "Lei nº 12.527 - Lei de Acesso à Informação", "Acesso à Informação"];
const NUCLEAR = ["Comissão Nacional de Energia Nuclear - CNEN", "Normas da Comissão Nacional de Energia Nuclear (CNEN) para proteção radiológica", "Proteção Radiológica"];
const AMBIENTE = ["NR 01 - Disposições Gerais", "Política Nacional do Meio Ambiente - PNMA - Lei nº 6.938/1981", "Licenciamento Ambiental", "Política Nacional de Resíduos Sólidos - Lei nº 12.305 de 2010", "Resíduos Sólidos"];
const PROC_ADM = ["Processo Administrativo - Lei 9.784/99", "Lei 9.784/99"];
const P_LEITURA = ["Interpretação de Texto", "Coesão e Coerência", "Coesão", "Coerência", "Intertextualidade"];
const P_TIPOS = ["Tipologias Textuais", "Tipologias e Gêneros Textuais", "Gêneros textuais", "Funções da Linguagem"];
const P_SEMANT = ["Semântica", "Semântica (significação das palavras)", "Sinônimos", "Parônimos", "Polissemia", "Relações de sinonímia e antonímia (sinônimos e antônimos)"];
const P_ORTO = ["Ortografia", "Acentuação gráfica", "Ortografia oficial e acentuação gráfica", "Formação de palavras (prefixos e sufixos)", "Acentuação"];
const P_NORMA = ["Norma culta ou norma padrão", "Concordância verbal", "Regência verbal", "Crase", "Reescrita de frases e parágrafos do texto"];
const I_TEXTO = ["Língua Inglesa - Compreensão e Interpretação de Texto", "Língua Inglesa"];

// Português: mesmo conteúdo e mesmos dias nos dois editais (10 aulas: quartas + 3 domingos)
const POR = {
  "2026-11-25": [...P_LEITURA, "Pressupostos e subentendidos"],
  "2026-11-29": ["Tipologias Textuais", "Tipologias e Gêneros Textuais", "Gêneros textuais"],
  "2026-12-02": ["Funções da Linguagem", "Tipologias e Gêneros Textuais", "Gêneros textuais"],
  "2026-12-09": P_NORMA,
  "2026-12-13": ["Pontuação", "Emprego dos sinais de pontuação"],
  "2026-12-16": ["Sintaxe", "Período composto", "Ordem dos termos da oração", "Discurso direto e indireto", "Orações subordinadas adjetivas"],
  "2026-12-23": ["Classes de palavras (classes gramaticais)", "Substantivos", "Adjetivos", "Pronomes", "Pronomes relativos"],
  "2026-12-27": P_SEMANT,
  "2026-12-30": ["Verbos", "Advérbios", "Conjunções"],
  "2027-01-06": P_ORTO,
};

module.exports = {
  analista: {
    "2026-11-19": ["C#", "Linguagens de Programação"],
    "2026-11-21": ["Orientação a Objetos", "C#"],
    "2026-11-23": ["Orientação a Objetos", "C#"],
    "2026-11-24": ["Orientação a Objetos", "Padrões de projeto", "Engenharia de Software"],
    "2026-11-26": ["C#", "Estrutura de Dados", "Algoritmos e estrutura de dados"],
    "2026-11-28": ["C#", "Linguagens de Programação"],
    "2026-11-30": ["C#", "Linguagens de Programação"],
    "2026-12-01": ["ASP .NET", "C#", "Padrões de projeto"],
    "2026-12-03": ["Modelo entidade-relacionamento", "Modelo relacional", "Banco de Dados"],
    "2026-12-05": ["Normalização", "DML", "Linguagem SQL ANSI"],
    "2026-12-07": ["Linguagem SQL ANSI", "VIEWs", "Banco de Dados"],
    "2026-12-08": ["Triggers", "PL/SQL", "Transact SQL (T-SQL)", "Banco de Dados"],
    "2026-12-10": ["ASP .NET", "MVC (Model-View-Controller)"],
    "2026-12-12": ["ASP .NET", "Autenticação", "Segurança da Informação"],
    "2026-12-14": ["REST", "HTTP (HYPER TEXT TRANSFER PROTOCOL)", "JSON"],
    "2026-12-15": ["Mapeamento Objeto-Relacional", "ASP .NET", "Banco de Dados"],
    "2026-12-17": ["Processos (Metodologias) de Desenvolvimento e Modelos de Ciclo de Vida", "Engenharia de Software"],
    "2026-12-19": ["Engenharia de Requisitos (Gerências de Requisitos de Softwares)", "Requisitos Funcionais", "Engenharia de Software"],
    "2026-12-21": ["UML", "UML - Unified Modeling Language"],
    "2026-12-22": ["Arquitetura de Software", "Arquitetura em Camadas", "Arquitetura de Microsserviços", "SOA - Arquitetura Orientada a Serviço"],
    "2026-12-24": ["JAVASCRIPT", "HTML", "CSS", "Desenvolvimento Web"],
    "2026-12-26": ["Desenvolvimento Web", "JAVASCRIPT"],
    "2026-12-28": ["Desenvolvimento Web", "JAVASCRIPT"],
    "2026-12-29": ["GIT", "Versionamento de Código-Fonte (Controle de Versão)"],
    "2026-12-31": ["Scrum", "Kanban", "Metodologias de Desenvolvimento Ágeis"],
    "2027-01-02": { f: ["Inteligência Artificial", "Aprendizado de Máquina"], alvo: 100 },
    // Normas
    "2026-11-20": ["Princípios da Administração Pública", ...PROC_ADM],
    "2026-11-27": [L12846, D11129, ...IMPROB],
    "2026-12-04": [...LAI, "Conflito de Interesses (Lei n° 12.813)", "Governança Corporativa"],
    "2026-12-11": [LGPD, "Segurança da Informação"],
    "2026-12-18": NUCLEAR,
    "2026-12-25": AMBIENTE,
    "2027-01-01": ["Gestão da Qualidade", "Gestão de Processos", "Gestão por processos", "Ferramentas da Qualidade"],
    // Português (10 aulas) e Inglês (4 domingos)
    ...POR,
    "2026-11-22": I_TEXTO,
    "2026-12-06": ["Cognatos", "Falsos cognatos", "Vocabulário", "Word formation (prefix and suffix)", "Gramática - Língua Inglesa"],
    "2026-12-20": I_TEXTO,
    "2027-01-03": I_TEXTO,
  },
  assistente: {
    "2026-11-19": ["Administração Geral"],
    "2026-11-21": ["Planejamento", "Planejamento Tático", "Administração Geral"],
    "2026-11-23": ["Estrutura Organizacional", "Organograma"],
    "2026-11-24": ["Departamentalização", "Centralização e descentralização", "Estrutura Organizacional"],
    "2026-11-26": ["Gestão da Qualidade", "Qualidade Total"],
    "2026-11-28": ["Ferramentas da Qualidade", "Ferramentas de Gestão da Qualidade", "Gestão da Qualidade"],
    "2026-11-30": ["Gestão de Pessoas"],
    "2026-12-01": ["Remuneração", "Remuneração e Salário", "Gestão de Pessoas"],
    "2026-12-03": ["Atendimento ao Público", "Comunicação Empresarial"],
    "2026-12-05": ["Qualidade no Atendimento ao Público", "Qualidade no atendimento", "Atendimento ao Público"],
    "2026-12-07": ["Microsoft Excel", "Administração Geral"],
    "2026-12-08": ["Redação Oficial", "Manual de Redação da Presidência da República (3ª Edição, 2018)"],
    "2026-12-10": ["Correspondência Oficial", "Redação Oficial"],
    "2026-12-12": ["Gestão de documentos e o ciclo vital dos documentos", "Gestão de Documentos", "Arquivologia"],
    "2026-12-14": ["Métodos de Arquivamento (Ordenação de Documentos)", "Avaliação e Tabela de temporalidade de documentos", "Arquivologia"],
    "2026-12-15": ["Administração de Compras", "Planejamento de Compras e de Estoque", "Almoxarifado e Estoque"],
    "2026-12-17": ["Controle de Estoques", "Almoxarifado e Estoque", "Patrimônio Público"],
    "2026-12-19": ["Orçamento Público", "Receita Pública", "Despesa Pública"],
    "2026-12-21": ["Fluxo de Caixa", "Matemática Financeira"],
    "2026-12-22": ["Fiscalização de contratos", L14133],
    "2026-12-24": ["Windows", "Navegadores (Browsers)", "Correio Eletrônico"],
    "2026-12-26": ["Microsoft Word"],
    "2026-12-28": ["Microsoft Excel"],
    "2026-12-29": ["Microsoft PowerPoint", "Segurança da Informação"],
    "2026-12-31": ["Ética no Setor Público", "Ética", "Ética Organizacional"],
    // Normas
    "2026-11-20": ["Princípios da Administração Pública", "Agentes Públicos", "Responsabilidade do Estado"],
    "2026-11-27": PROC_ADM,
    "2026-12-04": [LGPD, "Segurança da Informação"],
    "2026-12-11": [L12846, D11129, "Conflito de Interesses (Lei n° 12.813)", "Governança Corporativa"],
    "2026-12-18": [...IMPROB, ...LAI],
    "2026-12-25": NUCLEAR,
    "2027-01-01": [...AMBIENTE, "Gestão da Qualidade"],
    // Português (10 aulas) e Raciocínio lógico-matemático (4 domingos)
    ...POR,
    "2026-11-22": ["Proposições", "Conectivos Lógicos ( construção de proposições compostas)", "Tabela-verdade da conjunção", "Lógica Proposicional - (Lógica de Primeira Ordem)", "Equivalências Lógicas - (Proposições Logicamente equivalentes)", "Negação de Proposições compostas", "Quantificadores Lógicos - Lógica dos predicados ( Lógica de Primeira Ordem)", "Lógica de Argumentação"],
    "2026-12-06": ["Conjuntos", "Conjuntos Numéricos", "Porcentagem", "Matemática Básica ( questões envolvendo as quatro operações básicas)", "Razão e Proporção", "Regra de Três", "Juros Simples", "Juros Compostos"],
    "2026-12-20": ["Análise Combinatória", "Probabilidade", "Estatística Básica", "Estatística"],
    "2027-01-03": ["Geometria Plana", "Geometria", "Plano Cartesiano", "Sequências", "Raciocínio Sequencial", "Raciocínio Lógico"],
  },
};
