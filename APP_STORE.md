# 📱 Guia de Publicação — Apple App Store & Google Play

## Checklist pré-submissão

- [x] `app.json` configurado com `bundleIdentifier`, `package`, ícone, splash
- [x] `eas.json` com perfis `development`, `preview`, `production`
- [x] Ícones gerados em assets/ (1024×1024 PNG)
- [x] Paleta esmeralda + champagne aplicada
- [x] Política de Privacidade pública em `/legal/privacy.html`
- [x] Termos de Uso públicos em `/legal/terms.html`
- [x] Categoria iOS: `public.app-category.finance`
- [x] `ITSAppUsesNonExemptEncryption: false` (não usa criptografia adicional)
- [ ] Conta Apple Developer ativa (US$ 99/ano)
- [ ] App criado no App Store Connect
- [ ] Screenshots gerados (3 tamanhos)
- [ ] Build de produção `.ipa` gerado via EAS
- [ ] Submetido pra revisão

---

## 1. Criar conta Apple Developer

1. Acessa https://developer.apple.com/programs/enroll/
2. Login com Apple ID (cria um se não tiver)
3. Escolhe **Individual** (PF) ou **Organization** (CNPJ)
4. Paga US$ 99 (cartão internacional)
5. **Espera 24-72h** pra aprovação por email

---

## 2. Criar app no App Store Connect

1. Login em https://appstoreconnect.apple.com
2. **Apps → +** → Novo App
3. Preencher:
   - **Plataforma**: iOS
   - **Nome**: Vesti
   - **Idioma principal**: Português (Brasil)
   - **Bundle ID**: `com.rainangleidson.vesti` (vai aparecer após criar provisioning)
   - **SKU**: `vesti-app` (interno, qualquer string)
4. Anotar o **ASC App ID** (numérico) e o **Team ID** (10 chars)
5. Atualizar `eas.json` → seção `submit.production.ios`:
   ```json
   "appleId": "seu@email.com",
   "ascAppId": "123456789",
   "appleTeamId": "ABCDEFGHIJ"
   ```

---

## 3. Preencher metadados no App Store Connect

### Informações do App

**Nome**: Vesti

**Subtítulo** (30 chars): `Sua Carteira em Tempo Real`

**Descrição** (4000 chars):
```
O Vesti acompanha sua carteira de ações, FIIs e ETFs da B3 em um só lugar.

PRINCIPAIS FUNCIONALIDADES

📊 Carteira
• Adicione qualquer ticker da B3 (PETR4, MXRF11, BOVA11...)
• Cotações atualizadas da brapi.dev
• Patrimônio em tempo real, valor investido, lucro/prejuízo
• Análise por classe de ativo (Ações, FIIs, ETFs)
• Gráfico de evolução do patrimônio

💰 Proventos
• Histórico automático de dividendos via Status Invest
• Total recebido por ano e por mês
• Próximos pagamentos confirmados

📋 IR e Declaração
• Isentômetro (R$ 20k/mês swing-trade)
• Calculadora de DARF mensal
• Relatório Copia & Cola pra preencher no DIRPF
• Códigos DIRPF (09 dividendos, 10 JCP)

🧠 Gestor IA
• Diagnóstico completo da carteira em segundos
• Análise por ativo
• Sugestões educativas baseadas no seu perfil

🎯 Metas
• 12 marcos progressivos (R$ 100 → R$ 1 milhão)
• Celebração com confetes ao bater meta
• Meta de renda passiva (DY ou R$/mês)

🏆 Rankings
• Maior DY, P/L baixo, mais valorizadas
• Ranking por classe (Ações/FIIs/ETFs)

📈 Análise individual
• Indicadores fundamentais (P/L, P/VP, ROE, DY)
• Checklist do investidor
• Histórico de dividendos do ativo
• Gráficos de preço (1m, 6m, 1a, 5a)
• Comparador entre ativos
• Discussões da comunidade

🔐 Segurança
• PIN de 4 dígitos
• Modo privacidade (esconde valores)
• Dados criptografados no Supabase
• Política de privacidade transparente

IMPORTANTE
O Vesti é uma ferramenta educacional de organização e acompanhamento.
NÃO somos corretora, banco ou consultor de investimentos.
Não oferecemos garantia de retorno nem aconselhamento financeiro personalizado.
```

