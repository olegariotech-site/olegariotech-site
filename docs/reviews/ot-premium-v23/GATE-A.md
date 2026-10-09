# OT Premium V2.3 · Cosmic Immersive Experience

## Recuperação e referência visual

Auditoria de 09/10/2026: main `8339f397f982536442d885b801cff3c1296374ad`, PRs 93 e 94 integrados; 107 branches e PRs recentes inspecionados. Nenhuma V2.3 encontrada. Branch `feat/ot-premium-v23-cosmic-immersive` baseada nessa main, sem merge/publicação.

Alvo: home V2.2 e identidade OT existentes. Active Theory fornecida no anexo: continuidade, resposta gravitacional amortecida, tempo cinematográfico; Fluidtouch fornecida no briefing: pontos delicados em planos e constelações ocasionais. Refero live retornou NO_SUBSCRIPTION. Documento Fluidtouch completo não anexado; usamos apenas a direção explícita, sem inventar tokens. NASA/ESA Hubble NGC 1300: estrutura barrada real, detalhes e cores fotográficas. Sem copiar marcas, fontes, layout, paletas ou portais das referências.

## Storyboard e decisões

| Ato | Âncora | Movimento e proteção comercial |
| --- | --- | --- |
| Abertura | início | HERO, shaders, geometria, rotação, textura e dissolução originais. Poeira em três profundidades, mouse global amortecido. |
| Travessia | projetos → soluções | Poeira reage a scroll nativo e pointer, sem velocidades verticais constantes. Um único planeta reaparece em curva pela margem direita, sem sobrepor um segundo globo. |
| Presença | método → sobre | Reaparição maior, contraste superior e trajetória contínua; zonas de texto com máscara suave. |
| Aproximação | contato → espaço reservado do rodapé | Fotografia de NGC 1300 aparece gradualmente. Núcleo, braços e estrelas têm ritmos independentes. Não girar simplesmente o bitmap inteiro. |
| Clímax | rodapé | Mesmo renderer da Terra, mesma rotação axial: arco espiral com profundidade, escala decrescente e atenuação gradual em profundidade. Deslocamento lento, sem buraco, sucção ou flash. |

A ponte do renderer só aceita poses da continuação quando a timeline original tem opacidade zero. Nenhum trecho da geometria/shaders/rotação do HERO é substituído. Canvas2D mantém seu HERO original e ganha projeção esférica da textura apenas nas reaparições. Movimento reduzido e recursos limitados recebem composição estática. Um canvas atmosférico e um renderer terrestre; nenhum framework novo.

## Fonte fotográfica

NASA: https://science.nasa.gov/asset/hubble/barred-spiral-galaxy-ngc-1300/

Distribuição do mesmo registro na ESA/Hubble: https://esahubble.org/images/opo0501a/ (opo0501a, 6637 × 3787). JPEG original de distribuição baixado e inspecionado; metadados XMP identificam autoria e Creative Commons Attribution 4.0 International. Condições: https://esahubble.org/copyright/ . Permite adaptações/comércio com atribuição visível, links e sem endosso. Crédito completo preservado, adicionado reconhecimento P. Knezek da página NASA. Não há pessoas/logos no asset.

Derivadas locais 2048 e 1024px WebP; carregamento próximo ao encerramento, sem hotlink. Máscaras, separação em camadas, deslocamentos ópticos e estrelas são interpretação artística OT, não simulação científica da dinâmica de NGC 1300. Arquivo TIFF original 62,9 MB permanece na fonte; não enviado aos visitantes. Hashes e dimensões em NASA-ASSET.json.

## Orçamento e validação

Sem dependência de produção. Densidade adaptativa, teto de DPR, pausa da aba oculta, sem loop estático. Medir V2.2 e V2.3 na home completa em condições iguais, identificando WebGL software/Canvas2D, motion/reduced, LCP, CLS com fontes de deslocamento, Event Timing e custo de submissão JS. Não confundir estes números com GPU física/INP de campo. Meta CLS <0,10 em cada amostra.

Viewports: 1366×768, 1440×900, 1920×1080, 768×1024, 360×800, 390×844, 430×932. Chromium/WebKit, áudio, seis cases, links, navegação, resize, âncoras, imagem atrasada/indisponível, preferências e lifecycle. Browser plugin ausente; Playwright da suíte existente. Primeiro download dos browsers 1.62.1 falhou (ZIP inválido); runner local isolado 1.51.1, sempre a mesma versão no comparativo. CI usa runner do repositório.

## Refinamento técnico após a primeira medição

As amostras iniciais mostraram preparação monolítica da foto (até 411 ms) e custo de WebGL software no encerramento (até 848 ms em Event Timing). A decomposição agora usa pequenos blocos ociosos de 12 linhas. Na continuação, os pontos originais de dissolução ficam ocultos, o framebuffer é limpo e o mesmo renderer/shaders são recortados ao globo visível. A cadência terrestre da continuação é 66 ms; a cadência e a rotação originais do HERO permanecem intactas. O enquadramento final mantém a espiral abaixo do header nas telas baixas. Nenhuma métrica dessa primeira rodada foi removida; a entrega usa a comparação repetida da versão corrigida.

Na revisão ampliada em 1920px, a ordem de stacking da continuação revelou sobreposição na leitura do método. O conteúdo comercial mantém agora um stacking context superior ao da Terra, sem mudança de posição, layout, tipografia ou bordas dos cards. Durante a passagem, o preenchimento dos cards do método recebe a proteção escura necessária para que as nuvens claras não reduzam o contraste. As regiões de leitura incluem também os cards do método. O HERO conserva o mesmo renderer e comportamento.
