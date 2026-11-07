# Style Guide — Chegou.AI (Design System & Referência Visual "Vault")

> **Visão de Senior Product Designer:**
> Documentação técnica e visual para transposição fiel da linguagem visual de alta sofisticação identificada na referência (*Vault Design System*) para a arquitetura front-end do **Chegou.AI** utilizando **Tailwind CSS + shadcn/ui**.

---

## 1. Filosofia de Design: *Clean Bento Grid & Neo-Fintech Minimalista*

A referência visual apresenta uma estética refinada que equilibra **alta produtividade corporativa com frescor contemporâneo**. 

### Princípios Fundamentais:
1. **Contraste Híbrido (Dark Anchor + Light Canvas):** A interface ancora a navegação global em uma sidebar escura profunda (`#18181B`), enquanto o espaço de trabalho é um canvas claro, quente e respirável (`#F4F4F3` / `#F8FAFC`). Isso reduz drasticamente a fadiga visual do operador da portaria e do síndico em turnos contínuos.
2. **Card Invertido de Impacto Heroico:** O primeiro KPI (métrica prioritária do momento) recebe tratamento invertido escuro (`bg-zinc-900 text-white`) com detalhes no acento de alta energia, criando uma hierarquia visual instantânea que guia o olhar para a métrica mais crítica da portaria (ex: *Encomendas Pendentes de Retirada*).
3. **Contornos Precisos sobre Elevações Pesadas:** A profundidade não vem de sombras projetadas agressivas (drop-shadows sujos), mas de **bordas cirúrgicas de 1px com tons neutros calibrados** combinadas a um sutilíssimo blur de superfície (`shadow-[0_2px_8px_rgba(0,0,0,0.02)]`).
4. **Acabamento Curvo Generoso & Amigável:** Uso rigoroso de raios de curvatura proporcionais (24px para cards principais, 16px para seções e 12px/pill para controles), suavizando a densidade dos dados e tornando o manuseio tátil em tablets e celulares extremamente fluido.

---

## 2. Paleta de Cores Exata & Tokens de Sistema

| Função Semântica | Hex Exato | Token Tailwind Sugerido | Variável CSS (`globals.css`) | Aplicação no Chegou.AI |
| :--- | :--- | :--- | :--- | :--- |
| **Canvas Background** | `#F4F4F3` / `#F6F7F9` | `bg-[#F4F4F3]` ou `bg-zinc-100/70` | `--background: oklch(0.97 0.005 85)` | Fundo geral da aplicação e área de conteúdo |
| **Card Surface (Padrão)** | `#FFFFFF` | `bg-white` | `--card: oklch(1 0 0)` | Cards do Bento Grid, tabelas, modais |
| **Hero Card (Invertido)** | `#18181B` / `#27272A` | `bg-[#18181B]` ou `bg-zinc-900` | `--card-hero: oklch(0.20 0.01 260)` | Card de maior urgência (ex: Pendências na Portaria) |
| **Sidebar / Chrome** | `#1C1C1E` / `#18181B` | `bg-[#18181B]` | `--sidebar-bg: #18181B` | Navegação lateral ou header de ancoragem |
| **Primary Accent (Destaque)** | `#E1FF01` | `bg-[#E1FF01]` / `text-[#E1FF01]` | `--brand-lime: #E1FF01` | Foco de atenção, pills de IA, botões de alta prioridade com texto preto |
| **Subtle Border** | `#E4E4E7` | `border-zinc-200` / `border-[#E4E4E7]` | `--border: #E4E4E7` | Divisórias e bordas perimetrais de 1px dos cards |
| **Text Primary** | `#09090B` / `#18181B` | `text-zinc-900` | `--foreground: #09090B` | Títulos, métricas numéricas principais |
| **Text Secondary / Labels** | `#52525C` / `#71717A` | `text-zinc-500` / `text-zinc-600` | `--muted-foreground: #71717A` | Labels descritivos, cabeçalhos de tabela |
| **Text Subtle / Metadados** | `#A1A1AA` | `text-zinc-400` | `--subtle: #A1A1AA` | Timestamps secundários, rastreios inativos |

