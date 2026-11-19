// =====================================================================
// Tema de cada dia de Específicos → nomes de matéria/assunto na Quest API.
// O importador busca cada nome como "materia" e como "assunto" (a API usa
// os dois campos de forma misturada), primeiro na FGV e depois em outras
// bancas, até completar as questões do dia. Nomes = valor exato da API
// (descobertos em GET /v2/filtros/materias).
// =====================================================================
const LGPD = "Lei nº 13.709/2018 - Lei Geral de Proteção de Dados Pessoais (LGPD)";
const L14133 = "Lei nº 14.133/2021 - Lei de Licitações e Contratos Administrativos.";

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
    "2026-12-29": ["GIT", "Versionamento de Código-Fonte (Controle de Versão)", "Scrum", "Kanban", "Metodologias de Desenvolvimento Ágeis"],
    "2026-12-31": ["Inteligência Artificial", "Aprendizado de Máquina"],
    "2027-01-02": ["Inteligência Artificial", LGPD],
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
  },
};
