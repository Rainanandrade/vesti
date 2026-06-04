// Política de Privacidade e Termos de Uso — Vesti
// Conformidade LGPD (Lei 13.709/2018)

export const APP_NAME = 'Vesti';
export const SUPPORT_EMAIL = 'vesti.suporte@gmail.com'; // TROCAR pelo email real
export const LEGAL_DATE = '03 de junho de 2026';

export const PRIVACY_POLICY = `
# Política de Privacidade

**Última atualização:** ${LEGAL_DATE}

Esta Política de Privacidade descreve como o Vesti coleta, usa e protege suas informações pessoais. Ao usar o aplicativo, você concorda com as práticas descritas aqui.

## 1. Quem somos

Vesti é um aplicativo de acompanhamento de carteira de investimentos. Não somos uma corretora, banco ou instituição financeira regulada. Não executamos ordens nem movimentamos dinheiro.

## 2. Dados que coletamos

Coletamos as seguintes informações que você nos fornece diretamente:

- **Identificação**: nome e endereço de email.
- **Autenticação**: senha (armazenada de forma criptografada — nunca em texto puro).
- **Perfil financeiro**: respostas do questionário (perfil de risco, tolerância, objetivos).
- **Carteira**: ativos adicionados manualmente, quantidades, preços médios.
- **Corretoras selecionadas**: lista das corretoras que você indica usar.
- **Conquistas**: progresso de metas e aulas concluídas.

**Não coletamos**: CPF, RG, endereço residencial, dados bancários, números de cartão.

## 3. Como armazenamos seus dados

Seus dados são armazenados em servidores do **Supabase** (localizados em São Paulo, Brasil) com criptografia em trânsito (HTTPS) e em repouso (AES-256). Cada usuário só consegue acessar os próprios dados (Row Level Security).

O **PIN** e a **senha** ficam adicionalmente criptografados no seu próprio dispositivo via SecureStore (iOS Keychain / Android Keystore).

## 4. Como usamos seus dados

Usamos suas informações apenas para:

- Permitir o login e a sincronização entre dispositivos.
- Calcular sua rentabilidade, dividendos esperados e saúde da carteira.
- Gerar sugestões de aporte personalizadas (com base no seu perfil + ativos).
- Enviar emails de confirmação, recuperação de senha e notificações que você ativar.

## 5. Compartilhamento com terceiros

Compartilhamos dados mínimos com os seguintes provedores estritamente para o funcionamento do app:

- **Supabase**: armazenamento, autenticação e emails transacionais.
- **brapi.dev**: cotações da B3 (consultamos cotações públicas, não enviamos dados pessoais seus).
- **Status Invest**: histórico de dividendos públicos (também sem dados pessoais).
- **Groq (Llama 3.3)**: quando você usa "Análise inteligente com IA", enviamos seu perfil + carteira (sem nome ou email) para gerar a sugestão.
- **Vercel**: hospedagem da aplicação web.

Nunca vendemos seus dados a terceiros.

## 6. Seus direitos (LGPD)

Você tem direito a:

- **Acesso**: solicitar uma cópia dos seus dados.
- **Correção**: corrigir dados imprecisos.
- **Exclusão**: pedir a exclusão da conta e de todos os dados.
- **Portabilidade**: receber seus dados em formato estruturado.
- **Revogação de consentimento**: a qualquer momento.

Para exercer qualquer direito, envie um email para **${SUPPORT_EMAIL}** com o assunto "LGPD - [seu direito]". Respondemos em até 15 dias úteis.

## 7. Exclusão da conta

Você pode excluir sua conta a qualquer momento dentro do app em **Ajustes → Excluir conta**. Ao confirmar, todos os seus dados são apagados em até 30 dias dos nossos servidores e backups.

## 8. Cookies e analytics

Não usamos cookies de rastreamento de terceiros. Eventualmente podemos usar ferramentas de analytics próprias para entender uso agregado (anônimo) do app.

## 9. Crianças

O Vesti não é destinado a menores de 16 anos. Se você é responsável por um menor que está usando o app, entre em contato pra exclusão imediata.

## 10. Mudanças nesta política

Podemos atualizar esta política. Mudanças relevantes são notificadas por email e dentro do app. A data no topo indica a última versão.

## 11. Contato

Dúvidas? **${SUPPORT_EMAIL}**

---

Esta política está em conformidade com a Lei Geral de Proteção de Dados Pessoais (LGPD - Lei nº 13.709/2018).
`.trim();