### Cores de Status Funcionais (Badges & Indicadores de Ciclo de Vida)

| Status do Pacote | Background Badge | Cor do Texto | Ícone / Detalhe | Significado Operacional |
| :--- | :--- | :--- | :--- | :--- |
| **`RECEIVED`** | `bg-amber-50 border-amber-200` | `text-amber-800` | Amarelo Quente (`#FBBF24`) | Pacote registrado na portaria, aguardando envio |
| **`NOTIFIED`** | `bg-zinc-100 border-zinc-200` | `text-zinc-800` | Ponto Verde Neon (`#E1FF01`) | Notificação Push disparada ao morador |
| **`DELIVERED`** | `bg-emerald-50 border-emerald-200` | `text-emerald-700` | Esmeralda (`#10B981`) | Retirada com PIN/QR validada e baixada |
| **`NOTIFICATION_FAILED`** | `bg-rose-50 border-rose-200` | `text-rose-700` | Vermelho Suave (`#F43F5E`) | Falha no WebPush/FCM (requer atenção) |
| **`CANCELLED`** | `bg-zinc-100 border-zinc-200` | `text-zinc-500` | Cinza Neutro (`#71717A`) | Devolvido à transportadora / cancelado |

---

## 3. Tipografia & Hierarquia de Informação

A tipografia deve utilizar fontes sem serifa modernas com alta legibilidade geométrica (ex: **Inter**, **Geist Sans** ou **Plus Jakarta Sans**).

### Escala & Aplicação Exata:

1. **Cumprimento & Título de Página:**
   - Classes: `text-2xl font-bold tracking-tight text-zinc-900`
   - Exemplo: *"Olá, Porteiro Carlos 👋"* ou *"Terminal da Portaria"*
2. **Números de Métricas / Big KPIs:**
   - Classes: `text-2xl lg:text-3xl font-extrabold tracking-tight text-zinc-900` (ou `text-white` no card invertido)
   - Exemplo: *"23 Pacotes"*, *"98.4% IA"*
3. **Indicador de Tendência / Comparativo Temporal:**
   - Classes: `inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60`
   - Exemplo: `+12% desde ontem`
4. **Títulos de Seção / Cards do Grid:**
   - Classes: `text-sm font-bold text-zinc-800 tracking-tight`
   - Exemplo: *"Últimas Encomendas Registradas"*, *"Capacidade da Sala de Pacotes"*
5. **Labels de Formulário & Metadados Secundários:**
   - Classes: `text-xs font-medium text-zinc-500 uppercase tracking-wider`
   - Exemplo: *"TRANSPORTADORA"*, *"BLOCO / UNIDADE"*

---

## 4. Geometria, Grid & Espaçamento

Com base no diagrama oficial de raios e no grid system da referência:

### 4.1. Tokens de Arredondamento (Border Radius):

```
┌────────────────────────────────────────────────────────┐
│ Large Round — 24px (rounded-[24px] / rounded-3xl)      │
│  → Containers principais, Cards Bento Grid, Modais     │
│                                                        │
│   ┌──────────────────────────────────────────────┐     │
│   │ Medium Round — 16px (rounded-2xl)            │     │
│   │  → Sub-seções internas, gráficos, mini-cards │     │
│   │                                              │     │
│   │   ┌────────────────────────────────────┐     │     │
│   │   │ Smallest — 12px (rounded-xl)       │     │     │
│   │   │  → Inputs, Selects, Tags, Ícones   │     │     │
│   │   └────────────────────────────────────┘     │     │
│   └──────────────────────────────────────────────┘     │
└────────────────────────────────────────────────────────┘
```

- **Pill Shape (`rounded-full`):** Exclusivo para botões primários de ação (*"Nova Encomenda +"*), barra de pesquisa e badges de status.

