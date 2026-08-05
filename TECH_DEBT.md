# Débitos Técnicos — Frontend

> Baseado em auditoria realizada em 2026-04-09 (v0.1.0-alpha.7).
> Itens organizados por prioridade para o caminho até v1.0.

---

## 🔴 Crítico (bloqueia v1.0)

### 1. Sem error boundaries

Nenhum arquivo `error.tsx` existe em nenhum grupo de rotas. Qualquer exceção não tratada durante a renderização derruba a página inteira sem fallback para o usuário.

- **Grupos que precisam de `error.tsx`:**
  - `app/(auth)/`
  - `app/(dashboard)/`
  - `app/(empresa)/empresa/[companyId]/`
  - `app/(workspace)/workspace/[workspaceId]/`
  - `app/(superadmin)/superadmin/`
- **Fix:** Criar um componente de fallback padrão e um `error.tsx` em cada grupo com botão de "Tentar novamente"
- **Esforço:** ~6h

### 2. Sem testes E2E

Nenhum framework de testes de browser está configurado. Fluxos críticos como autenticação, criação de tasks e RBAC não são testados de ponta a ponta do lado do cliente.

- **Opções:** Playwright (recomendado) ou Cypress
- **Fluxos prioritários:**
  - Login, first-access, reset-password
  - Navegar empresa → workspace → kanban
  - Criar, editar, mover e deletar task
  - Filtros e busca no kanban e overview
- **Esforço:** 3–5 semanas para cobertura razoável

---

## 🟡 Alto (fazer antes de v1.0)

### 3. Sem `loading.tsx` nas rotas

Não existe nenhum arquivo `loading.tsx` nos grupos de rotas. Transições de página não têm feedback visual — a tela fica em branco ou congelada até o servidor responder.

- **Fix:** Criar `loading.tsx` com skeleton apropriado para cada rota. O padrão de skeleton já existe a nível de componente (103 ocorrências) — replicar para o nível de página.
- **Esforço:** ~5h

### 4. UI de Task Sessions incompleta

A infraestrutura de time tracking (backend + WebSocket) está implementada, mas a interface do usuário está incompleta:

- Não há timer nos cards do kanban para sessões ativas
- Não há controles de pause/resume/stop visíveis no fluxo principal
- A única referência visual está na página `/sobre`

- **Fix necessário:**
  - Widget de timer nos cards do kanban quando há sessão ativa
  - Controles de play/pause/stop integrados ao dialog de detalhes da task (estrutura já existe)
- **Esforço:** ~10h

### 5. Checklist sem reordenação

Os itens de checklist criados usam um campo `order` no banco mas a UI não expõe drag-and-drop para reordená-los. A ordem é definida pela criação e não pode ser alterada pelo usuário.

- **Fix:** Implementar drag-and-drop com `@dnd-kit` (já é dependência do projeto) nos itens do checklist
- **Esforço:** ~4h

---

## 🟢 Médio (v1.0.1 aceitável)

### 6. `isDone` da coluna sem UI

O campo `Column.isDone` existe no schema e é consumido pela lógica de filtros (ex: "tarefas com prazo" exclui colunas `isDone`), mas não há interface para o usuário marcar uma coluna como "feita" nem diferenciação visual entre colunas normais e colunas de conclusão.

- **Fix:** Adicionar toggle no menu de opções da coluna + estilo visual diferenciado (ex: borda colorida, badge)
- **Esforço:** ~3h

### 7. Busca não está no contexto da empresa

O input "Buscar tasks..." nos filtros do kanban e da visão geral opera apenas sobre os dados já carregados no cliente. Não há busca global por task (por título ou ID) que atravesse workspaces e projetos.

- **Relevância:** Feature de produto, não blocker técnico, mas frequentemente esperada pelos usuários
- **Esforço:** dependente de endpoint backend novo

### 8. Husky hooks vazios

Mesmo problema do backend — `.husky/pre-commit` e `.husky/pre-push` não executam nada no repositório frontend.

- **Fix:** Adicionar `pnpm run lint` no pre-commit e `pnpm run build` no pre-push
- **Esforço:** ~30min

---

## ⚪ Conhecido / Intencional

| Item | Detalhe |
|------|---------|
| Sem bulk actions | Seleção e ação em múltiplas tasks ao mesmo tempo não está no spec |
| Sem export (CSV/PDF) | Fora do escopo do spec atual |
| Busca global cross-workspace | Feature de produto; não está no spec até v1.2 |
| RF031 — Colaboradores externos | UI não implementada pois o backend também foi adiado (v1.2) |