export const TERMS_OF_USE = `
# Termos de Uso

**Última atualização:** ${LEGAL_DATE}

Ao criar uma conta e usar o Vesti, você concorda com estes Termos. Leia com atenção.

## 1. O que é o Vesti

O Vesti é um aplicativo educacional de **acompanhamento** de carteira de investimentos. Ele:

✅ Mostra cotações em tempo real
✅ Calcula rentabilidade, dividendos esperados e diversificação
✅ Sugere distribuição de aportes com base no seu perfil
✅ Ensina conceitos de investimentos através de aulas e quizzes

O Vesti **NÃO**:

❌ Executa ordens de compra ou venda
❌ Movimenta dinheiro
❌ É uma corretora, banco ou instituição financeira
❌ Substitui o aconselhamento de um profissional certificado (CFP, AAI, CGA)

## 2. Não somos consultor de investimentos

As sugestões, análises e recomendações geradas pelo Vesti (incluindo a IA) são **estritamente educativas** e baseadas em padrões matemáticos e dados públicos. **Não constituem recomendação personalizada de investimento** conforme regulação da CVM (Resolução 19/2021).

Toda decisão de investimento é **sua responsabilidade**. Antes de comprar ou vender qualquer ativo:

- Consulte um profissional credenciado se tiver dúvidas
- Leia o regulamento, prospecto ou material informativo do produto
- Avalie se o investimento é compatível com seus objetivos

## 3. Isenção de responsabilidade

O Vesti utiliza dados de terceiros (Yahoo Finance, brapi.dev, Status Invest) que podem estar incorretos, atrasados ou indisponíveis. Não somos responsáveis por:

- Perdas financeiras decorrentes de decisões tomadas com base nas informações do app
- Interrupções ou erros técnicos
- Indisponibilidade de cotações ou histórico de dividendos
- Diferenças entre as estimativas mostradas e os valores reais recebidos

## 4. Cadastro e segurança

- Você é responsável por manter sua senha e PIN em sigilo
- Notifique-nos imediatamente se suspeitar de acesso não autorizado em **${SUPPORT_EMAIL}**
- Você deve ter pelo menos 16 anos
- Não use o app pra fins ilegais ou prejudiciais

## 5. Uso aceitável

Você concorda em **não**:

- Tentar burlar limites técnicos, fazer engenharia reversa ou copiar o app
- Criar contas em massa, usar bots ou scraping
- Compartilhar sua conta com outras pessoas
- Usar a IA pra fins não relacionados a investimentos pessoais

Violar essas regras pode resultar em suspensão ou exclusão da conta.

## 6. Conteúdo gerado por IA

As sugestões geradas pela IA são produzidas por modelos de linguagem (Llama 3.3 via Groq) e podem conter **erros, dados desatualizados ou recomendações inadequadas**. Sempre confira informações importantes em fontes primárias (sites das empresas, B3, CVM).

## 7. Propriedade intelectual

O nome Vesti, logos, design e código-fonte são protegidos por direitos autorais. Você não pode copiar, distribuir ou modificar sem autorização escrita.

## 8. Encerramento

Podemos suspender ou encerrar sua conta a qualquer momento se você violar estes Termos. Você pode encerrar sua conta quando quiser em **Ajustes → Excluir conta**.

## 9. Modificações dos termos

Podemos alterar estes Termos. Mudanças significativas são notificadas com no mínimo 15 dias de antecedência. Continuar usando o app após as mudanças significa concordância.

## 10. Lei aplicável e foro

Estes Termos são regidos pelas leis brasileiras. Eventuais disputas serão resolvidas no foro da Comarca de [SUA CIDADE], com renúncia a qualquer outro.

## 11. Contato

Dúvidas, sugestões ou denúncias: **${SUPPORT_EMAIL}**

---

Última atualização: ${LEGAL_DATE}.
`.trim();
