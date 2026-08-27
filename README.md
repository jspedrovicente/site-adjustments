# Ajustes do site

Painel interno em Next.js para consultar e manter demandas importadas no Supabase.

## Configuração local

Crie `.env.local` a partir de `.env.example`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
APPROVAL_PASSWORD=escolha-uma-senha-forte
COMPLETION_PASSWORD=escolha-outra-senha-forte
```

Use somente a chave pública (`publishable` ou `anon`). A aplicação respeita RLS e não utiliza `service_role`.

`APPROVAL_PASSWORD` permanece apenas no servidor. Novas demandas recebem o status `Pendente de análise`; depois da aprovação, passam para `Novo` e entram na listagem principal e no dashboard.

Quando todos os itens estiverem feitos, a demanda vai para “Pendentes de confirmação”. `COMPLETION_PASSWORD` protege a confirmação final; depois dela, o status passa para `Finalizada` e a demanda aparece em “Concluídos”.

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000/dashboard`. A interface não exige login. As consultas continuam respeitando as políticas RLS do Supabase; portanto, o papel `anon` precisa ter permissão de leitura para exibir dados sem sessão.

## Estrutura relevante

- `app/(workspace)`: dashboard e telas autenticadas.
- `lib/supabase`: clientes SSR, browser e atualização da sessão.
- `lib/data`: leitura e composição das sete tabelas existentes.
- `components`: shell, cards, badges, itens, galerias e lightbox.
- `lib/database.types.ts`: tipo temporário tolerante ao esquema. Substitua pelo tipo gerado quando a credencial permitir inspecionar o projeto.

## Imagens

Os anexos vêm de `adjustment_attachments` e são associados aos itens por `adjustment_item_attachments`, preservando a relação muitos-para-muitos e o papel da imagem. O servidor gera URLs assinadas por uma hora no bucket privado `site-adjustments`; elas nunca são persistidas.

Ao remover uma imagem, remova primeiro somente a associação do item. O objeto físico só deve ser apagado se nenhuma outra associação o referenciar.

## Validação

```bash
npm run lint
npm run build
```
