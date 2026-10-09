# OT Premium V2.2 — Cosmic Continuum · revisão do PR #94

Prévia em rascunho, empilhada sobre o PR #93. Sem merge/publicação. `main` permanece em `cef32459b58c3ce779e526a4e6ef7b76e74f8c67`; base V2.1 `3c5a507807874e7a95f6b51085bd521668210ac0`. Cabeça funcional testada: `a1a4057863ba741d392a70999f10ca1646b28d61`. A aprovação visual/funcional de Alexandre permanece pendente.

## Resultado e decisões finais

A atmosfera existente liga a Terra original a curvas fotográficas discretas nos intervalos e a uma galáxia nebular assimétrica no fechamento. Uma Terra reconhecível cresce e depois ocupa um ponto menor em profundidade; permanece visível, sem portal, buraco negro, sucção ou giro acelerado. A paleta, fontes e conteúdo comercial OT continuam à frente.

A galáxia é procedural e preparada em cache **somente perto do fechamento**, invalidada em resize. Reutiliza o bitmap aprovado da Terra já carregado no DOM; nenhum novo asset de produção, textura de terceiros, framework, serviço ou shader. Mesmo canvas atmosférico V2.1, mesmo relógio e evento `ot-earth-visibility`, sem listener adicional de scroll. As âncoras vêm da geometria real da página, inclusive após troca/expansão dos cases.

No desktop, o espaço cinematográfico fica antes dos textos do rodapé. Mobile/tablet recebem composição própria após seus links. O espaço é reservado desde a primeira pintura; a narrativa não altera a altura durante o scroll. Zonas de leitura recebem atenuação com bordas suaves. As aparições parciais são raras, nas passagens após Projetos e Método.

[Gate A / storyboard anterior ao código](GATE-A.md) · [Auditoria de preservações](SCOPE-AUDIT.json)

## Vídeos nativos e timecodes

[Desktop 1440 × 900 · 58,017 s](evidence/desktop/ot-v22-1440x900.mp4) · [Mobile 390 × 844 · 58,000 s](evidence/mobile/ot-v22-390x844.mp4)

Gravações X11 do navegador real, movimento habilitado. Nenhuma aceleração, montagem de cenas, alteração de CSS da aplicação ou da timeline. A codificação/muxagem preserva o tempo nativo e inclui o stream de áudio decodificado do elemento aprovado. Mobile usa emulação explícita de viewport/touch: **390 × 844 em todas as amostras**. A primeira captura mobile foi substituída após detectar reajuste da janela Linux; os arquivos atuais já contêm a captura corrigida.

O desktop observa **26 poses reais crescentes**, com rotação inicial de **32,86°**. A rotação nominal original de 42 s permanece no código; renderização por software pode ficar mais lenta, sem compensação artificial. No mobile, a Terra fotográfica estática e a ausência de morph/rotação são o comportamento original aprovado.

| Timecode nativo desktop | Evidência real |
| --- | --- |
| [00:03](evidence/desktop/frames/native-3s.jpg) | Terra original e HERO; áudio ativado. |
| [00:09](evidence/desktop/frames/native-9s.jpg) | Dissolução em partículas continentais. |
| [00:12](evidence/desktop/frames/native-12s.jpg) | Ondas originais e entrada da vitrine. |
| [00:18](evidence/desktop/frames/native-18s.jpg) | K.L Transporte. |
| [00:22](evidence/desktop/frames/native-22s.jpg) | Açaí do Dudu. |
| [00:26](evidence/desktop/frames/native-26s.jpg) | Armazém Ripamonti, imagem real e depoimento. |
| [00:39](evidence/desktop/frames/native-39s.jpg) | Continuidade e curva terrestre depois de Método. |
| [00:46](evidence/desktop/frames/native-46s.jpg) | CTA comercial e início da revelação galáctica. |
| [00:51](evidence/desktop/frames/native-51s.jpg) | Terra em aproximação, maior. |
| [00:57](evidence/desktop/frames/native-57s.jpg) | Terra menor integrada ao fechamento, ainda visível. |

Mobile: [Terra 00:09](evidence/mobile/frames/native-9s.jpg), [aproximação 00:51](evidence/mobile/frames/native-51s.jpg), [integração 00:57](evidence/mobile/frames/native-57s.jpg). Os horários do operador no JSON são diferentes do timecode por um breve lead-in do gravador; a tabela acima foi conferida nos frames extraídos do filme.

