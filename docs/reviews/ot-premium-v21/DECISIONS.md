# OT Premium V2.1 — decisões e alvo visual

Base: `main` `cef32459b58c3ce779e526a4e6ef7b76e74f8c67`, com o showroom do PR #91 e a estabilização do HERO/CLS do PR #92. Branch: `feat/ot-premium-v21-atmosphere`. Sem merge ou publicação.

## Alvo

A home publicada é o alvo de composição. Active Theory orienta somente a continuidade do ambiente: Terra → dissolução original → atmosfera esparsa nas seções → repouso no fechamento. Os sites reais, os textos e as ações comerciais continuam à frente.

Fonte recebida: `Texto colado(20261009-123102).txt`, extração Refero da Active Theory (03/07/2026), lida integralmente. A pesquisa live Refero para Active Theory e PostNew retornou `NO_SUBSCRIPTION`; o site Active Theory retorna apenas uma parede JavaScript ao leitor web. Não se afirma inspeção live de sua animação. Referências complementares: DESIGN.md e os quatro documentos de `docs/design-system`, showroom Gate A/B aprovado e guias Refero de motion e QA visual.

## Papéis das referências

| Decisão | Fonte | Papel preservado e aplicação |
| --- | --- | --- |
| Estrutura, tipografia, CTAs e foco | Home publicada + DESIGN.md | Fonte principal. Inter, Space Grotesk, Share Tech Mono e ciano/violeta permanecem; o amarelo citado na referência Lamborghini não recolore a marca aprovada. |
| Ambiente contínuo e UI discreta | Active Theory fornecida | Partículas são cenário. Não importar portal, fonte proprietária, paleta, botões, layout ou novos shaders. |
| Entrega real dominante | Showroom aprovado / direção PostNew do briefing | Capturas dos clientes opacas e fiéis, depoimentos e controles íntegros; atmosfera nos intervalos ao redor. |
| Contraste e impacto do fundo escuro | Home / direção Lamborghini e Netflix do briefing | Preservar o fundo OT e o destaque comercial. Sem efeito cromático novo. |
| Contenção, hierarquia e repouso | DESIGN.md / direção Aesop do briefing | Rarefação na FAQ/rodapé, atenuação próxima da leitura, brilho final estático e discreto. |
| Motion com propósito | Refero motion + DESIGN.md | Reutilizar entrada das seções e transições dos cases. Uma única rotina atmosférica; não empilhar tilt, revelações ou animações de texto. |

## Arquitetura

O problema original era a opacidade do pai `#earthJourney`: ela encerrava também o canvas `.cosmic-scene`. O mesmo canvas é movido para um contêiner fixo decorativo após a Terra, abaixo de `.page`. O módulo existente `ot-cosmic-scene.js` continua responsável pela atmosfera; não há segundo canvas de poeira ou novo motor.

`ot-earth-journey.js` e `ot-earth-spin.js` permanecem byte-idênticos: composição, diâmetro, geometria, shaders, mapa NASA, rotação, dissolução e fallback conservados. O módulo atmosférico consome o evento já existente `ot-earth-visibility`, sem outro listener de scroll. Layout/zonas de leitura são medidos em resize, ResizeObserver e prontidão das fontes, fora do loop contínuo.

128 pontos no desktop, 44 no mobile, 24 estáticos com Save-Data ou memória <=4 GB. Pequenos redemoinhos com velocidades distintas por profundidade substituem queda vertical uniforme. Nascem na periferia da Terra e se dispersam com a timeline original. Densidade interpolada por seção, atenuada nas zonas de texto. Loop limitado a 20 pinturas/s desktop e 12,5/s mobile; DPR <=1,3/1. Sem loops sob reduced motion, página oculta ou modo limitado. A faixa inicial cai de 7.680 células + 1.100 pontos para 1.536 células desktop; remove blur do traço.

O stylesheet novo limita-se ao contêiner, bordas/superfícies dos cases e brilho estático do rodapé. Não altera tamanho das imagens, geometria de layout, textos, fonte, CTA, contraste ou controle.

## Exclusões deliberadas

Sem scroll hijacking, parallax de texto, chuva uniforme, brilho pulsante, blur contínuo, cursor customizado, sons extras, autoplay novo, dependências de produção, dados editoriais duplicados ou imagens geradas. A informação permanece acessível sem animação e sem JavaScript.

## QA e limitações

Browser plugin não disponível; usado o runner Playwright existente. Validar sete resoluções (incluindo tablet), Chromium/WebKit em CI, reduced motion dinâmico, Save-Data/memória baixa, pausa/reentrada, Terra/áudio e todas as jornadas comerciais. Performance compara a home completa com `cef3245`, não com o protótipo ou com a antiga base Gate B. Capturas por software e simulação de motores não certificam GPU, Safari/iPhone físico ou saída física de alto-falante.
