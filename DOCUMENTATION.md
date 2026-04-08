# Documentação do Projeto: Giroteca

## 1. Tema do Projeto
**Giroteca - Sistema de Gestão de Biblioteca Municipal de Mesquita**
O projeto foca na modernização tecnológica da gestão de acervo e atendimento ao público da biblioteca municipal de Mesquita, RJ.

## 2. Descrição
A Giroteca é uma aplicação full-stack desenvolvida para otimizar os processos de empréstimo, devolução e reserva de livros. O sistema integra funcionalidades modernas como geração de QR Codes para identificação rápida, um sistema de gamificação (badges) para incentivar a leitura, e dashboards analíticos para a gestão eficiente do acervo. A solução visa substituir controles manuais por uma plataforma digital integrada, segura e de fácil usabilidade.

## 3. Elicitação de Requisitos

### 3.1 Requisitos Funcionais (RF)
| ID | Requisito | Descrição |
|----|-----------|-----------|
| RF01 | Gestão de Acervo | Cadastro completo de livros com controle de volumes e múltiplos exemplares. |
| RF02 | Gestão de Cidadãos | Cadastro de leitores, incluindo tratamento para menores de idade e responsáveis. |
| RF03 | Controle de Empréstimos | Registro de saídas com cálculo automático de data de devolução prevista. |
| RF04 | Sistema de Reservas | Fila de espera para livros que não estão disponíveis no momento. |
| RF05 | Devolução e Feedback | Registro de retorno com sistema de avaliação (estrelas e comentários). |
| RF06 | Gamificação | Atribuição automática de medalhas baseada no histórico de leitura do cidadão. |
| RF07 | Identificação por QR Code | Geração e leitura de QR Codes para livros e carteiras de cidadãos. |
| RF08 | Dashboard Analítico | Visualização de métricas, alertas de atraso e tendências de leitura. |

### 3.2 Requisitos Não Funcionais (RNF)
| ID | Requisito | Descrição |
|----|-----------|-----------|
| RNF01 | Usabilidade | Interface responsiva e intuitiva seguindo princípios de design moderno. |
| RNF02 | Segurança | Autenticação de funcionários e controle de acesso baseado em funções (RBAC). |
| RNF03 | Integridade | Garantia de que livros reservados não sejam emprestados para terceiros. |
| RNF04 | Performance | Resposta rápida em buscas no acervo e processamento de transações. |

## 4. Detalhamento dos Casos de Uso e Funções

### UC01: Realizar Empréstimo
- **Ator Principal**: Funcionário (Bibliotecário)
- **Pré-condição**: Livro disponível e Cidadão cadastrado e não bloqueado.
- **Funções Relacionadas**:
    - `handleSaveLoan`: Função principal que valida os dados do formulário, verifica a disponibilidade do exemplar, checa se o cidadão possui bloqueios e se há reservas prioritárias para aquele livro. Se tudo estiver correto, cria um novo registro em `loans` e atualiza o status do livro para 'emprestado'.
    - `handleConvertReservationToLoan`: Permite iniciar o processo de empréstimo diretamente a partir de uma reserva pendente, pré-preenchendo os dados do livro e do cidadão para agilizar o atendimento.
    - `setSelectedLoanTitle`: Gerencia a seleção dinâmica do título no modal, filtrando os exemplares disponíveis para exibição.

### UC02: Gerenciar Reserva
- **Ator Principal**: Funcionário / Cidadão
- **Pré-condição**: Livro com status "Emprestado".
- **Funções Relacionadas**:
    - `handleReserveBook`: Prepara o estado do sistema para realizar uma reserva, identificando o livro alvo.
    - `confirmReservation`: Efetiva a reserva no sistema, criando um registro em `reservations` com status 'pendente'.
    - `handleCancelReservation`: Permite o cancelamento de uma reserva ativa, alterando seu status para 'cancelado'.
    - `reservations.find`: Lógica utilizada em diversos pontos para verificar a prioridade de empréstimo, garantindo que o livro reservado seja entregue ao cidadão correto.

### UC03: Devolução e Avaliação
- **Ator Principal**: Funcionário / Cidadão
- **Funções Relacionadas**:
    - `handleReturnBook`: Registra a data de devolução real no empréstimo e altera o status do livro de volta para 'disponivel'.
    - `handleSaveReview`: Permite que o cidadão avalie a obra (estrelas e comentário) após a devolução, enriquecendo a base de dados para recomendações futuras.
    - `isOverdue`: Função auxiliar que compara a data prevista com a data atual para identificar atrasos.
    - `toggleBlockCitizen`: Função que permite ao administrador bloquear ou desbloquear um cidadão manualmente ou baseada em critérios de atraso.
    - `calculateCitizenBadges`: Lógica que analisa o histórico de empréstimos concluídos para atribuir medalhas (badges) ao cidadão, incentivando a leitura.
