# Gate A — Cosmic Continuum V2.2

Auditoria anterior à implementação, 09/10/2026. Execução autorizada pelo briefing recebido; este documento registra as escolhas antes do código, sem solicitar novo aceite intermediário.

## Bases confirmadas

`main`: `cef32459b58c3ce779e526a4e6ef7b76e74f8c67`. PRs #86, #91 e #92 integrados. PR #90 permanece rascunho; PR #93 permanece aberto/rascunho, com cabeça `3c5a507807874e7a95f6b51085bd521668210ac0`. A nova branch `feat/ot-premium-v22-cosmic-continuum` parte dessa cabeça e terá PR empilhado sobre `feat/ot-premium-v21-atmosphere`. Nenhum merge/publicação.

Foram lidos integralmente os dois anexos (conteúdo idêntico), DESIGN.md, foundations/components/patterns/README do design system, decisões/relatório/evidências V2.1 e cadeia original de Terra/atmosfera/motion. Referência Active Theory é direção de linguagem fornecida; não implica cópia de material, fonte ou shader.

## Diagnóstico inicial do CLS

Chromium local, 390×844, carregamento frio da home V2.1, movimento habilitado, Canvas2D real: um deslocamento de **0,27993** aponta `.earth-journey__orbits` e seu `::after`. A geometria CSS inicia em `78vw/50vh/540px` e recebe valores medidos no HERO; mudar `left/top/width/height` reposiciona a decoração depois da primeira pintura. Reduced motion esconde os anéis e não apresenta esse deslocamento. Outros pequenos deslocamentos apontam carregamento de fontes e refinamento do cabeçalho móvel.

Esta amostra identifica a causa; não representa mediana nem certificação. Medir ao menos cinco cargas frias por condição nas três versões, com fontes reais e condições equivalentes, atribuindo fontes individuais. Correção proposta: dimensão-base fixa dos anéis e `transform` para posição/escala, consumindo o evento original no módulo atmosférico. Não alterar renderer, fotografia, diâmetro ou timeline da Terra. Não esconder anéis para melhorar o número.

## Storyboard

| Ato | Âncora real | Composição / propósito |
| --- | --- | --- |
| 1 · Abertura | HERO | Terra e anéis originais, texto/CTAs intactos. Poeira deriva da periferia. |
| 2 · Liberação | Saída do HERO | Dissolução continental e ondas originais; poeira assume o ambiente sem corte. |
| 3 · Travessia | Intervalos depois de Projetos e Método | Aparições raras da curva terrestre pela direita. Grande parte do planeta fora do viewport; fundo abaixo dos cartões e leitura. Sem globos inteiros repetidos. |
| 4 · Aproximação | FAQ → Contato | A galáxia começa a aparecer pela direita; uma Terra reconhecível aproxima-se da composição. |
| 5 · Integração | Contato → Rodapé | Espiral nebular assimétrica ocupa o espaço reservado. A Terra cresce brevemente, depois fica menor em profundidade, permanecendo visível. Sem portal, buraco negro, sucção ou giro acelerado. |

## Arquitetura e orçamento

Estender `ot-cosmic-scene.js`, o mesmo canvas V2.1, o mesmo relógio atmosférico e evento `ot-earth-visibility`. Reutilizar a fotografia aprovada `/assets/img/orbit/ot-earth-atmosphere-static-v2.webp` já presente no DOM; nenhum asset novo ou questão de licença. Galáxia procedural desenhada uma vez numa superfície de cache em resize; esse bitmap é copiado pelo canvas existente, sem segundo renderer/loop WebGL. Coordenadas derivadas de seções reais e medidas em mudanças de layout.

Reservar espaço final por CSS desde a primeira pintura; narrativa não muda altura da página. Native scroll reversível, sem interceptação. 20 pinturas/s desktop, 12,5 mobile; reduced motion/Save-Data/memória baixa estáticos; pausa oculta. Paleta OT ciano/violeta e famílias tipográficas mantidas. Incremento pretendido de código de produção ≤12 KiB.

## Preservações e evidências previstas

Arquivos `ot-earth-spin.js`/`ot-earth-journey.js` byte-idênticos, HERO/catálogo/soluções/links/áudio/analytics/SEO intactos. Sete resoluções, Chromium/WebKit, atalhos diretos, scroll inverso, resize/orientação, preferências dinâmicas, controles comerciais e workflows/CodeQL. Capturas antes/depois e três estados reais de galáxia, vídeos nativos desktop/mobile. Simulação Linux não certifica Safari/iPhone físico nem saída física de alto-falante.
