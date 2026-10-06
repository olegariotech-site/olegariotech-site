# OT — correções multidispositivo, 06/10/2026

Base: `main`, commit `81170fa3dc51d0215254602b3682c621aa32c0ce`, versão publicada pelo PR #81. Branch nova: `fix/ot-cross-device-polish-20261006`. Novo PR somente para revisão visual; sem merge, publicação ou configuração de Pages.

## Método: investigação e correção

A implementação mantinha oito blocos no DOM: quatro cards canônicos em HTML e quatro itens de accordion gerados no script inline. As regras mobile antigas ocultavam o grid e exibiam o accordion; a camada imersiva reativava o grid e ocultava o accordion. `ot-v2.js`, carregado por uma cadeia assíncrona, ainda reescrevia ambos. `ot-digital-pulse.js` envolvia o grid em `.method-scene` para acrescentar a ilustração.

Na reprodução automatizada da base, os oito blocos existiam, mas apenas quatro estavam visíveis. A sequência específica “02 Diagnóstico” relatada no aparelho físico não foi reproduzida; não há evidência suficiente para atribuí-la a cache ou a uma ordem particular de carregamento. O conflito estrutural confirmado foi eliminado: não há mais markup, gerador, dados paralelos, handlers ou regras de alternância para o accordion do Método, nem reescrita tardia de suas etapas. Os quatro cards do HTML são a única representação em qualquer breakpoint. A ilustração e o pulse existentes continuam sobre esse mesmo grid. O SVG mobile recebe limite de altura para não invadir a leitura dos cards.

Sequência única: **01 Diagnóstico → 02 Direção → 03 Implantação → 04 Presença contínua**.

## Header, navegação e ritmo

- Desktop: superfície escura de 88–94% de opacidade, blur de 14px e linha discreta; altura e lateral fina mantidas. A âncora usa a altura renderizada mais 16px; o probe do scrollspy tem 32px para acomodar os 12px de compactação durante uma navegação iniciada no topo; root scroll padding e section scroll margin não repetem a mesma reserva.
- Scrollspy: remove ordem antiga hardcoded e estilo que sempre sublinhava Início. Lê a ordem atual do DOM, retângulos na viewport e a altura real do header. Atualiza classe/ARIA por scroll, resize, carregamento de fontes e resize do conteúdo. Se a seção não possui destino no menu, não marca falsamente Início.
- Mobile: header 72→60px, mais safe area, mantendo logo, áudio e WhatsApp com alvos de 44px. Histerese (>96px / <24px) e transição de 220ms; sem transição em reduced motion. O padding da página mantém a altura expandida e evita salto.
- Projetos→Soluções: vazio entre áreas de 176→120px no desktop (-32%) e 126→78px no mobile (-38%).
- Delivery→Método: 174→118px no desktop grande (-32%), 140→88px no mobile (-37%). Método, Sobre e FAQ: padding externo 96→64px no desktop grande, 68→48px em notebook de até 800px de altura e 56→40px até 680px; mobile 70→44px. Ecossistema e teaser de produtos, já compactos, preservados. Espaçamento interno dos conteúdos preservado.
- Bottom nav: 66px + safe inset; reserva de scroll, margem de foco e footer com 24px extras. Remove reserva duplicada de body+footer. A regra final ganha especificidade suficiente para a folha de footer carregada depois. O token da lateral também tem prioridade sobre o breakpoint antigo de 901–1080px, evitando retornar a uma largura de sidebar no tablet e na rotação.
- Rails: 12px de gap, 4px de padding, snap proximity, overscroll contido, card `100% - 44px` e peek de 32px. Projetos reais e conceitos têm labels fixos acima de seus próprios rails. Teclado de tabs existente preservado.
- Overflow real mobile: os labels de acessibilidade absolutos das tabs tinham containing block fora do scrollport; ancorá-los a cada botão com `position:relative` evita ampliar a layout viewport mobile (1104px em uma tela CSS de 390px na reprodução). O teste agora compara `scrollWidth` com `clientWidth` e `innerWidth`.
- Título de Projetos: especifica clipping de gradiente no texto também em mobile, evitando fundo retangular causado pela regra antiga de `background-clip:border-box`.

## Preservação

Earth geometry, shaders, iluminação, texturas, nuvens, luzes, atmosfera, assets, partículas e ordem das áreas não foram alterados. O detalhe do highlight permaneceu legível nas capturas; não foi necessário reduzir bloom. A composição Android validada por Alexandre foi mantida.