**Palavras-chave** (100 chars): `bolsa,ações,dividendos,FII,IR,DARF,carteira,B3,investimento,IA`

**URL de Suporte**: `https://vesti-nine.vercel.app`

**URL de Marketing**: `https://vesti-nine.vercel.app`

**Política de Privacidade**: `https://vesti-nine.vercel.app/legal/privacy.html`

**Categoria primária**: Finanças
**Categoria secundária**: Produtividade

**Direitos autorais**: `© 2026 Rainan Andrade`

**Classificação etária**: 4+ (sem conteúdo restrito)

---

## 4. Screenshots obrigatórios

3 tamanhos pra iPhone (recomendado 5–8 por tamanho):

- **6.7" Display** (iPhone 15 Pro Max): 1290 × 2796 px
- **6.5" Display** (iPhone 11 Pro Max): 1242 × 2688 px
- **5.5" Display** (iPhone 8 Plus): 1242 × 2208 px

**Telas sugeridas pra capturar:**
1. Dashboard (patrimônio + saúde + atalhos)
2. Carteira → Resumo (cards por classe)
3. Lista de ativos (tabela com colunas)
4. Detalhe do ativo (tab Indicadores)
5. Proventos (gráfico de barras)
6. Metas (celebração com confetes)
7. Gestor IA (diagnóstico)
8. IR / DARF

**Como capturar:** Simulator do Xcode (`Cmd+S`) ou app real no iPhone (`Power + Volume Up`).

---

## 5. Build e Submit via EAS

### Primeira vez:

```bash
# Instalar CLI globalmente
npm install -g eas-cli

# Login
eas login

# Linkar projeto (já está linkado no app.json)
# Se der erro de credenciais iOS, rodar:
eas credentials
```

### Build de produção:

```bash
eas build --platform ios --profile production
```

- Roda na nuvem (gratuito até 30 builds/mês)
- Demora ~15-20 min
- No final dá um link pra baixar o `.ipa` (ou submetes direto)

### Submit:

```bash
eas submit --platform ios --profile production --latest
```

Vai pedir:
- Apple ID
- App-specific password (gera em https://appleid.apple.com → Senhas específicas)
- O EAS faz upload pro App Store Connect

### No App Store Connect:

1. Vai aparecer a build na seção **iOS Build**
2. **Selecionar a build** na versão que tu criou
3. Preencher **What's New** (changelog dessa versão)
4. **Submit for Review**
5. Aguardar 1-3 dias (Apple revisa)

---

## 6. Build de teste antes (recomendado)

Antes do production, faz uma preview:

```bash
# Build APK (Android) pra teste rápido
eas build --platform android --profile preview

# Ou simulator iOS
eas build --platform ios --profile preview
```

---

## 7. Próximas atualizações

Pra cada release nova:

1. Bumpa `version` em `app.json` (ex: 4.4.2 → 4.5.0)
2. `eas build --platform ios --profile production`
3. `eas submit --platform ios --profile production --latest`
4. App Store Connect → criar nova versão → selecionar build → Submit

---

## ⚠️ Razões comuns de rejeição (Apple)

| Motivo | Como evitar |
|---|---|
| **5.1.1** — Permissão sem motivo claro | Já temos NSCameraUsage/FaceIDUsage com texto explicativo |
| **5.1.2** — Política de privacidade ausente | Já temos em /legal/privacy.html |
| **4.0** — App muito simples / sem propósito | Não é nosso caso, está populado |
| **2.3.7** — Promessa de retorno financeiro | Já evitamos qualquer linguagem de "lucro garantido" |
| **2.5.4** — Background sem motivo | Não usamos background tasks |
| **3.1.1** — Falta In-App Purchase pra recursos pagos | Se cobrar B3 sync, usa IAP do Apple (taxa 15-30%) |
| **5.1.1(v)** — Login social sem Apple Sign-In | Só usamos email/senha, ok |

---

## 🎬 Tempo total estimado

| Etapa | Tempo |
|---|---|
| Criar conta Apple Developer | 1h + 1-3 dias aprovação |
| Configurar App Store Connect | 2h |
| Capturar screenshots | 1h |
| Primeiro build EAS | 30 min |
| Submit + revisão Apple | 1-3 dias |
| **Total** | **~5-7 dias** |
