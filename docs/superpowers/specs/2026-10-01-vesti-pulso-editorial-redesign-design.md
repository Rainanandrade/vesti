# Vesti Pulso Editorial — Redesign Completo

**Data:** 1 de outubro de 2026  
**Status:** Direção visual aprovada; especificação aguardando revisão final  
**Base:** Expo SDK 54, React Native e React Navigation existentes

## Objetivo

Substituir integralmente a aparência atual do Vesti pela direção aprovada **Pulso editorial**. O resultado não pode parecer uma troca de paleta aplicada sobre a interface antiga. A mudança cobre composição, hierarquia, navegação, tipografia, componentes, ritmo, gráficos, estados e todas as 37 telas existentes.

O nome Vesti, os dados do usuário, as regras financeiras, os contratos do Supabase, autenticação, PIN, permissões, assinatura Pro e APIs permanecem intactos.

## Critério central

Cada área responde imediatamente a uma pergunta:

- **Hoje:** “Como estou e o que mudou?”
- **Investir:** “Como minha carteira está distribuída e onde há risco?”
- **Planejar:** “Qual é o próximo passo para alcançar meus planos?”
- **Aprender:** “O que preciso entender para decidir melhor?”

Nenhuma tela pode voltar ao padrão antigo de cabeçalho genérico seguido por uma grade de cartões equivalentes.

## Identidade Pulso editorial

### Composição

- Fundo marfim quente contínuo.
- Títulos editoriais grandes em serif, com frases humanas e específicas.
- Texto funcional em sans-serif legível.
- Divisores finos e espaço em branco substituem a maior parte dos cartões.
- Índigo marca interação e gráficos; coral marca progresso, atenção e personalidade.
- Verde aparece apenas para ganho ou sucesso real.
- Superfícies preenchidas são reservadas para uma ação ou informação dominante.
- Ícones finos e consistentes; emojis deixam de ser iconografia de produto.
- Navegação inferior escura, compacta e flutuante no mobile.
- Rail lateral editorial e compacto no desktop, sem esticar o layout móvel.

### Tipografia

- Display editorial: títulos de página, valores dominantes e chamadas narrativas.
- Sans funcional: controles, rótulos, listas, formulários e explicações.
- Valores financeiros usam números tabulares quando alinhados em listas.
- Títulos descrevem o estado real do usuário, evitando nomes burocráticos como título dominante.

### Movimento

- Transições curtas de seção e seleção.
- Gráficos e progresso respondem a mudanças sem animação decorativa contínua.
- Haptics apenas em ações significativas.
- Movimento reduzido é respeitado.

## Quatro áreas principais

### Hoje

1. Wordmark, data e avatar.
2. Manchete financeira gerada por regras determinísticas a partir dos dados existentes.
3. Patrimônio, variação e privacidade numa faixa editorial.
4. Explicação curta do movimento do período.
5. Gráfico livre, sem cartão externo.
6. Linha do tempo mensal com aportes, proventos e marcos.
7. Até três próximos passos, ordenados por relevância e com motivo explícito.
8. Entrada contextual para o Vesti, sem botão flutuante global.

### Investir

1. Título “Seu portfólio, sem ruído”.
2. Alternância Carteira, Proventos e Operações em abas sublinhadas.
3. Valor atual, rentabilidade e gráfico como uma composição contínua.
4. Faixa proporcional de alocação por classe.
5. Um diagnóstico contextual prioritário, como concentração excessiva.
6. Posições em linhas editoriais com quantidade, preço médio, valor e desempenho.
7. Busca, adicionar ativo, comparação e watchlist como ações contextuais.
8. Carteiras compartilhadas mostram leitura somente antes de qualquer tentativa de edição.

### Planejar

1. Título “O futuro ficou mais concreto”.
2. Meta principal com valor, prazo e progresso.
3. Aporte sugerido como única superfície escura dominante e principal ação.
4. Horizontes organizados cronologicamente, não em grade de cartões.
5. Renda passiva e projeções integradas aos horizontes.
6. Ferramentas — IR, declaração, relatórios e simulação — num grupo secundário claro.
7. Cenários explicam premissas e nunca prometem retorno.

### Aprender

1. Título “Aprenda o que muda suas decisões”.
2. Próxima aula recomendada usando o perfil e o estado da carteira.
3. Motivo visível para a recomendação.
4. Trilhas ativas em linhas de progresso.
5. Notícias e conceitos essenciais como leituras editoriais, não cards concorrentes.
6. Glossário pesquisável no mesmo fluxo.
7. Rankings aparecem como conteúdo de apoio, não como recomendação personalizada.

## Fluxos de suporte

Todos os fluxos usam a mesma identidade, sem exceção:

- Onboarding, autenticação, recuperação de senha, PIN, questionário e preferência.
- Adicionar e editar ativo, detalhes, lista, comparação e watchlist.
- Operações, proventos, aporte e calculadoras.
- Metas, renda passiva, IR, declaração, relatórios e backtest.
- Assistente, consultor, alertas e notícias.
- Perfil, ajustes, documentos legais, compartilhamento e assinatura Pro.

Formulários usam rótulos persistentes, validação inline, ação principal clara e preservação de dados em falhas. Modais deixam de parecer páginas antigas sobrepostas e passam a usar folhas ou páginas editoriais coerentes com a plataforma.

## Sistema de componentes

O redesign terá uma única fonte de verdade. A camada de compatibilidade atual não será considerada migração concluída.

Componentes obrigatórios:

- `EditorialScreen`: largura, safe area, scroll, desktop e espaçamento.
- `EditorialHeader`: wordmark, data/contexto e ações.
- `EditorialTitle`: kicker, manchete e apoio.
- `MetricBand`: valor financeiro, privacidade e variação sem cartão.
- `UnderlineTabs`: alternância local.
- `EditorialRow`: listas financeiras, metas, aulas e configurações.
- `InsightNote`: explicação contextual e entrada do Vesti.
- `ProgressLine` e `AllocationBand`.
- `PrimaryAction`, `QuietAction` e `IconAction`.
- `FormField`, `InlineFeedback` e `ConfirmationSheet`.
- Estados `Loading`, `Empty`, `Error`, `Locked`, `Offline` e `ReadOnly`.
- Navegação mobile escura e rail desktop equivalente.

Telas compõem esses elementos; não recriam identidade com estilos locais.

## Preservação funcional

- Nenhum cálculo financeiro será reescrito como parte visual.
- Dados continuam vindo do `AppContext`, Supabase e APIs atuais.
- Todas as rotas existentes permanecem alcançáveis.
- Navegação recebe testes de destino para impedir links quebrados entre stacks.
- Mutações mantêm confirmação, carregamento, falha e recuperação.
- Regras Pro continuam verificadas no servidor.
- PIN, lockout, recuperação e exclusão de conta preservam o hardening existente.

## Estratégia de implementação

1. Consolidar tokens e componentes editoriais reais.
2. Reconstruir o shell e as quatro áreas aprovadas.
3. Migrar os fluxos de entrada e conta.
4. Migrar investimento, planejamento e educação auxiliares.
5. Remover componentes e estilos antigos ainda alcançáveis.
6. Auditar visualmente todas as rotas em mobile e desktop.
7. Só publicar quando a matriz funcional e visual estiver completa.

Não haverá nova publicação intermediária no domínio principal enquanto telas acessíveis misturarem os dois sistemas.

## Estados e responsividade

- Cada tela com dados implementa carregando, vazio, erro e conteúdo.
- Falha de mutação mantém o estado anterior e permite tentar novamente.
- Mobile é a referência; tablet e desktop reorganizam conteúdo, não apenas aumentam largura.
- Conteúdo editorial fica limitado em largura no desktop.
- Teclado, safe areas, texto ampliado e valores longos não escondem ações.

## Verificação

### Automatizada

- Regressões existentes de imposto, segurança, autenticação, assinatura e relatórios.
- Rotas e ações principais das 37 telas.
- Estados de carregamento, vazio, erro, Pro e somente leitura.
- Uso dos componentes editoriais e ausência de estilos legados alcançáveis.
- Labels acessíveis, foco web, privacidade e movimento reduzido.
- Layouts de referência em larguras mobile, tablet e desktop.

### Manual

- Percorrer onboarding até a tela Hoje.
- Testar login, PIN correto, PIN incorreto e recuperação.
- Abrir e executar a ação principal de cada destino.
- Criar, editar e remover dados apenas em ambiente de teste.
- Confirmar carteira compartilhada, assinatura Pro e falhas de rede.
- Revisar visualmente todas as rotas registradas no navegador e em viewport mobile.

## Condições de aceite

1. As quatro áreas correspondem às propostas Pulso editorial aprovadas.
2. Todas as telas alcançáveis pertencem claramente ao mesmo produto novo.
3. Nenhuma tela mantém a composição antiga com cores apenas substituídas.
4. Todas as funções existentes continuam alcançáveis e operantes.
5. A suíte completa, typecheck, export web e verificações Expo passam.
6. O domínio público só é atualizado após validação visual e funcional da matriz de rotas.

## Fora de escopo

- Alterar regras financeiras, tributárias ou de autorização.
- Trocar Supabase, provedor de pagamento ou APIs de mercado.
- Criar integrações bancárias novas.
- Tema escuro nesta entrega.
- Execução de ordens ou movimentação de dinheiro.
