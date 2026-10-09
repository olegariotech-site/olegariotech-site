# OT Premium V2.1 — prévia para aprovação

**Branch:** `feat/ot-premium-v21-atmosphere`. **Base:** `main` `cef3245`, com showroom Premium V2 e correção de CLS publicados. Sem merge ou publicação desta V2.1.

A Terra continua como assinatura. A atmosfera inicia em sua periferia, acompanha a dissolução aprovada e permanece nos intervalos de leitura até o rodapé. Os projetos reais permanecem em primeiro plano, com o Armazém Ripamonti preservado nas duas apresentações aprovadas. Bordas discretas dão presença aos frames; o fechamento recebe iluminação estática leve.

[Decisões e referências](./DECISIONS.md) · [Auditoria do escopo](./scope-audit.json) · [Proveniência das capturas](./evidence/captures.json)

## Arquivos e motivo

| Arquivo | Alteração |
| --- | --- |
| `assets/js/ot-cosmic-scene.js` | Reutilizar canvas/renderizador existentes para poeira contextual, zonas de leitura, budgets e ciclo de vida. |
| `assets/css/ot-atmosphere.css` | Contêiner fixo sem interação; bordas/superfícies dos cases e iluminação discreta do rodapé. |
| `index.html` | Importar somente o CSS novo e atualizar a chave de cache do módulo existente. |
| `scripts/verify-showroom.mjs` | Comparar com a main atual; remover apenas a atmosfera da lista de arquivos imutáveis, preservando todas as assertions de conteúdo, Terra, áudio e analytics. |
| `scripts/verify-atmosphere.mjs` | Verificar pixels reais após HERO, timeline/rotação, áudio, preferências, visibilidade e resize. |
| `scripts/measure-atmosphere.mjs` | Medir home inteira antes/depois com movimento habilitado, em contextos frios alternados. |
| `.github/workflows/showroom-integration-qa.yml` | Incluir os novos controles em Chromium/WebKit e performance com motion em Chromium. |
| `docs/reviews/ot-premium-v21/` | Decisões, dados, capturas e resultado da revisão. |

Preservados byte a byte: renderer/geometria/shaders/rotação da Terra, timeline original, todos os assets aprovados, catálogo `projects`, HERO e textos, soluções (incluindo 03), módulo do showroom, áudio, navegação, método/FAQ, consentimento, GA4, SEO e Design System. A camada decorativa não participa da ordem de foco nem intercepta ponteiro/scroll.

## Validação local

Browser plugin não disponível; Playwright existente em Chromium/Linux, fallback Canvas2D original da Terra. Nenhuma rotação fotográfica foi simulada.

- Home comercial: sete resoluções + dois reduced motion, resize e consentimento/analytics. Seis cases, Website/Identidade, Desktop/Mobile, expansão, troca rápida, disclosure, teclado/foco e 12 popups oficiais/contextuais. HTML inicial sem JS preservado.
- Atmosfera: sete resoluções, pixels presentes em HERO/Projetos/Soluções/Método/fechamento, movimento além do HERO, reduced motion dinâmico, Save-Data, memória limitada, pausa/reentrada por visibilidade emulada e resize sem canvas duplicado.
- Timeline original Terra → partículas → ondas e botão de áudio em 1440 × 900. Reprodução do MP3 aprovado, loop/volume/ARIA e pausa/mute verificados. CI verifica a rotação real quando WebGL está disponível.
- Zero erros JavaScript, imagens 404 ou overflow nos sete viewports; captura da própria UI conferida visualmente. Nenhuma biblioteca de produção nova.

[Home e links](./evidence/home-local.json) · [Atmosfera/timeline/áudio](./evidence/atmosphere-local.json)

## Performance — home completa

Medianas de três contextos frios por versão/viewport, mesma base/Chromium/HTTP/fontes e consentimento recusado. Movimento habilitado usa pares alternados, com aquecimento apenas do transporte das fontes. Movimento reduzido usa a bateria existente. Sem throttling e sem outras baterias simultâneas durante medição. Hardware e fallback por software são limitações; não são dados de campo nem prova de fluidez em GPU real.

| Condição | Viewport | LCP antes → depois | CLS antes → depois | Corpos antes → depois |
| --- | --- | --- | --- | --- |
| Movimento habilitado | 1440 × 900 | 372 → 444ms | 0.04267 → 0.04267 | 2465.4 → 2469.7KiB |
| Movimento habilitado | 390 × 844 | 360 → 312ms | 0.30025 → 0.30025 | 1829.0 → 1833.3KiB |
| Movimento reduzido | 1440 × 900 | 796 → 532ms | 0.00459 → 0.00459 | 1442.3 → 1446.7KiB |
| Movimento reduzido | 390 × 844 | 356 → 248ms | 0.00231 → 0.00262 | 805.9 → 810.2KiB |