### 4.2. Grid System (Base 12 Colunas):
- **Sidebar Fixa (Desktop):** Largura de `288px` (`w-72`), fundo escuro profundo `#18181B`.
- **Gutters & Espaçamento entre Colunas:** `gap-6` (24px) rigoroso entre todos os cartões do Bento Grid.
- **Padding Interno de Cartão:** `p-6` (24px) como padrão nos cards de métricas e painéis, garantindo que os dados respirem.
- **Mobile Grid:** Em telas menores (`< 768px`), os cards colapsam para `grid-cols-1` mantendo `p-5` e `rounded-[20px]`.

---

## 5. Densidade Visual & Remoção de Redundância (UX de Alta Eficiência)

A referência *Vault* se destaca por eliminar o excesso de inputs e formulários crus na tela principal. Para o **Chegou.AI**, aplicamos essa mesma mentalidade:

1. **Barra de Pesquisa Unificada (Search Pill):**
   - Em vez de filtros espalhados na tela, utiliza-se uma barra de busca elegante em formato pílula com ícone de filtro embutido (`Search + Filter Icon inline`).
   - Placeholder contextual: *"Buscar por destinatário, apto, rastreio..."*
2. **Ação Primária Isolada e Clara:**
   - Apenas um botão principal no topo direito da tela: `Add New Product +` na referência vira **`Novo Check-in +`** no Chegou.AI, em formato Pill preto ou verde neon com texto escuro.
3. **Check-in via Drawer Lateral / Modal Limpo:**
   - Evita formulários extensos que poluem a visão operacional do porteiro. Ao clicar em *"Novo Check-in"*, abre-se um Drawer direito (`Sheet` do shadcn) de 480px com a câmera de IA e confirmação rápida.
4. **Mini-indicadores Gráficos em vez de Texto Repetitivo:**
   - Em cards de capacidade ou precisão, utiliza-se uma barra de progresso horizontal fina com gradiente sutil ou medidor circular em vez de tabelas cheias de números redundantes.
5. **Ícones em Squircles Neutros:**
   - Cada métrica conta com um ícone abrigado em um squircle suave de 40x40px (`size-10 rounded-xl bg-zinc-100 flex items-center justify-center`), gerando identificação visual imediata sem poluir com cores berrantes.

---

## 6. Mapeamento de Componentes shadcn/ui

| Componente shadcn | Customização Específica para a Estética Vault |
| :--- | :--- |
| **`Card`** | `rounded-[24px] border border-zinc-200/80 bg-white p-6 shadow-xs hover:border-zinc-300 transition-all` |
| **`Card (Hero Invertido)`** | `rounded-[24px] border border-zinc-800 bg-zinc-900 text-white p-6 shadow-sm` |
| **`Button (Primary Pill)`** | `rounded-full bg-zinc-900 text-white hover:bg-black px-5 py-2.5 font-semibold text-xs shadow-xs` |
| **`Button (Neon Highlight)`** | `rounded-full bg-[#E1FF01] text-zinc-950 hover:bg-[#d4f000] px-5 py-2.5 font-bold text-xs` |
| **`Input (Search Pill)`** | `rounded-full border-zinc-200 bg-white pl-10 pr-10 h-11 text-sm shadow-2xs focus-visible:ring-zinc-900` |
| **`Badge`** | `rounded-full font-semibold text-[11px] px-2.5 py-0.5 border` |
| **`Table`** | `[&_tr]:border-zinc-100 [&_th]:text-zinc-400 [&_th]:text-xs [&_th]:font-semibold` |
| **`Sheet / Drawer`** | `rounded-l-[32px] border-l border-zinc-200 bg-white p-8 shadow-2xl` |

---

## 7. Próximos Passos de Implementação (Fase 2)

Quando autorizado para código:
1. Atualizar tokens do `apps/web/src/app/globals.css` com a nova paleta (`#F4F4F3`, `#18181B`, `#E1FF01`).
2. Configurar os raios de 24px (`rounded-3xl` / `rounded-[24px]`) nos componentes base do shadcn.
3. Refatorar o layout da Portaria para o estilo Bento Grid com o primeiro card hero invertido.
4. Transformar o fluxo de check-in em Drawer/Sheet lateral ultra-rápido.