A lógica inteira de áudio, seus controles e `/assets/audio/background.mp3` são idênticos à base. Dados comerciais de Soluções e Projetos e o bloco de metadados SEO/Schema/OG são idênticos à base. Nenhuma modificação em analytics/Meta Pixel, consentimento, políticas, telefone, links, depoimentos, domínio ou GitHub Pages.

## QA

Fluxo: abrir a home → navegar por scroll, âncoras e menus → trocar todos os cases → usar áudio → conferir Método, safe areas e footer.

Playwright regular: Browser plugin not available. Servidor estático local em `http://127.0.0.1:4173`, com o conteúdo da nova branch. Fontes públicas transportadas pelo host para contornar a restrição de rede do navegador, sem mudar os arquivos do site. Chromium 153 (binário oficial Sparticuz) e Playwright WebKit 26.5 em Linux. Dependências de QA ficam fora do repositório. Nas capturas WebKit, a preparação de screenshots do Playwright injeta uma folha de estilo e fazia o motor retornar ao fragmento da última âncora; depois de testar a navegação, o script de QA limpa apenas esse fragmento com `history.replaceState` antes da captura. Nenhum CSS, asset, renderer ou comportamento do site é substituído para produzir os prints. A rolagem e a geometria são conferidas antes e depois das capturas.

Matriz final: **15 cenários aprovados**, mais uma execução adicional WebKit 390px com WebGL indisponível, aprovando o fallback Canvas2D existente. Uma rodada ampla foi seguida por reexecuções dos casos que revelaram conflitos; os resultados abaixo incorporam as correções finais.

| Motor / condição | Tamanhos | Resultado |
| --- | --- | --- |
| Chromium desktop | 1920×1080, 1440×900 | Aprovado |
| Chromium notebook | 1366×768, 1366×720, 1366×612 | Aprovado |
| Chromium tablet | 1024×768 | Aprovado; lateral fina confirmada após corrigir o token antigo |
| Android emulado Chromium | 360×780, 390×844, 412×915, 430×932 | Aprovado; portrait e rotação, com retorno ao tamanho original |
| Reduced motion | 1440×900, 390×844 | Aprovado; fallback fotográfico e compactação sem transição |
| iOS/WebKit simulado | 375×812, 390×844, 430×932 | Aprovado; teste físico pendente |

Checks: resposta HTTP 200 e título correto; conteúdo significativo; ausência de overlay; nenhum erro relevante de console/runtime; nenhum overflow involuntário; exatamente quatro cards do Método no DOM visível, com rótulos corretos; separação do header e zona segura de âncoras; scrollspy no scroll lento/rápido, clique e retorno ao topo; Tab/focus e setas de tabs; seis cases, depoimentos e CTAs; MP3 após clique/toque, opt-in, mute, resume e sincronização; handler de visibilidade; header compacto sem salto; quatro rails com gap/peek/snap; safe insets top/bottom; footer livre da bottom nav; suporte a svh/dvh e viewport resize; Earth com a mesma geometria e reserva fotográfica.

No WebKit headless, algumas capturas posteriores à reinjeção de stylesheet omitiram o canvas WebGL estático. A captura entregue mostra a primeira viewport realmente renderizada; o fallback Canvas2D foi validado separadamente, incluindo navegação, áudio, rotação e footer, sem mudar o código de produção. A confirmação visual após uso prolongado em Safari/iPhone físico continua pendente.

Após o teste de referência sem âncora, a imagem da Terra e a rolagem WebKit também foram conferidas diretamente. O problema dos prints que retornavam ao topo foi isolado à preparação da captura com fragmento de âncora e resolvido no transporte de QA descrito acima, sem alterar o site.

Comandos principais: `node --check` dos scripts alterados/inline; `git diff --check`; Playwright em script temporário `qa-polish.cjs`, mais captura focada de depoimentos em notebook 1366×612 e das quatro etapas em Android 390px. Capturas finais: desktop 1440×900, notebook 1366×768, Android 390×844 e WebKit 390×844. Registros e prints ficam fora do repositório.

Limites: Android é emulação Chromium nesta etapa; o teste físico anterior foi informado por Alexandre. **iOS/WebKit simulado — teste físico pendente**. Insets de 47px/34px são injetados nos tokens para exercitar geometria; viewport resize representa mudanças de espaço disponível, mas não certifica notch/Dynamic Island, Home Indicator ou barras do Safari em hardware real. Pause/resume por visibilidade testa o handler com eventos e estado `document.hidden` controlados, além de reprodução real do MP3 no motor; saída física de áudio não é medida.

As oito lições próprias OT constam em `docs/design-system/patterns.md` e são vinculadas por `DESIGN.md`. Capturas e scripts temporários de QA ficam fora da árvore de produção.