Áudio: MP3 original, loop, playback/sinal real e avanço do relógio verificados. Volume do elemento **0,25 desktop / 0,18 mobile**, botões/ARIA preservados; segundo clique pausa/muta. [Dados desktop](evidence/desktop/report.json) · [Dados mobile](evidence/mobile/report.json). Captura do stream não certifica ganho de saída nem alto-falante físico.

## Comparativos da home completa

Sem protótipo isolado como evidência de performance. Cada imagem abaixo é captura real da home correspondente, sem montagem dentro da interface.

| Recorte | Main publicada | V2.1 / PR #93 | V2.2 |
| --- | --- | --- | --- |
| HERO desktop | [Antes](evidence/visual/chromium-1440x900-main-hero.png) | [Base](evidence/visual/chromium-1440x900-v21-hero.png) | [Depois](evidence/visual/chromium-1440x900-v22-hero.png) |
| Projetos desktop | [Antes](evidence/visual/chromium-1440x900-main-projects.png) | [Base](evidence/visual/chromium-1440x900-v21-projects.png) | [Depois](evidence/visual/chromium-1440x900-v22-projects.png) |
| Método desktop | [Antes](evidence/visual/chromium-1440x900-main-method.png) | [Base](evidence/visual/chromium-1440x900-v21-method.png) | [Depois](evidence/visual/chromium-1440x900-v22-method.png) |
| HERO mobile | [Antes](evidence/visual/chromium-390x844-main-hero.png) | [Base](evidence/visual/chromium-390x844-v21-hero.png) | [Depois](evidence/visual/chromium-390x844-v22-hero.png) |
| Projetos mobile | [Antes](evidence/visual/chromium-390x844-main-projects.png) | [Base](evidence/visual/chromium-390x844-v21-projects.png) | [Depois](evidence/visual/chromium-390x844-v22-projects.png) |
| Método mobile | [Antes](evidence/visual/chromium-390x844-main-method.png) | [Base](evidence/visual/chromium-390x844-v21-method.png) | [Depois](evidence/visual/chromium-390x844-v22-method.png) |

| Resolução | Curva terrestre | Antes da revelação | Aproximação | Integração final |
| --- | --- | --- | --- | --- |
| 1366 × 768 | [Imagem](evidence/visual/chromium-1366x768-partial-earth.png) | [Imagem](evidence/visual/chromium-1366x768-galaxy-before.png) | [Imagem](evidence/visual/chromium-1366x768-galaxy-approach.png) | [Imagem](evidence/visual/chromium-1366x768-galaxy-integrated.png) |
| 1440 × 900 | [Imagem](evidence/visual/chromium-1440x900-partial-earth.png) | [Imagem](evidence/visual/chromium-1440x900-galaxy-before.png) | [Imagem](evidence/visual/chromium-1440x900-galaxy-approach.png) | [Imagem](evidence/visual/chromium-1440x900-galaxy-integrated.png) |
| 1920 × 1080 | [Imagem](evidence/visual/chromium-1920x1080-partial-earth.png) | [Imagem](evidence/visual/chromium-1920x1080-galaxy-before.png) | [Imagem](evidence/visual/chromium-1920x1080-galaxy-approach.png) | [Imagem](evidence/visual/chromium-1920x1080-galaxy-integrated.png) |
| 768 × 1024 | [Imagem](evidence/visual/chromium-768x1024-partial-earth.png) | [Imagem](evidence/visual/chromium-768x1024-galaxy-before.png) | [Imagem](evidence/visual/chromium-768x1024-galaxy-approach.png) | [Imagem](evidence/visual/chromium-768x1024-galaxy-integrated.png) |
| 360 × 800 | [Imagem](evidence/visual/chromium-360x800-partial-earth.png) | [Imagem](evidence/visual/chromium-360x800-galaxy-before.png) | [Imagem](evidence/visual/chromium-360x800-galaxy-approach.png) | [Imagem](evidence/visual/chromium-360x800-galaxy-integrated.png) |
| 390 × 844 | [Imagem](evidence/visual/chromium-390x844-partial-earth.png) | [Imagem](evidence/visual/chromium-390x844-galaxy-before.png) | [Imagem](evidence/visual/chromium-390x844-galaxy-approach.png) | [Imagem](evidence/visual/chromium-390x844-galaxy-integrated.png) |
| 430 × 932 | [Imagem](evidence/visual/chromium-430x932-partial-earth.png) | [Imagem](evidence/visual/chromium-430x932-galaxy-before.png) | [Imagem](evidence/visual/chromium-430x932-galaxy-approach.png) | [Imagem](evidence/visual/chromium-430x932-galaxy-integrated.png) |

