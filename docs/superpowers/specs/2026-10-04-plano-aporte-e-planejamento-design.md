# Plano de Aporte e ferramentas de planejamento

## Objetivo

Substituir a IA da sugestão de aporte por um cálculo determinístico, transparente e confiável. Completar a área Planejar com uma Calculadora de Futuro e uma ferramenta de Reserva de Emergência, mantendo as telas simples e coerentes com o sistema visual Orbit.

## Plano de Aporte Vesti

- Remover da tela de aporte a chamada à IA, seus estados, mensagens e referências visuais.
- Usar apenas o motor local já baseado no perfil, foco de investimento, metas percentuais e composição atual da carteira.
- O botão principal passa a se chamar **Montar meu plano**.
- O resultado passa a se chamar **Plano de Aporte Vesti** e deve explicar:
  - quanto direcionar para cada classe;
  - quais posições ou ativos são compatíveis com o perfil e foco;
  - qual desvio da carteira motivou cada parcela;
  - quais dados foram usados no cálculo.
- Cotações podem enriquecer o cálculo, mas indisponibilidade de rede não pode impedir a geração do plano.
- Exibir após o resultado: **“Este plano tem caráter educativo e não constitui recomendação de compra. Confira riscos, custos e adequação ao seu perfil antes de investir.”**
- O registro de compra continua usando o fluxo idempotente já existente.

## Calculadora de Futuro

- Reaproveitar e modernizar a calculadora existente, tornando-a acessível diretamente em Planejar.
- Oferecer dois modos:
  1. calcular o aporte mensal necessário para alcançar uma meta;
  2. projetar o patrimônio futuro a partir do valor inicial e dos aportes mensais.
- Entradas: valor inicial, aporte mensal ou meta, prazo em anos e taxa anual estimada.
- Resultado: valor final, total investido e juros acumulados.
- Mostrar três cenários calculados a partir da taxa informada: conservador, base e otimista.
- Adicionar uma visualização simples da proporção entre capital investido e rendimentos.
- Remover exemplos de rentabilidade apresentados como referência fixa de produtos.
- Exibir aviso de que a simulação é educativa e não garante rentabilidade futura.

## Reserva de Emergência

- Criar uma tela acessível em Planejar.
- Entradas: despesas essenciais mensais, quantidade de meses de proteção e valor já reservado.
- Oferecer atalhos de 3, 6, 9 e 12 meses, com 6 meses como valor inicial.
- Resultado: reserva-alvo, valor já coberto, quanto falta e percentual de progresso.
- Exibir uma estimativa de prazo quando o usuário informar quanto consegue guardar por mês.
- A ferramenta é apenas de planejamento; não sugere produtos financeiros específicos.

## Organização de Planejar

- Manter as decisões principais em “Agora”: Plano de Aporte, Metas e Renda Futura.
- Adicionar uma seção “Simulações” com Calculadora de Futuro e Reserva de Emergência.
- Manter imposto de renda, declaração, relatórios e backtest em “Ferramentas”.
- Remover o convite de conversa com IA desta tela e substituí-lo por uma orientação objetiva sobre revisão do plano.

## Arquitetura e dados

- Extrair os cálculos financeiros puros para utilitários sem dependência de React Native.
- Nenhuma das novas ferramentas grava dados financeiros no Supabase nesta entrega.
- As telas calculam localmente e não dependem de IA ou APIs externas.
- A navegação deve continuar usando o stack existente e oferecer retorno confiável para Planejar.

## Erros e limites

- Valores negativos, prazo zero e taxa anual menor ou igual a -100% são inválidos.
- Taxa zero deve ser calculada sem divisão por zero.
- Resultados não finitos não devem ser renderizados.
- Campos incompletos mostram orientação curta, sem travar a tela.

## Verificação

- Testes unitários para juros compostos, aporte necessário, cenários e reserva de emergência.
- Testes de regressão garantindo que a tela de aporte não chama nem menciona IA.
- Testes de navegação garantindo que as duas ferramentas aparecem em Planejar.
- TypeScript, suíte completa, exportação web e inspeção visual antes da publicação.

