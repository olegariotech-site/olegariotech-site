# OT Premium V2 — decisões do protótipo

Base: `4f2550af3e0211b54d4694de6d2e6fce80442dfd` (`main`, PR #89). Direção: **B dominante; A restrita à descoberta de projetos**. Fonte: os dois documentos enviados em 08/10/2026, integralmente lidos, `DESIGN.md` e os quatro documentos de `docs/design-system/`.

## Referência travada antes da implementação

Palco escuro com um único website real dominante, aproximadamente 58/42 entre mídia e narrativa. Canvas, fontes, acentos e raios da OT. Cores do cliente somente dentro de suas mídias. Índice visual pequeno, manual, com cinco clientes reais e um conceito separado. K.L Transporte Express permanece inicial: a chamada efetiva é `renderProject('kl')`, embora o HTML anterior ao JS ainda marque Açaí do Dudu. As imagens de estudo não são fonte de conteúdo.

| Decisão | Origem / papel | Motivo |
| --- | --- | --- |
| Site publicado em moldura discreta | Proposta B, Webflow e Framer no documento aprovado | Evidenciar o produto entregue, além da capa de marca. |
| Mídia dominante e espaço negativo | PostNew / Apple no documento aprovado | Dar protagonismo a cada cliente sem acrescentar ruído. |
| Alternância Website / Identidade e Desktop / Mobile | Especificação §4.3; hierarquia Apple | Mostrar a versão mobile sem sobrepor telas, nomes ou ações. |
| Índice compacto, snap manual e próximo item visível | Proposta A, Netflix, padrão Consistent Carousel Peek | Descoberta rápida sem seis vitrines concorrentes. |
| Borda e marcador ciano, foco nativo visível | Linear, DESIGN.md | Seleção e teclado precisos, não dependentes só da cor. |
| Uma transição de 260ms, sem movimento de câmera | DESIGN.md; guia de motion Refero | Feedback interrompível, leitura estável e reduced motion. |
| CTA do projeto forte; contato secundário; seção preservada | Stripe, conteúdo atual aprovado | Manter a hierarquia e a mensagem contextual existentes. |
| Depoimento legível, desafio/estratégia em disclosure nativo | Especificação §4.3 e §5; componentes OT | Copy completa sem competir com imagem e CTA; prova não oculta. |
| HTML inicial estático e snapshot gerado de projects | Especificação §2, §9 e §10 | K.L e CTA acessíveis mesmo sem JS; sem cadastro paralelo. |
| Faixa de contexto com imagem original da Terra | Brief §B | Continuidade visual, sem renderer novo nem modificação do HERO. |

A consulta live ao Refero retornou `NO_SUBSCRIPTION`; não se apresenta pesquisa nova como executada. A direção deriva das referências já especificadas pelo usuário e dos guias locais de craft/motion.

## Limite desta etapa

Somente arquivos novos do protótipo e CI dedicado. Nenhum arquivo servido pela home é editado. Sem publicação, merge, integração, renderer de Terra, áudio, tracking real ou novo serviço. `data-generate-lead`, URLs e mensagens são preservados para revisão; o protótipo isolado não envia analytics. A instrumentação de produção permanece intacta e deverá ser verificada no Gate B.

## Verificação da direção na interface renderizada

| Fonte / critério | Evidência implementada | Decisão final |
| --- | --- | --- |
| B: 58% mídia / 42% conteúdo | Grid 1.38/1, screenshot real ocupa a maior coluna; sem altura fixa | Mantido no desktop; stack até 900px. |
| A: descoberta dinâmica | Um índice de cinco thumbnails e um grupo Conceito OT, teclado e snap manual | Sem repetir a rail da home ou acrescentar vitrine concorrente. |
| Mobile: cliente e ação antes da imagem | Nome, entrega e CTAs únicos antes da captura mobile | Prévia limitada, com expansão integral solicitada pelo visitante. |
| Moldura + detalhe mobile | Chrome reduzido, controles de vista e device | Alternância aprovada pelo brief em lugar de sobreposição de telefone. |
| Conteúdo comercial e prova | Mesmos registros, mensagens, três avaliações e entregas | Desafio/estratégia em details; testemunho e CTAs sempre visíveis. |
| Seleção inicial | Runtime da main abre K.L; markup anterior ao JS marca Açaí | Preservar K.L, inclusive tab integralmente visível no mobile. |
| Tipografia e personalidade | Space Grotesk / Inter / Share Tech Mono; preto/ciano/violeta OT | Cores dos clientes confinadas às suas mídias. |
| Motion | 260ms em seleção, hover 2px, loaded image antes de swap | Nenhum efeito contínuo; reduced motion instantâneo. |

Capturas desktop, tablet, mobile, segundo case e foco foram inspecionadas. Não permanece achado P0/P1/P2 na demonstração. O limite da validação é o protótipo isolado: integração ao layout global, Terra/áudio e tracking continua sendo Gate B.

## Refinamento solicitado após aprovação da direção artística

Alvo preservado: PR #90 em `9393063`, B dominante e descoberta de A. Nenhum novo redesign. Fonte dos quatro ajustes: instrução expressa de Alexandre em 08/10/2026.

| Ajuste | Decisão | Critério verificável |
| --- | --- | --- |
| Altura inicial mobile | Prévia entre 240 e 320px conforme a tela, com “Ver captura completa” / “Recolher captura” | Imagem local original mantém proporção e dimensão integral; `aria-expanded` e `aria-controls` acompanham o botão. Sem JS, imagem completa permanece disponível. |
| Nome e acesso ao projeto | Bloco comercial precede a mídia no DOM e no layout até 900px; desktop mantém mídia à esquerda e narrativa à direita | Exatamente um link do projeto e um contato por case; mesmas URLs e mensagens. |
| Presença do índice | Miniaturas desktop 64×72px (antes 48×56), nomes 12px, seleção com borda e marcador mais claros | Cinco projetos reais, conceito separado, manual/snap e roving tabindex preservados. Hover somente em dispositivos compatíveis. |
| Entrega e prova | “Entrega OT” identifica o texto canônico; depoimento e disclosure permanecem legíveis | Catálogo, seis cases, três avaliações e `details` intactos. |
| Estado responsivo | Um resolvedor para o dispositivo efetivo, usado por mídia e controles; HTML estático usa picture como fallback, JS controla uma fonte explícita; breakpoint volta ao modo automático | 600px usa mobile; 601px usa desktop. Exatamente um `aria-pressed=true`, controles ocultos saem da tabulação; foco é transferido antes da espera por imagem; no modo interativo, `hidden` é aplicado pela sincronização, sem ocultação antecipada por CSS. |
| Corridas de carregamento | Pedidos de seleção e apresentação têm contadores independentes; seleção reavalia o dispositivo após decode | Redimensionar durante seleção/vista não restaura uma imagem antiga nem deixa `aria-busy` preso. |

Expansão da imagem não recebe animação de altura: a mudança é solicitada pelo usuário, sem deformar o site ou mover texto continuamente. Recolher mantém o botão focado e visível. Troca de cliente conserva os 260ms aprovados e reduced motion. O Gate A permanece pendente de aceite visual final; nenhuma atividade do Gate B foi iniciada.