## Performance e causa do CLS

**120 cargas frias**: cinco por versão × desktop/mobile × motion/reduced × WebGL/Canvas2D, em jobs independentes. Homes completas, mesmo Chromium/transporte HTTP, consentimento negado, sem throttling e sem suite concorrente na máquina da medição. Fontes reais; cada deslocamento registra horário, nós/fontes e retângulos anterior/atual. As versões são alternadas, com cache do contexto de navegador frio.

A causa dominante era `.earth-journey__orbits` e seu pseudo-elemento. No WebGL mobile, uma amostra atribui **0,36755** ao reposicionamento inicial desses anéis; na V2.2 essa fonte desaparece. A caixa agora tem dimensão-base estável, e a mesma geometria visual é reproduzida por `transform`. Não esconder anéis, não ativar reduced motion para melhorar o resultado, não filtrar esse deslocamento do CLS. Os deslocamentos residuais pequenos apontam refinamento do cabeçalho/fontes, ainda presentes na base.

Medições abaixo: medianas de cinco, LCP em ms; todos os CLS individuais V2.2 ficam **<0,009**, abaixo do alvo 0,10.

| Renderer / condição | LCP main → V2.1 → V2.2 | CLS main → V2.1 → V2.2 |
| --- | --- | --- |
| WebGL · desktop · motion | 204 → 212 → 212 | 0,05680 → 0,05680 → 0,00437 |
| WebGL · mobile · motion | 204 → 208 → 212 | 0,36975 → 0,36975 → 0,00892 |
| WebGL flags · desktop · reduced (estático) | 208 → 200 → 204 | 0,00437 → 0,00437 → 0,00437 |
| WebGL flags · mobile · reduced (estático) | 200 → 200 → 204 | 0,00733 → 0,00733 → 0,00733 |
| Canvas2D · desktop · motion | 248 → 248 → 264 | 0,05680 → 0,04433 → 0,00387 |
| Canvas2D · mobile · motion | 200 → 188 → 188 | 0,36303 → 0,36975 → 0,00757 |
| Canvas2D flags · desktop · reduced (estático) | 248 → 248 → 248 | 0,00437 → 0,00387 → 0,00437 |
| Canvas2D flags · mobile · reduced (estático) | 200 → 204 → 204 | 0,00733 → 0,00733 → 0,00733 |

Incremento de produção **6.991 bytes / 6,83 KiB** sobre V2.1; corpos codificados medidos aumentam pelo mesmo valor, sem imagem adicional. Sobre main, V2.1 + V2.2 somam 11.415 bytes. Exemplo WebGL: desktop 2.717.107 → 2.721.531 → 2.728.522 bytes; mobile 2.065.385 → 2.069.809 → 2.076.800. Soma de encodedBodySize no Resource Timing, sem cabeçalhos; HTTP local sem compressão. Não é peso total de rede/CDN nem field.

| Custo final com motion | V2.1 → V2.2 | Observação |
| --- | --- | --- |
| P95 de submissão JS · WebGL desktop | 5,2 → 5,8 ms | Bitmap já em cache; não mede raster GPU. |
| P95 de submissão JS · WebGL mobile | 1,0 → 1,5 ms | Camada compacta. |
| P95 de submissão JS · Canvas2D desktop | 1,6 → 1,8 ms | Incremento 0,2 ms. |
| P95 de submissão JS · Canvas2D mobile | 1,0 → 1,1 ms | Incremento 0,1 ms. |
| Pinturas/s · WebGL desktop/mobile | 18,33/12,5 → 19,17/12,5 | Limites 20/12,5 respeitados. |
| Event Timing mediano · WebGL desktop/mobile | 40/32 → 40/32 ms | Não é INP de campo. |
| Event Timing mediano · Canvas2D desktop/mobile | 48/32 → 56/40 ms | Variação +8 ms, reportada. |
| Projeto pronto · WebGL desktop/mobile | 102,4/83,7 → 106,7/83,0 ms | Click até renderer pronto; mediana das trocas. |

Regressões pequenas reportadas: LCP +16 ms no Canvas2D desktop; +4 ms no WebGL mobile; submissão +0,1–0,6 ms; Event Timing +8 ms no fallback. Maior long task WebGL desktop: main 320 ms, V2.1 232 ms, V2.2 261 ms. Na V2.2, esse máximo já está no snapshot inicial, antes de criar a galáxia; não é custo da criação final. Save-Data/memória limitada/reduced não mantêm loop atmosférico; pintura/s reduzida medida = 0.

