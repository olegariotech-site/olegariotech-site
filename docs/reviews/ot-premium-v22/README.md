# OT Premium V2.2 — Cosmic Continuum

Prévia empilhada sobre PR #93 (V2.1), sem merge/publicação. [Auditoria e storyboard anteriores à implementação](GATE-A.md).

## Mudanças

O mesmo canvas atmosférico V2.1 passa a apresentar curvas fotográficas da Terra nos intervalos, uma galáxia procedural assimétrica e uma Terra reconhecível no fechamento. O planeta cresce e depois ocupa um ponto menor em profundidade, sem desaparecer. A composição usa o bitmap aprovado já carregado no HERO e nenhum novo asset de produção. A galáxia é preparada em cache no resize; a pintura continua no relógio existente, limitado a 20/s desktop e 12,5/s mobile.

A correção de CLS mantém os anéis originais: a caixa passa a ter dimensão estável, e posição/escala são atualizadas por transformações. Não há mudança no renderer nem na timeline da Terra. O espaço final é reservado no CSS desde a primeira pintura. Reduced motion, Save-Data/memória baixa e página oculta não mantêm loop atmosférico.

## Arquivos e justificativas

| Arquivo | Motivo |
| --- | --- |
| `assets/js/ot-cosmic-scene.js` | Narrativa no canvas/relógio existentes; galáxia em cache, fotografia reutilizada, âncoras/zonas de leitura medidas fora do loop. |
| `assets/css/ot-atmosphere.css` | Correção comprovada dos anéis e espaço estável para o fechamento. |
| `index.html` | Apenas versões de cache de dois recursos alterados. |
| `scripts/measure-continuum.mjs` | Três homes completas, cinco cargas frias por condição, fontes/CLS/LCP/bytes/responsividade atribuídos individualmente. |
| `scripts/verify-continuum.mjs` | Jornada, âncoras, scroll inverso, pixels, resize e evidências reais. |
| `scripts/verify-atmosphere.mjs` | Contar pinturas completas, excluindo limpeza de zonas de leitura no mesmo frame. |
| Workflows QA/CodeQL | Executar os testes existentes e específicos no PR empilhado; separar WebGL e fallback real. |
| `docs/reviews/ot-premium-v22/` | Evidências, decisões, resultados e limitações para revisão. |

## Preservações

Os arquivos originais da Terra (`ot-earth-spin.js`, `ot-earth-journey.js`), áudio, catálogo/editorial dos seis projetos, cinco projetos reais, demonstração Navalha, Solução 03/Ripamonti, navegação, CTAs/contextos, depoimentos, conteúdo comercial, consentimento, GA4, metadados, sitemap e 404 permanecem byte-idênticos à base aprovada. Sem fonte, framework, serviço ou shader novo.

## Limitações

A validação de motores usa Linux/Playwright. WebGL por software e Canvas2D são reportados separadamente; não certificam GPU de cliente, Safari/iPhone físico nem saída física do alto-falante. Abertura dos links e analytics são verificados com destinos interceptados, sem enviar WhatsApp nem contaminar métricas reais. Performance de laboratório da home completa não constitui INP de campo.

Resultados e links de evidência serão preenchidos após os testes. O PR permanecerá rascunho aguardando aprovação visual/funcional de Alexandre.
