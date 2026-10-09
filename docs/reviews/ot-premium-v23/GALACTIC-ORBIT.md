# V2.3 — correção do movimento e da órbita lateral

Base publicada recuperada: `bd923cebb69dbe5110925f32ba0f01beb84d4e46`, merge do PR #95. A correção preserva também o prolongamento da escala terrestre dos commits `f31e7a6` e `d555a10`.

## Correções pedidas na revisão visual

| Momento | Comportamento |
| --- | --- |
| Jornada | Estrelas descem lentamente em planos com velocidades diferentes; rolagem e turbulência permanecem. O mouse desloca os pontos lateralmente e provoca uma resposta local amortecida. |
| Aproximação | A Terra original mantém seu close-up e acompanha um arco até o braço direito da fotografia. |
| Encaixe | O arco interpola para uma pequena órbita elíptica na região luminosa lateral. A Terra diminui para 58 px no desktop e 34 px no mobile, sem desaparecer no núcleo. |
| Encerramento | Com a rolagem parada, a Terra segue orbitando e girando sobre seu eixo. A região orbital acompanha o braço, o parallax e a orientação galáctica. |
| Galáxia | Núcleo, disco e braços fotográficos têm precessão diferencial limitada; pontos extraídos da fotografia seguem órbitas projetadas independentes. A fotografia inteira não é a única fonte de movimento. |

O espaço já reservado no rodapé passa a encerrar a página após seus links também no desktop. A altura total da reserva continua em 560 px (desktop) e 420 px (mobile). O enquadramento usa a altura realmente visível e protege header, links, créditos, som e WhatsApp, inclusive em viewport desktop baixo. Não há rolagem forçada ou inserção tardia de altura.

Esta é uma representação artística do Sistema Solar em uma região de um braço galáctico, fora de escala; não uma simulação orbital da Terra ao redor do centro de NGC 1300. A fonte NASA/ESA, licença e créditos continuam os mesmos, documentados em `NASA-ASSET.json`.

A rotação das camadas acontece no plano inclinado do disco: a elipse mantém seu enquadramento durante ciclos longos. A região terrestre usa a mesma projeção; sua trajetória acompanha o braço também após vários minutos.

## Preservação

`ot-earth-spin.js` e `ot-earth-journey.js` permanecem byte a byte iguais à main recuperada. Geometria, texturas, shaders, rotação axial e HERO comercial não foram alterados. Conteúdo, showroom, projetos, depoimentos, método, soluções, CTAs, áudio, consentimento, GA4, SEO e acessibilidade permanecem.

Sem nova dependência de produção, canvas ou scheduler. Densidade adaptativa, cadência, DPR, Canvas2D, pausa em aba oculta, movimento reduzido e recursos limitados permanecem ativos.

## Provas de comportamento

O teste de integração registra posições de sprites e matrizes reais de desenho da fotografia. Verifica queda descendente sem scroll/mouse, deslocamento horizontal pelo mouse, movimento diferencial dos braços e órbita da Terra durante cinco segundos de scroll fixo. Também verifica retorno ao HERO, sete viewports, preferências estáticas, lifecycle, imagem atrasada/indisponível e áudio real.

As capturas e vídeos de revisão mostram o movimento no navegador. Chromium, WebKit, CodeQL e a bateria comparativa V2.2/V2.3 seguem no CI do PR. Números finais e limites de laboratório acompanham as evidências entregues na conversa; emulação não substitui aparelho físico.

Branch: `fix/ot-v23-galactic-orbit`. PR em rascunho para aprovação; esta correção não autoriza merge ou publicação.
