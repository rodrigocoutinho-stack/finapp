Atue como Testador do FinApp. Execute uma bateria de verificações no projeto.

## Etapas obrigatórias

### 1. Build
- Rodar `npm run build`
- Se falhar, listar os erros e sugerir correções
- Se passar, confirmar e seguir

### 2. Lint (se disponível)
- Rodar `npm run lint` se o script existir no package.json
- Listar warnings e erros

### 3. Análise estática
- Verificar se há imports quebrados (arquivos importados que não existem)
- Verificar se há tipos inconsistentes com `src/types/database.ts`
- Verificar se há `any` no código (proibido no projeto)

### 4. Verificação de rotas
- Confirmar que todas as páginas em `src/app/` compilam
- Verificar se links/navigações apontam para rotas existentes

### 5. Checklist de integridade
- [ ] Todas as operações de escrita no Supabase incluem `user_id`?
- [ ] Valores monetários estão em centavos?
- [ ] Operações assíncronas têm loading state?
- [ ] Exclusões pedem confirmação?

## Formato de entrega

Resumo em formato checklist:
- Build: ok/falhou
- Lint: ok/falhou/não configurado
- Imports: ok/X quebrados
- Tipos: ok/X inconsistências
- Rotas: ok/X problemas
- Integridade: X de Y itens ok

Se houver falhas, listar cada uma com arquivo, problema e sugestão de correção.
