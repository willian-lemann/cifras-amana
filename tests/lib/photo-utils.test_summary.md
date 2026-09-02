# Test Summary — Photo Gallery Utils

Cobre duas tarefas que compartilham o módulo `lib/photo-utils.ts`:

- **Tarefa 3** — ordenação drag-and-drop das fotos; a primeira foto é a capa.
- **Tarefa 4** — limite de 40 fotos no upload, com feedback ao exceder.

## Casos de teste (`tests/lib/photo-utils.test.ts`)

### `reorderPhotos` / `getCoverPhoto`

| #   | Cenário                                       | Tipo  | Resultado |
| --- | --------------------------------------------- | ----- | --------- |
| 1   | Mover foto para o início vira a nova capa     | Happy | ✅        |
| 2   | Mover a primeira foto para o fim              | Happy | ✅        |
| 3   | Retorna novo array (não muta o original)      | Happy | ✅        |
| 4   | No-op quando origem == destino                | Edge  | ✅        |
| 5   | Índice fora do intervalo → lista inalterada   | Edge  | ✅        |
| 6   | Lista vazia                                   | Edge  | ✅        |
| 7   | `getCoverPhoto` retorna a primeira foto       | Happy | ✅        |
| 8   | `getCoverPhoto` de lista vazia → string vazia | Edge  | ✅        |

### `clampToLimit`

| #   | Cenário                                   | Tipo  | Resultado |
| --- | ----------------------------------------- | ----- | --------- |
| 1   | Tudo aceito quando abaixo do limite       | Happy | ✅        |
| 2   | Aceita o exato que completa o limite      | Happy | ✅        |
| 3   | Aceita só o que cabe, reporta o excedente | Over  | ✅        |
| 4   | Rejeita tudo quando já no limite          | Over  | ✅        |
| 5   | Rejeita tudo quando já acima do limite    | Edge  | ✅        |
| 6   | Lista de entrada vazia                    | Edge  | ✅        |

## Integração na UI

- `components/listings/image-step.tsx`: drag nativo (HTML5) nos thumbnails já
  enviados; a primeira foto recebe o badge "Capa"; `MAX_PHOTOS = 40` aplicado no
  upload e no add por URL, com feedback quando excede.
- `components/listings/listing-form.tsx`: a capa (`image`) é mantida sempre como
  `photos[0]`.
- `app/api/upload/presign/route.ts`: limite por requisição 30 → 40.

## Resultado final

- **14/14** testes do módulo passando.
- `pnpm qa` verde: format + lint + typecheck + **565 testes** (5 skipped).

## Premissas / limitações

- O drag-and-drop usa HTML5 nativo (funciona no grid de 2 colunas; o `Reorder`
  do framer-motion é 1-D e não encaixa). Reordenação no desktop; toque pode
  exigir tratamento adicional no futuro.
- A reordenação se aplica às fotos já enviadas; fotos ainda não salvas entram no
  fim e podem ser reordenadas após o upload.
