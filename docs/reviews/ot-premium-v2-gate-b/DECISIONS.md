# Gate B — integração do showroom aprovado

Base: `4f2550af3e0211b54d4694de6d2e6fce80442dfd`. Referência Gate A: PR #90, `8144b9755b675e632957814faac135a995badccc`. Alexandre aprovou o Gate A e autorizou integração somente em nova branch. Sem merge/publicação.

| Decisão | Fonte | Aplicação |
| --- | --- | --- |
| Palco escuro, site real dominante, B + índice de A | PR #90 e DESIGN.md | Mesmos componentes, cinco clientes e conceito separado; mídia 1.38/1 no desktop. |
| Nome, entrega e ações antes da captura | Refinamento Gate A | Ordem do DOM e layout até 900px; captura mobile 240–320px com expansão solicitada. |
| Superfície do case | DESIGN.md e legibilidade sobre a atmosfera existente | Fundo OT quase opaco, sem tilt/glow extra; a fotografia do cliente e a narrativa permanecem protagonistas. |
| Fontes, título e limites da seção | Home aprovada | Usar as fontes globais existentes, contêiner `.inner`, título/CTA originais; sem faixa de HERO do protótipo. |
| Catálogo editorial único | `projects` em index.html | Módulo lê o objeto existente; build gera apenas HTML inicial, nunca um catálogo paralelo. |
| Mídias verdadeiras e locais | Assets/proveniência do PR #90 e PR #89 | Promover somente screenshots e miniaturas necessários; reutilizar capas locais existentes. |
| Índice manual sempre localizado | Gate A e verificação na home | A seleção revela sua miniatura imediatamente; scroll de toque e snap permanecem nativos, sem autoplay. Resize também reposiciona a seleção dentro do mesmo breakpoint, sem interferir no scroll manual. |
| Uma renderização e um controlador | Auditoria da cadeia atual | Substituir renderer/listeners antigos; manter `renderProject()` como encaminhamento da faixa de prova. |
| Analytics existente | ot-analytics-core.js | Preservar `.project-stage`, `.project-copy` e `data-generate-lead`; estado do painel usa `data-selected-project` para não classificar controles de vista como seleção. Nenhum novo listener de tracking. |
| Motion suave, sem inclinação adicional | Gate A, 260ms e DESIGN.md | Remover exclusivamente o alvo antigo da vitrine no controlador de pointer; soluções e Método preservados. |
| Mídias secundárias com prioridade baixa | Home integrada, não protótipo | Imagem inicial lazy/low; pré-carregar somente o próximo pedido explícito e aguardar decode antes da troca. |
| Comparação de desempenho equivalente | Autorização Gate B | Home completa antes/depois, mesmo servidor, navegador, viewport, fontes, consentimento, motion e número de contextos frios. |

A referência visual está travada. Não há exploração nova nem alteração de HERO, Terra, áudio ou Solução 03. O protótipo continua na branch do PR #90, preservada como evidência. Pesquisa live Refero indisponível por assinatura na etapa anterior; nenhuma pesquisa nova é alegada.