[Resumo com todas as amostras individuais](PERFORMANCE-SUMMARY.json) · [Raw WebGL](evidence/performance/ot-v22-performance-webgl/performance-webgl.json) · [Raw Canvas2D](evidence/performance/ot-v22-performance-canvas2d/performance-canvas2d.json) · [Run imutável de performance](https://github.com/olegariotech-site/olegariotech-site/actions/runs/37945899072)

## Testes e segurança

Status dos workflows da cabeça final será atualizado ao encerrar a execução. Não há recomendação de publicação automática.

Cobertura executada: sete resoluções; seis projetos e trocas rápidas; Website/Identidade, Desktop/Mobile e expansão; conteúdos/depoimentos/disclosure; teclado/foco; atalhos diretos, scroll inverso, resize/orientação e retorno ao topo; fotografia bloqueada/recuperação; motion dinâmico, Save-Data/memória baixa, pausa/reentrada; HERO/Terra/áudio; soluções/Método/navegação; links, mensagens WhatsApp, consentimento/analytics sem duplicação; console/404/overflow. Suite local V2.2: sete viewports, três atalhos, 18 comparativos, aprovada. Evidência CI da composição: [report](evidence/visual/report.json).

Os testes de rotação observam três poses reais crescentes dentro de dez segundos, acomodando startup do SwiftShader; não mudam velocidade, renderer nem a exigência de movimento real. O teste de fotografia bloqueada aguarda a montagem comercial/stylesheet/fontes/captura selecionada enquanto a fotografia continua retida, depois verifica cena/CTA e recuperação da imagem. A rodada anterior do WebKit excedeu o prazo no cenário de fotografia retida. O teste agora carrega explicitamente as fontes comerciais com prazo de 15 s, sem depender do evento load bloqueado pela imagem; libera a rota em finally, inclusive em caso de falha. Nenhum desses waits entra na medição do CLS.

## Arquivos e preservações

| Arquivos do PR #94 | Justificativa |
| --- | --- |
| `assets/js/ot-cosmic-scene.js` | Narrativa no canvas/relógio existente, cache procedural, fotografia reutilizada, leitura e âncoras reais. |
| `assets/css/ot-atmosphere.css` | Anéis em transform e espaço responsivo estável para a galáxia; skin legado do rodapé protegido. |
| `index.html` | Somente versões de cache dos dois recursos. |
| `scripts/measure-continuum.mjs` | Medições de três homes, cinco cargas por condição e atribuição de cada shift. |
| `scripts/verify-continuum.mjs` | Jornada, pixels, âncoras, scroll inverso, orientação, imagens tardias e evidências. |
| `scripts/verify-atmosphere.mjs` | Contagem de pinturas completas e espera por poses reais de rotação. |
| `.github/workflows/showroom-integration-qa.yml` | Suites existentes e nova jornada; medições separadas por renderer. |
| `.github/workflows/codeql.yml` | Inclui a base empilhada V2.1 no trigger de PR. |
| `docs/reviews/ot-premium-v22/GATE-A.md`, `README.md` | Auditoria anterior ao código e decisões iniciais. Relatório/evidências finais ficam na branch de revisão. |

Renderer e timeline originais da Terra, HERO, áudio, catálogo/copy dos seis projetos, cinco cases reais, demonstração Navalha, Solução 03/Ripamonti, WhatsApp/contextos, depoimentos, navegação, FAQ/Método, consentimento/GA4, SEO/metadados, 404 e sitemap preservados. Auditoria confirma quinze arquivos protegidos byte-idênticos e nenhum diff de produção entre o commit dos vídeos `7cd1710`, das medições `c73b920` e a cabeça final `a1a4057`; os commits posteriores ajustaram apenas os testes. O PR #93 permanece intacto.

## Limitações e aprovação

Linux/Playwright e WebGL por software não certificam GPU de cliente, Safari/iPhone físico ou saída do alto-falante. Performance é laboratório da home completa, não field INP. Links externos e eventos reais são exercitados com destinos interceptados, sem enviar WhatsApp nem contaminar GA4. A camada atmosférica é decorativa; conteúdo comercial continua sendo a prioridade e o fallback comercial permanece acessível.

A geometria protegida do HERO permanece igual à base: no desktop, o cabeçalho fixo pode cobrir a borda superior da esfera. Isso não foi alterado para a gravação nem corrigido nesta camada. O PR continua em rascunho; a revisão visual/funcional e a ordem de integração com o PR #93 dependem da aprovação expressa de Alexandre.
