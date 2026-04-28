# FinWed — Documentação do Sistema

> Aplicação de finanças pessoais para casais. Gerenciamento de transações, orçamentos, metas e categorias com suporte a perfil individual e de casal.

---

## Índice

1. [Visão Geral](#1-visão-geral)
2. [Stack Tecnológica](#2-stack-tecnológica)
3. [Estrutura de Arquivos](#3-estrutura-de-arquivos)
4. [Roteamento](#4-roteamento)
5. [Gerenciamento de Estado](#5-gerenciamento-de-estado)
6. [Módulos e Páginas](#6-módulos-e-páginas)
7. [Componentes UI](#7-componentes-ui)
8. [Componentes de Layout](#8-componentes-de-layout)
9. [Persistência de Dados](#9-persistência-de-dados)
10. [Fluxos Principais](#10-fluxos-principais)
11. [Utilitários](#11-utilitários)
12. [Dados Padrão](#12-dados-padrão)
13. [Responsividade](#13-responsividade)
14. [Alterações — 28/04/2026](#14-alterações--28042026)

---

## 1. Visão Geral

**FinWed** é uma SPA (Single Page Application) client-side construída em React. Não possui backend — todo o estado é persistido no `localStorage` do navegador via Zustand.

**Funcionalidades principais:**
- Cadastro e autenticação local
- Vinculação de casal via convite por e-mail
- Lançamento de transações (despesas e receitas)
- Orçamentos mensais por categoria
- Metas de poupança com histórico de aportes e previsão de conclusão
- Gerenciamento de categorias padrão e personalizadas
- Dashboard com gráficos de evolução e alertas de orçamento

**Status do projeto:** MVP / Demo  
- Sem backend — dados armazenados no `localStorage`  
- Senhas armazenadas em texto plano (ambiente de demonstração)  
- Funcionalidade "Transações Compartilhadas" parcialmente implementada (UI "Em breve")

---

## 2. Stack Tecnológica

### Produção

| Pacote | Versão | Uso |
|--------|--------|-----|
| `react` | ^18.3.1 | Biblioteca de UI |
| `react-dom` | ^18.3.1 | Renderização no DOM |
| `react-router-dom` | ^6.23.0 | Roteamento client-side |
| `zustand` | ^4.5.2 | Gerenciamento de estado global com persistência |
| `recharts` | ^2.12.7 | Gráficos (pizza, linha, barras) |
| `lucide-react` | ^0.376.0 | Ícones SVG |
| `emoji-picker-react` | ^4.x | Seletor de emoji para categorias |
| `uuid` | ^9.0.1 | Geração de IDs únicos |
| `date-fns` | ^3.6.0 | Manipulação de datas |

### Desenvolvimento / Build

| Pacote | Versão | Uso |
|--------|--------|-----|
| `vite` | ^5.2.11 | Bundler e servidor de dev |
| `@vitejs/plugin-react` | ^4.3.0 | HMR e Fast Refresh |
| `tailwindcss` | ^3.4.4 | Framework CSS utilitário |
| `postcss` | ^8.4.38 | Processamento CSS |
| `autoprefixer` | ^10.4.19 | Prefixos vendor automáticos |

---

## 3. Estrutura de Arquivos

```
FinWed/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── src/
    ├── main.jsx                  # Entry point
    ├── App.jsx                   # Roteador principal
    ├── index.css                 # Estilos globais + Tailwind
    ├── pages/
    │   ├── Login.jsx
    │   ├── Register.jsx
    │   ├── Dashboard.jsx
    │   ├── Transactions.jsx
    │   ├── Budgets.jsx
    │   ├── Goals.jsx
    │   ├── Categories.jsx
    │   └── Profile.jsx
    ├── components/
    │   ├── layout/
    │   │   ├── Layout.jsx
    │   │   ├── Sidebar.jsx
    │   │   ├── BottomNav.jsx
    │   │   └── MobileHeader.jsx
    │   └── ui/
    │       ├── Button.jsx
    │       ├── Input.jsx
    │       ├── Select.jsx
    │       ├── Card.jsx
    │       ├── Modal.jsx
    │       ├── Badge.jsx
    │       ├── CurrencyInput.jsx
    │       ├── ProgressBar.jsx
    │       └── ConfirmDialog.jsx
    ├── store/
    │   ├── useAuthStore.js
    │   ├── useTransactionStore.js
    │   ├── useBudgetStore.js
    │   ├── useGoalStore.js
    │   └── useCategoryStore.js
    ├── data/
    │   └── defaultCategories.js
    └── utils/
        └── formatters.js
```

---

## 4. Roteamento

Definido em `src/App.jsx` com `react-router-dom` v6.

| Rota | Componente | Proteção |
|------|-----------|----------|
| `/login` | `Login` | Pública (redireciona logado → `/`) |
| `/cadastro` | `Register` | Pública (redireciona logado → `/`) |
| `/` | `Dashboard` | Privada |
| `/transacoes` | `Transactions` | Privada |
| `/orcamentos` | `Budgets` | Privada |
| `/metas` | `Goals` | Privada |
| `/categorias` | `Categories` | Privada |
| `/perfil` | `Profile` | Privada |
| `*` | Redirect → `/` | — |

**`PrivateRoute`**: verifica `user` no `useAuthStore`. Se nulo, redireciona para `/login`.  
**`PublicRoute`**: se usuário autenticado, redireciona para `/`.

---

## 5. Gerenciamento de Estado

Todos os stores usam **Zustand** com middleware `persist` (localStorage).

### 5.1 `useAuthStore`

**Chave de persistência:** `finwed_session`  
**Dados persistidos:** `user`, `casal`, `partner`

**Estado:**
```js
{
  user:         { id, nome, email, senha, avatarUrl, casalId, criadoEm },
  casal:        { id, parceiroA, parceiroB, criadoEm },
  partner:      { ...user },
  pendingInvite: { id, remetenteId, remetenteNome, emailConvidado, token, aceito, criadoEm }
}
```

**Métodos:**
| Método | Descrição |
|--------|-----------|
| `register(nome, email, senha)` | Cria usuário, verifica convite pendente |
| `login(email, senha)` | Autentica, carrega casal e parceiro |
| `logout()` | Limpa sessão |
| `updateProfile(data)` | Atualiza nome e/ou avatar |
| `sendInvite(emailConvidado)` | Cria registro de convite |
| `acceptInvite()` | Finaliza vínculo de casal |
| `rejectInvite()` | Marca convite como aceito (recusado) |
| `dissolveCouple()` | Remove vínculo de casal |

**Armazenamento manual (fora do Zustand):**
- `finwed_users` — todos os usuários cadastrados
- `finwed_invites` — todos os convites
- `finwed_couples` — todos os vínculos de casal

---

### 5.2 `useTransactionStore`

**Chave de persistência:** `finwed_transactions`

**Modelo de transação:**
```js
{
  id, criadoEm,
  dataTransacao,   // YYYY-MM-DD
  tipo,            // 'DESPESA' | 'RECEITA'
  escopo,          // 'PESSOAL' | 'COMPARTILHADA'
  valor,           // number (BRL)
  descricao,
  categoriaId,
  divisaoA,        // % (apenas COMPARTILHADA)
  divisaoB,        // % (apenas COMPARTILHADA)
  casalId,
  criadoPor        // userId
}
```

**Métodos:**
| Método | Descrição |
|--------|-----------|
| `forCouple(casalId, userId)` | Retorna transações visíveis (PESSOAL = só do criador) |
| `add(data)` | Cria transação |
| `update(id, data)` | Atualiza transação |
| `remove(id)` | Remove transação |
| `summaryForMonth(casalId, userId, mes, ano)` | `{ receitas, despesas, saldo, txs[] }` |
| `byCategory(casalId, userId, mes, ano)` | `{ categoriaId: totalGasto }` |
| `monthlyEvolution(casalId, userId, months)` | `[{ label, receitas, despesas }]` — últimos N meses |

---

### 5.3 `useBudgetStore`

**Chave de persistência:** `finwed_budgets`

**Modelo de orçamento:**
```js
{
  id, casalId,
  categoriaId,
  valorLimite,   // number (BRL)
  mesRef,        // 1-12
  anoRef         // number
}
```

**Métodos:**
| Método | Descrição |
|--------|-----------|
| `forMonth(casalId, mes, ano)` | Filtra por mês/ano |
| `add(data)` | Cria orçamento (impede duplicata por categoria/mês) |
| `update(id, data)` | Atualiza limite |
| `remove(id)` | Remove orçamento |
| `copyFromPreviousMonth(casalId, mes, ano)` | Copia do mês anterior (pula categorias já existentes) |

---

### 5.4 `useGoalStore`

**Chave de persistência:** `finwed_goals`

**Modelo de meta:**
```js
{
  id, casalId,
  nome, descricao,
  valorAlvo,    // number
  valorAtual,   // calculado — soma dos aportes
  prazo,        // YYYY-MM-DD (opcional)
  status,       // 'ATIVA' | 'CONCLUIDA' | 'ARQUIVADA'
  criadoEm
}
```

**Modelo de aporte:**
```js
{
  id, metaId, usuarioId,
  valor,       // number
  descricao,
  dataAporte,  // YYYY-MM-DD
  criadoEm
}
```

**Métodos:**
| Método | Descrição |
|--------|-----------|
| `forCouple(casalId)` | Retorna metas com status `ATIVA` |
| `archived(casalId)` | Retorna metas não-ativas |
| `add(data)` | Cria meta com `valorAtual=0`, `status=ATIVA` |
| `update(id, data)` | Atualiza campos da meta |
| `archive(id)` | Define `status = ARQUIVADA` |
| `addContribution(metaId, usuarioId, valor, descricao, dataAporte)` | Adiciona aporte; auto-conclui se atingir alvo; retorna `boolean` (concluída?) |
| `contributionsForGoal(metaId)` | Lista aportes de uma meta |
| `removeContribution(id)` | Remove aporte, recalcula `valorAtual`; preserva status `ARQUIVADA` |
| `forecastCompletion(metaId)` | Previsão de conclusão por regressão linear (mínimo 2 aportes) |

**Algoritmo de previsão:**
```
taxa_diaria = valorAtual / (data_último_aporte - data_primeiro_aporte)
dias_restantes = (valorAlvo - valorAtual) / taxa_diaria
data_prevista = data_último_aporte + dias_restantes
```

---

### 5.5 `useCategoryStore`

**Chave de persistência:** `finwed_categories`

**Modelo de categoria customizada:**
```js
{
  id, casalId,
  nome, icone,   // emoji
  cor,           // hex (#RRGGBB)
  tipo,          // 'DESPESA' | 'RECEITA' | 'AMBOS'
  ativo          // boolean (soft-delete)
}
```

**Métodos:**
| Método | Descrição |
|--------|-----------|
| `all(casalId)` | `defaultCategories` + customizadas ativas do casal |
| `byId(id)` | Busca por ID em padrão + customizadas |
| `add(casalId, data)` | Cria categoria customizada |
| `remove(id)` | Soft-delete (`ativo = false`); transações existentes mantêm o `categoriaId` |

---

## 6. Módulos e Páginas

### 6.1 Dashboard (`/`)

Visão consolidada do mês atual.

**Widgets:**
- **Resumo do mês**: total de receitas, despesas e saldo
- **Alertas de orçamento**: categorias acima de 80% do limite (badge amarelo) ou 100% (badge vermelho)
- **Evolução mensal**: gráfico de linha (Recharts) — últimos 6 meses (receitas vs despesas)
- **Gastos por categoria**: gráfico de pizza (Recharts) — mês atual
- **Metas ativas**: até 4 metas com barra de progresso
- **Últimas transações**: 5 mais recentes

---

### 6.2 Transações (`/transacoes`)

CRUD completo de transações financeiras.

**Campos do formulário:**
- Valor (R$), Tipo (Despesa/Receita), Escopo (Pessoal/Compartilhada*)
- Descrição, Data, Categoria (filtrada por tipo)
- Divisão % (apenas Compartilhada — desabilitado, "Em breve")

**Filtros disponíveis:**
- Mês/Ano (seletor), Tipo, Escopo, Categoria, Busca por descrição

**Sumário:**
- Receitas totais, Despesas totais, Saldo do mês filtrado

*Compartilhada: interface presente, funcionalidade em desenvolvimento.

---

### 6.3 Orçamentos (`/orcamentos`)

Limites mensais de gastos por categoria.

**Regras:**
- Uma categoria por mês (sem duplicatas)
- Progresso calculado em tempo real vs. transações do mês
- Cópia do mês anterior disponível (pula categorias já configuradas)

**Status visual:**
| Faixa | Cor | Badge |
|-------|-----|-------|
| < 80% | Verde | OK |
| 80–99% | Amarelo | ⚠️ Atenção |
| ≥ 100% | Vermelho | ❌ Limite atingido |

---

### 6.4 Metas (`/metas`)

Poupança por objetivo com acompanhamento de aportes.

**Seções:**
- **Ativas**: metas em andamento com botão de aporte e histórico
- **Concluídas**: metas que atingiram o valor alvo
- **Arquivadas**: ocultas por padrão, expansível

**Funcionalidades:**
- Registrar aportes com data e descrição
- Histórico de aportes por meta (modal com lista ordenada por data, exclusão individual)
- Badge com previsão de conclusão (≥ 2 aportes necessários)
- Badge de prazo com alerta de vencimento (< 30 dias = amarelo)
- Barra de progresso colorida

---

### 6.5 Categorias (`/categorias`)

Gerenciamento de categorias financeiras.

**Categorias padrão (14):**

| # | Nome | Ícone | Tipo |
|---|------|-------|------|
| 1 | Alimentação | 🍽️ | Despesa |
| 2 | Moradia | 🏠 | Despesa |
| 3 | Transporte | 🚗 | Despesa |
| 4 | Saúde | 💊 | Despesa |
| 5 | Educação | 📚 | Despesa |
| 6 | Lazer | 🎉 | Despesa |
| 7 | Roupas | 👗 | Despesa |
| 8 | Tecnologia | 💻 | Despesa |
| 9 | Assinaturas | 📱 | Despesa |
| 10 | Outros gastos | 📦 | Despesa |
| 11 | Salário | 💰 | Receita |
| 12 | Freelance | 💼 | Receita |
| 13 | Investimentos | 📈 | Receita |
| 14 | Outras rendas | 🎁 | Receita |

**Categorias personalizadas:**
- Campos: Nome, Ícone (emoji picker), Tipo (Despesa/Receita), Cor (paleta de 18 cores)
- Exclusão suave (soft-delete): `ativo = false`; transações existentes não são afetadas
- Filtro por tipo: Todas / Despesas / Receitas

---

### 6.6 Perfil (`/perfil`)

Configurações do usuário.

- Atualizar nome
- Upload de avatar com compressão (JPEG, qualidade 0.8, máx. 200×200px, base64)
- Exibição de informações do casal (vinculação — UI parcialmente implementada)
- Aviso sobre persistência de dados (localStorage)

---

### 6.7 Login (`/login`) e Cadastro (`/cadastro`)

**Validações de senha (cadastro):**
- Mínimo 8 caracteres
- Pelo menos 1 letra maiúscula
- Pelo menos 1 letra minúscula
- Pelo menos 1 número
- Pelo menos 1 caractere especial

**Recuperação de senha (demo):**  
Exibe a senha em texto plano recuperada do `localStorage`. Apenas para demonstração — não seguro para produção.

---

## 7. Componentes UI

Localizados em `src/components/ui/`.

### Button

```jsx
<Button variant="primary|secondary|danger|ghost" size="sm|md|lg">
```

| Variant | Aparência |
|---------|-----------|
| `primary` | Fundo azul primário, texto branco |
| `secondary` | Fundo branco, borda cinza |
| `danger` | Fundo vermelho, texto branco |
| `ghost` | Transparente, texto cinza |

---

### Input

```jsx
<Input label="..." placeholder="..." error="..." value={...} onChange={...} />
```

Suporta: `label`, `error` (borda vermelha + mensagem), `disabled` (fundo acinzentado), todos os atributos nativos de `<input>`.

---

### Select

```jsx
<Select label="..." error="..." disabled={...}>
  <option value="x">...</option>
</Select>
```

---

### CurrencyInput

Input especializado para valores monetários em BRL. Aceita apenas dígitos; formata automaticamente com separador de milhar e decimal (pt-BR).

---

### Modal

```jsx
<Modal open={bool} onClose={fn} title="..." size="sm|md|lg|xl">
  {children}
</Modal>
```

- Overlay com backdrop blur
- Fecha com Esc ou clique no backdrop
- Conteúdo com scroll (`overflow-y-auto`)
- `z-index: 50`

---

### ConfirmDialog + `useConfirm`

```jsx
const { confirm, dialog } = useConfirm()

// No handler:
const handleDelete = async (id) => {
  if (await confirm('Mensagem de confirmação', 'Label do botão')) {
    // executar ação
  }
}

// No JSX:
return <div>...{dialog}</div>
```

- Dialog pequeno (272px), centralizado, com backdrop blur
- Ícone de alerta, mensagem e botões "Cancelar" + ação confirmada
- Fecha com Esc ou clique fora
- API baseada em `Promise` — não bloqueia a thread como `window.confirm()`
- `z-index: 200` (acima de Modais)

---

### Badge

```jsx
<Badge variant="green|red|yellow|blue|gray|purple">texto</Badge>
```

---

### Card

```jsx
<Card className="p-5">conteúdo</Card>
```

Container branco com bordas arredondadas, sombra e borda sutil.

---

### ProgressBar

```jsx
<ProgressBar value={atual} max={total} />
```

Coloração automática:
- Azul primário: < 80%
- Amarelo: 80–99%
- Vermelho: ≥ 100%

---

## 8. Componentes de Layout

### Layout

Wrapper raiz para rotas privadas. Composto por:
- `Sidebar` (oculta no mobile)
- `MobileHeader` (visível apenas no mobile)
- `<main>` com scroll vertical
- `BottomNav` (visível apenas no mobile)

```
Desktop: [Sidebar | Main content]
Mobile:  [MobileHeader] [Main content] [BottomNav]
```

### Sidebar

Navegação lateral — visível em `md+`. Exibe logo, links de navegação e informações do usuário logado.

### BottomNav

Barra de navegação inferior fixa — visível apenas em mobile (`md:hidden`). Usa os mesmos `navLinks` da Sidebar.

### MobileHeader

Cabeçalho sticky no mobile com logo e link para o perfil do usuário.

---

## 9. Persistência de Dados

Todo o armazenamento é feito no `localStorage` do navegador. Não há servidor.

| Chave | Gerenciamento | Conteúdo |
|-------|---------------|---------|
| `finwed_session` | Zustand persist | Sessão ativa: `user`, `casal`, `partner` |
| `finwed_transactions` | Zustand persist | Array de transações |
| `finwed_budgets` | Zustand persist | Array de orçamentos |
| `finwed_goals` | Zustand persist | Array de metas + aportes |
| `finwed_categories` | Zustand persist | Array de categorias customizadas |
| `finwed_users` | Manual (JSON) | Cadastro de todos os usuários |
| `finwed_invites` | Manual (JSON) | Convites de casal |
| `finwed_couples` | Manual (JSON) | Vínculos de casal |

**Atenção:** Limpar os dados do navegador apaga todas as informações permanentemente.

---

## 10. Fluxos Principais

### Autenticação

```
Cadastro → login automático → verificar convite pendente
                                    ↓ sim
                             aceitar/rejeitar convite
                                    ↓ aceitar
                             criar casal (ambos os usuários vinculados)
```

### Ciclo de vida de uma meta

```
Criar meta (nome, valorAlvo, prazo)
     ↓
Registrar aportes (valor, data, descrição)
     ↓
valorAtual += aporte → se valorAtual ≥ valorAlvo → status = CONCLUIDA
     ↓ (alternativo)
Arquivar → status = ARQUIVADA (oculta no dashboard)
```

### Orçamento mensal

```
Criar limite por categoria
     ↓
Transações do mês são somadas por categoria
     ↓
Progresso = gasto / limite × 100
     ↓ > 80% → alerta amarelo no dashboard
     ↓ ≥ 100% → alerta vermelho no dashboard
```

---

## 11. Utilitários

**`src/utils/formatters.js`**

| Função | Retorno | Exemplo |
|--------|---------|---------|
| `formatCurrency(value)` | String BRL | `1234.56` → `"R$ 1.234,56"` |
| `formatDate(dateStr)` | String `dd/mm/aaaa` | `"2024-12-31"` → `"31/12/2024"` |
| `formatDateInput(date)` | String `YYYY-MM-DD` | `new Date()` → `"2024-12-31"` |
| `currentMonthLabel()` | String | `"abril de 2026"` |
| `getMonthYear(date)` | `{ mes, ano }` | `{ mes: 4, ano: 2026 }` |
| `isSameMonth(dateStr, mes, ano)` | `boolean` | — |
| `monthName(mes, ano)` | String | `"abril de 2026"` |
| `last6Months()` | `[{ mes, ano, label }]` | `[..., { label: "abr/26" }]` |

---

## 12. Dados Padrão

**`src/data/defaultCategories.js`**

Array de 14 categorias fixas com IDs `cat-01` a `cat-14`. Não são armazenadas no `localStorage` — carregadas diretamente do código-fonte em toda chamada a `useCategoryStore.all()`.

---

## 13. Responsividade

**Breakpoints (Tailwind padrão):**
- `sm`: ≥ 640px
- `md`: ≥ 768px — ponto de transição mobile ↔ desktop
- `lg`: ≥ 1024px

**Padrões mobile:**
- Sidebar oculta; substituída por `BottomNav` + `MobileHeader`
- Grids colapsam para 1 coluna (`grid-cols-1`)
- Modais ocupam a largura total da tela com padding mínimo
- `overflow-x: hidden` em `html`, `body` e containers principais — sem scroll lateral

**iPhone / Safari:**
- `overflow-x: hidden` aplicado no `html` e `body` para prevenir scroll lateral no iOS
- `BottomNav` usa `pb-safe` para respeitar a área segura do iOS (home indicator)

---

---

## 14. Alterações — 28/04/2026

> As seções abaixo descrevem todas as funcionalidades implementadas e correções aplicadas nesta data.

---

### ✨ Histórico de aportes por meta

**Arquivos alterados:**
- `src/pages/Goals.jsx`
- `src/store/useGoalStore.js`

**Descrição:**  
Cada meta agora possui um histórico completo de aportes acessível por um botão de histórico (ícone de relógio) no canto superior direito de cada card.

**Novo componente `GoalHistoryModal`:**
- Exibe card de resumo com nome da meta, total aportado e barra de progresso
- Lista todos os aportes ordenados por data (mais recente primeiro)
- Cada linha mostra: data, nome de quem aportou (você ou parceiro(a)), descrição e valor
- Botão de exclusão individual (ícone de lixeira) — aparece ao passar o mouse
- Estado vazio com ícone quando não há aportes
- Rodapé com contagem total de aportes

**Badge numérica no card:**  
O ícone de histórico exibe um badge com a quantidade de aportes registrados (máx. "9+").

**Histórico também disponível em metas concluídas** (`CompletedGoalCard`).

**Novo método no store — `removeContribution(id)`:**
```js
// Remove o aporte e recalcula valorAtual da meta
// Preserva status ARQUIVADA (não reverte para ATIVA)
removeContribution: (id) => { ... }
```

---

### 🐛 Bug fix — `removeContribution` sobrescrevia status ARQUIVADA

**Arquivo alterado:** `src/store/useGoalStore.js`

**Problema:**  
Ao remover um aporte de uma meta arquivada, o status era recalculado sem verificar o estado anterior, revertendo incorretamente para `ATIVA`.

**Correção aplicada:**
```js
// Antes (com bug):
status: novoValor >= g.valorAlvo ? 'CONCLUIDA' : 'ATIVA'

// Depois (corrigido):
status: g.status === 'ARQUIVADA'
  ? 'ARQUIVADA'
  : novoValor >= g.valorAlvo ? 'CONCLUIDA' : 'ATIVA'
```

---

### ✨ Página de categorias personalizadas (`/categorias`)

**Arquivos criados/alterados:**
- `src/pages/Categories.jsx` *(criado)*
- `src/App.jsx` *(rota `/categorias` adicionada)*
- `src/components/layout/Sidebar.jsx` *(link "Categorias" adicionado)*

**Descrição:**  
Nova página dedicada ao gerenciamento de categorias, acessível via sidebar (ícone `Tags`).

**Funcionalidades:**
- Listagem de categorias padrão (somente leitura, ícone de cadeado) e personalizadas (removíveis)
- Filtro por tipo: Todas / Despesas / Receitas
- Formulário de criação com: Nome, Ícone (emoji picker), Tipo, Cor (paleta de 18 cores)
- Preview em tempo real da categoria antes de salvar
- Exclusão suave (soft-delete) — transações existentes não são afetadas

---

### ✨ Emoji picker para ícone de categoria

**Arquivo alterado:** `src/pages/Categories.jsx`  
**Dependência adicionada:** `emoji-picker-react`

**Descrição:**  
O campo de ícone no formulário de nova categoria foi substituído por um botão que abre um seletor de emoji completo.

**Comportamento:**
- Clique no botão → abre `EmojiPicker` flutuante
- Seleção do emoji → fecha automaticamente e preenche o ícone
- Clique fora ou tecla Escape → fecha sem selecionar
- Em mobile: picker centralizado na tela (evita extravasamento lateral)
- Em desktop: ancorado à direita do botão

---

### ✨ Diálogo de confirmação personalizado

**Arquivo criado:** `src/components/ui/ConfirmDialog.jsx`  
**Arquivos alterados:** `Transactions.jsx`, `Budgets.jsx`, `Goals.jsx`, `Categories.jsx`

**Descrição:**  
O diálogo nativo `window.confirm()` do navegador foi substituído em todo o sistema por um componente React personalizado.

**Componente `ConfirmDialog`:**
- Modal pequeno (272px), centralizado com backdrop blur
- Ícone de alerta, mensagem descritiva e botões "Cancelar" + ação (label customizável)
- Fecha com Esc ou clique fora do modal
- `z-index: 200` — renderiza acima de outros modais

**Hook `useConfirm()`:**
```js
const { confirm, dialog } = useConfirm()

// Uso (assíncrono, baseado em Promise):
const handleDelete = async (id) => {
  if (await confirm('Excluir esta transação?', 'Excluir')) {
    store.remove(id)
  }
}

// Renderização:
return <div>...{dialog}</div>
```

**Substituições realizadas:**

| Arquivo | Mensagem | Label confirmação |
|---------|----------|-------------------|
| `Transactions.jsx` | "Excluir esta transação?" | Excluir |
| `Budgets.jsx` | "Excluir este orçamento?" | Excluir |
| `Goals.jsx` | "Arquivar esta meta? Ela não aparecerá mais no dashboard." | Arquivar |
| `Goals.jsx` | "Remover este aporte? O valor será descontado da meta." | Remover |
| `Categories.jsx` | "Remover esta categoria? Transações existentes não serão afetadas." | Remover |

---

### 🐛 Correção de scroll lateral no mobile (iPhone 14)

**Arquivos alterados:**
- `src/index.css`
- `src/components/layout/Layout.jsx`
- `src/pages/Categories.jsx`

**Problema:**  
No iPhone 14 (e Safari/iOS em geral), a página apresentava scroll horizontal indesejado.

**Correções aplicadas:**

**`index.css`** — Bloqueio global de overflow horizontal:
```css
html {
  overflow-x: hidden;
}
body {
  overflow-x: hidden;
  width: 100%;
}
```

**`Layout.jsx`** — `<main>` e containers principais:
```jsx
// Antes:
<main className="flex-1 p-4 md:p-6 overflow-auto">

// Depois:
<main className="flex-1 p-4 md:p-6 overflow-y-auto overflow-x-hidden">
```
Também adicionado `overflow-x-hidden` no `<div>` raiz e no container interno do layout.

**`Categories.jsx`** — Posicionamento do emoji picker no mobile:
```jsx
// Mobile: centralizado na tela (evita extravasamento do viewport)
// Desktop: ancorado à direita do botão (comportamento original)
className="fixed z-[300] left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2
           sm:absolute sm:left-auto sm:translate-x-0 sm:top-full sm:right-0 sm:mt-1"
```

---

*Documentação gerada em 28/04/2026*