Custo inicial adicional: **4,32 KiB** de corpos locais (+4424 bytes); JS externo +3188 bytes e nenhum asset/framework novo. A pintura inicial da atmosfera foi reduzida de 7680 células + 1100 pontos para 1536 células + até 128 pontos. P95 da submissão JS do canvas: mediana desktop 31,6 → 6,8ms; mobile 27 → 5ms. Não mede rasterização GPU.

**Tradeoff e regressões observadas:** a atmosfera agora trabalha após o HERO (até 20 pinturas/s desktop, 12,5/s mobile; antes era encerrada). LCP desktop com motion +72ms nesta amostra. Event Timing máximo por execução, na mediana: desktop full motion 360 → 424ms, reduced 104 → 200ms; mobile 344 → 296ms e 80 → 72ms, respectivamente. Esses máximos foram colhidos em várias interações da jornada e não equivalem a INP de campo; não há isolamento causal da diferença. O CI repete a medição em WebGL. Não afirmar melhoria global de desempenho. O CLS elevado de mobile com movimento já aparece na base; a mediana não aumenta. Fontes/runtimes e os shifts da base ficam nos dados brutos, sem mudanças fora do escopo.

[Dados com motion](./evidence/performance-motion.json) · [Dados reduced motion e fontes dos shifts](./evidence/performance-reduced.json)

## CI

Workflows Chromium/WebKit, regressão existente e CodeQL: resultados serão vinculados no PR após sua execução. Não há autorização de merge ou publicação automática.

## Comparativos

Capturas reais, sem alterar conteúdo ou gerar mídia fictícia. WebP quality 78 conserva dimensões originais; PNGs completos ficam nos artefatos de QA. Um canvas fixo aparece em seu viewport: as capturas de Método/rodapé demonstram continuidade, enquanto uma screenshot única de página inteira não demonstra movimento.

| Viewport | Antes | V2.1 |
| --- | --- | --- |
| 1366 × 768 | [HERO](./evidence/before-1366x768-hero.webp) | [HERO](./evidence/after-1366x768-hero.webp) |
| 1440 × 900 | [HERO](./evidence/before-1440x900-hero.webp) | [HERO](./evidence/after-1440x900-hero.webp) |
| 1920 × 1080 | [HERO](./evidence/before-1920x1080-hero.webp) | [HERO](./evidence/after-1920x1080-hero.webp) |
| 768 × 1024 | [HERO](./evidence/before-768x1024-hero.webp) | [HERO](./evidence/after-768x1024-hero.webp) |
| 360 × 800 | [HERO](./evidence/before-360x800-hero.webp) | [HERO](./evidence/after-360x800-hero.webp) |
| 390 × 844 | [HERO](./evidence/before-390x844-hero.webp) | [HERO](./evidence/after-390x844-hero.webp) |
| 430 × 932 | [HERO](./evidence/before-430x932-hero.webp) | [HERO](./evidence/after-430x932-hero.webp) |

| Jornada/case | Antes | V2.1 |
| --- | --- | --- |
| Método desktop | [Antes](./evidence/before-1440x900-method.webp) | [Depois](./evidence/after-1440x900-method.webp) |
| Método mobile | [Antes](./evidence/before-390x844-method.webp) | [Depois](./evidence/after-390x844-method.webp) |
| Fechamento desktop | [Antes](./evidence/before-1440x900-closing.webp) | [Depois](./evidence/after-1440x900-closing.webp) |
| Fechamento mobile | [Antes](./evidence/before-390x844-closing.webp) | [Depois](./evidence/after-390x844-closing.webp) |
| K.L desktop | [Antes](./evidence/before-1440x900-kl.webp) | [Depois](./evidence/after-1440x900-kl.webp) |
| Açaí mobile | [Antes](./evidence/before-390x844-acai.webp) | [Depois](./evidence/after-390x844-acai.webp) |
| Ripamonti mobile | [Antes](./evidence/before-390x844-ripamonti.webp) | [Depois](./evidence/after-390x844-ripamonti.webp) |

[Partículas](./evidence/after-1440x900-particles.webp) · [Ondas → vitrine](./evidence/after-1440x900-waves.webp)

## Limitações / aceite

Sem certificação de GPU/Safari/iPhone físico, leitor de tela humano, saída física de áudio ou WhatsApp enviado. A evidência local usa o fallback aprovado; WebGL e segurança são verificados no CI. Pesquisa Refero live bloqueada pela assinatura; utilizado documento fornecido e o alvo aprovado. A nova camada tem custo de atividade após o HERO, explicitado acima.

**Aguardar aprovação visual e funcional de Alexandre. Manter rascunho, sem merge e sem publicação.**
