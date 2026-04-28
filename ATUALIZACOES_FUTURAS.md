# FinWed — Roadmap de Atualizações Futuras

Documento gerado em **28/04/2026** após auditoria de lançamento.  
Os bloqueadores de lançamento foram corrigidos. Os itens abaixo estão priorizados para as próximas versões.

---

## Versão 1.1 — Qualidade e Estabilidade (curto prazo)

### Correções importantes

- [ ] **Null safety em categorias deletadas**  
  Se o usuário deletar uma categoria que já foi usada em transações ou gastos, as telas de transações e orçamentos podem exibir campos em branco ou travar. Adicionar um fallback `cat ?? { nome: 'Categoria removida', icone: '📦', cor: '#9CA3AF' }` em todos os pontos que fazem `categories.find(...)`.

- [ ] **Limite de armazenamento do avatar**  
  O avatar é salvo como base64 no localStorage. Imagens acima de ~1MB podem esgotar a cota do navegador (~5–10 MB) e travar o app. Solução: rejeitar upload se o tamanho estimado do base64 ultrapassar 300 KB, exibindo mensagem clara ao usuário.

- [ ] **Previsão de conclusão das metas incorreta**  
  `forecastCompletion()` em `useGoalStore.js` usa o valor acumulado total dividido pelos dias desde a criação, sem considerar cadência real de aportes. Corrigir para usar a média dos últimos 3 meses de aportes como taxa projetada.

- [ ] **Transações deletadas sem confirmação**  
  A exclusão de transações na página `/transacoes` é imediata, sem modal de confirmação. Adicionar `useConfirm()` igual ao padrão já usado em metas e categorias.

- [ ] **Meta com prazo no passado**  
  O formulário de metas aceita datas de prazo anteriores à data atual. Adicionar validação `if (prazo < hoje) return 'Prazo deve ser uma data futura'`.

---

## Versão 1.2 — Funcionalidades do Casal (médio prazo)

- [ ] **Transações compartilhadas**  
  A opção "Compartilhada" está desabilitada na UI (`<option disabled>`). A lógica de divisão por percentual (A/B) já existe no store. Falta implementar o formulário de divisão e exibir as transações compartilhadas corretamente no dashboard de ambos os parceiros.

- [ ] **Metas compartilhadas entre o casal**  
  Atualmente as metas usam `casalId` mas não há distinção de contribuição por parceiro nas metas conjuntas. Adicionar campo `visivelPara: 'AMBOS' | 'PESSOAL'` e filtrar por escopo.

- [ ] **Orçamentos compartilhados**  
  Mesma situação das metas — os orçamentos poderiam ter um escopo pessoal ou compartilhado.

---

## Versão 1.3 — Experiência do Usuário (médio prazo)

- [ ] **Desfazer exclusão (undo)**  
  Adicionar um toast com "Desfazer" de 5 segundos ao deletar transações, gastos planejados e metas, em vez de confirmação prévia. Padrão mais moderno e menos interruptivo.

- [ ] **Gastos recorrentes flexíveis**  
  Atualmente a recorrência cria exatamente 7 meses. Permitir ao usuário escolher o número de meses (3, 6, 12, ou indeterminado) no formulário de criação.

- [ ] **Notificações de vencimento**  
  Exibir um badge numérico vermelho no ícone do menu "Gastos" quando houver gastos vencidos no mês atual. Já é possível calcular isso a partir do `usePlannedExpenseStore`.

- [ ] **Scroll body bloqueado em modais no mobile**  
  Quando um modal é aberto em dispositivos móveis, o fundo ainda pode ser rolado. Adicionar `document.body.style.overflow = 'hidden'` no `onOpen` e reverter no `onClose` do componente `Modal.jsx`.

- [ ] **Pasta de data inválida na busca de transações**  
  O filtro de data em `/transacoes` aceita qualquer string sem validar formato. Adicionar parsing seguro com fallback.

---

## Versão 2.0 — Backend e Sincronização (longo prazo)

> Estes itens requerem infraestrutura de servidor e representam uma mudança arquitetural significativa.

- [ ] **Sincronização entre dispositivos**  
  Atualmente todos os dados ficam no localStorage do navegador, inacessíveis de outros dispositivos. Migrar para uma solução de backend (Supabase, Firebase ou API própria) para permitir acesso multiplataforma.

- [ ] **Convite por link/e-mail real**  
  O sistema de convite atual é local — só funciona se ambos os parceiros usarem o mesmo dispositivo/navegador. Com backend, enviar um link por e-mail real para aceitar o convite de qualquer dispositivo.

- [ ] **Exportação de dados (CSV / PDF)**  
  Permitir exportar relatórios de transações, orçamentos e metas em CSV ou PDF para backup e análise externa.

- [ ] **Autenticação robusta**  
  Migrar para autenticação com JWT ou sessão gerenciada por servidor, eliminando a dependência do localStorage para controle de sessão.

- [ ] **Histórico de alterações (audit log)**  
  Registrar quem alterou/excluiu cada dado para rastreabilidade em contas compartilhadas do casal.

---

## Melhorias de Acessibilidade (qualquer versão)

- [ ] Adicionar `aria-label` em todos os botões de ícone (editar, excluir, pagar, etc.)
- [ ] Verificar contraste de cores nos badges e textos de estado (especialmente `variant="yellow"`)
- [ ] Suporte a navegação completa por teclado nos modais (foco inicial no primeiro campo, trap de foco)
- [ ] Adicionar `role="alert"` nas mensagens de erro de formulário

---

## Notas técnicas

| Item | Arquivo-chave | Observação |
|---|---|---|
| Null safety de categorias | `Dashboard.jsx`, `Transactions.jsx`, `PlannedExpenses.jsx` | Usar `cat ?? fallbackCat` no `.find()` |
| Previsão de metas | `useGoalStore.js:forecastCompletion()` | Refatorar algoritmo de taxa |
| Transações compartilhadas | `Transactions.jsx`, `useTransactionStore.js` | Lógica de divisão já existe no store |
| Scroll body em modais | `Modal.jsx` | `useEffect` com overflow toggle |
| Undo exclusão | Todos os stores | Implementar fila de "ações reversíveis" |
