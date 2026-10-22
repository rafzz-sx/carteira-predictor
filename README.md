# Carteira Predictor — Cockpit Pessoal de Investimentos B3

> Cockpit quantitativo de alta performance para o mercado de capitais brasileiro (B3) e Tesouro Nacional. Focado 100% em ativos nacionais, conformidade com a Receita Federal (IN RFB nº 1.585/2015), precisão em centavos inteiros e privacidade Local-First.

---

## ⚡ Principais Funcionalidades

- **100% Mercado Brasileiro:** Ações B3 (ON/PN/Units), FIIs, FIAGRO, FI-Infra, ETFs Nacionais (BOVA11, SMAL11, DIVO11) e Renda Fixa/Tesouro Direto com bloqueio estrito de BDRs, Cripto e ETFs internacionais via `BrazilianAssetGuard`.
- **Plano de Ação Inteligente:** Substituição de jargões por **"Ação"**, cálculo de renda passiva reversa, reajustes anuais e overrides sazonais (13º salário).
- **Simulador de Cenários & Monte Carlo:** 4 crises históricas calibradas (COVID-19, Joesley Day, Greve dos Caminhoneiros, Ciclo de Alta da Selic) e 1.000 trajetórias estocásticas de 20 anos em menos de 30ms com amostragem Box-Muller e percentis rigorosos (P10 a P90).
- **Renda Fixa & Marcação a Mercado (MtM):** Duration Modificada, Convexidade, Curva ETTJ DI B3, cálculo de Gross-up para títulos isentos e termômetro prudencial de cobertura do FGC (R$ 250k por instituição / R$ 1M global).
- **Imposto de Renda & DIRPF B3:** Isenção de R$ 20.000/mês para ações, alíquota de 20% para FIIs, segregação estrita de prejuízos, regra dos R$ 10,00 mínimos de DARF e informe oficial de Bens e Direitos por Custo Histórico de Aquisição.
- **Como Calculamos (Transparência Total):** Cockpit aberto com fórmulas explicadas passo a passo e Regra 0 de Honestidade (cotações transparentes defasadas em ~30 min oficiais).
- **Multi-usuário Sem Senhas:** Workspaces isolados via URL (`?user=...`), localStorage e Header, permitindo compartilhar links ou alternar perfis sem burocracia.
- **PWA Instalável no Celular e PC:** Funciona como aplicativo nativo (tela cheia, ícone na tela inicial e suporte offline com Service Worker).
- **Atalhos de Teclado:** Pressione `?` para abrir o menu de atalhos, `M` para alternar o modo de privacidade e `N` para Nova Ação.

---

## 🚀 Como Rodar Localmente

```bash
# Instalar dependências
npm install

# Rodar a suíte completa de 12 testes automatizados
npm test

# Executar verificações de tipagem e linting
npm run typecheck
npm run lint

# Iniciar servidor de desenvolvimento
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

---

## ☁️ Como Fazer o Deploy Online 24/7 (Vercel Grátis)

O **Carteira Predictor** é construído em Next.js e foi projetado para rodar com 1 clique na **Vercel** (100% gratuito):

1. Crie um repositório no seu [GitHub](https://github.com/new).
2. Suba o código deste projeto para o seu repositório:
   ```bash
   git init
   git add .
   git commit -m "feat: Carteira Predictor release 1.0"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
   git push -u origin main
   ```
3. Acesse [vercel.com](https://vercel.com) e faça login gratuito com seu GitHub.
4. Clique em **"Add New"** > **"Project"** e selecione o repositório.
5. Clique em **"Deploy"**. Em cerca de 1 minuto seu link estará no ar: `https://carteira-predictor-seu-nome.vercel.app`!

---

## 📱 Sincronização em Nuvem (Mesma Carteira no PC e Celular)

Por padrão, a plataforma roda com repositórios em memória e LocalStorage. Para que o PC e o seu Smartphone acessem exatamente **a mesma carteira em tempo real**, conecte um banco de dados **Turso** (SQLite na nuvem, 100% grátis com 9GB de espaço, sem exigir cartão de crédito):

1. Crie uma conta gratuita em [turso.tech](https://turso.tech).
2. Crie um banco com 1 clique (ex: `carteira-db`).
3. Adicione duas variáveis de ambiente nas configurações da Vercel (**Settings** > **Environment Variables**):
   - `PERSISTENCE_PROVIDER` = `turso`
   - `TURSO_DATABASE_URL` = `libsql://seu-banco.turso.io`
   - `TURSO_AUTH_TOKEN` = `seu_token_aqui`

O driver já está 100% codificado e pronto no arquivo [src/lib/repositories/turso-repository.ts](file:///c:/Users/perei/OneDrive/Documentos/Carteira/src/lib/repositories/turso-repository.ts).

---

## 📲 Como Instalar como APP no Smartphone

Assim que o site estiver no ar pelo link da Vercel:

### No Android (Google Chrome):
1. Acesse o link no Chrome.
2. Toque no menu de três pontos no canto superior direito.
3. Toque em **"Instalar Aplicativo"** ou **"Adicionar à tela inicial"**.
4. O ícone aparecerá junto aos seus outros aplicativos.

### No iPhone / iOS (Safari):
1. Acesse o link no Safari.
2. Toque no botão de **Compartilhar** (quadrado com seta apontando para cima).
3. Role para baixo e selecione **"Adicionar à Tela de Início"**.
4. Toque em **Adicionar**. O app abrirá em tela cheia sem a barra do navegador.
