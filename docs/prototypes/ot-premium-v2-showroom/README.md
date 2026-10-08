# OT Premium V2 — showroom isolado para aprovação visual

**Gate A · PR em rascunho · sem publicação ou integração.** Um website real domina o palco; um índice compacto conduz pelos cinco clientes, com Navalha Prime separado como **Conceito OT**. A direção B governa a composição; A contribui somente com a descoberta visual e a continuidade de atmosfera.

Base conferida: `main` em `4f2550af3e0211b54d4694de6d2e6fce80442dfd`, PR #89 publicado. Os dois documentos enviados foram lidos integralmente, assim como `DESIGN.md` e `docs/design-system/*`. Nenhum arquivo existente de produção foi modificado. A lista completa está em [FILES.md](FILES.md).

## Abrir a demonstração

Na raiz do checkout desta branch:

```bash
python3 -m http.server 4173 --bind 127.0.0.1
```

Abra `http://127.0.0.1:4173/docs/prototypes/ot-premium-v2-showroom/`. O link da barra superior abre a home inalterada do mesmo checkout para comparação. Não é uma URL publicada; Pages permanece na `main`.

Para uma demonstração autônoma que abre diretamente no navegador, inclusive sem servidor:

```bash
node docs/prototypes/ot-premium-v2-showroom/bundle.mjs
```

Abra o arquivo gerado `preview-offline.html`. Ele incorpora mídias e fontes, usa o mesmo renderer e catálogo gerado, não carrega analytics e não depende de rede para navegar pelos cases. É um artefato de revisão (~3,6 MB), ignorado pelo Git e reconstruído pelo CI; não faz parte do orçamento de runtime nem de uma proposta de integração. Somente os links externos acionados pelo visitante usam a rede.

## O que revisar

- K.L Transporte Express permanece como destaque inicial **efetivo** da home. O HTML anterior ao JS marca Açaí, mas a inicialização real chama `renderProject('kl')`; essa cadeia foi auditada e preservada. Açaí está acessível pelo primeiro seletor.
- Cinco projetos reais: Açaí do Dudu, K.L Transporte Express, Adega São Marcos, Cíntia Almeida Gomes Advocacia e Armazém Ripamonti. O único conceito é Navalha Prime Experience, com destino e identificação próprios.
- Website desktop em navegador discreto; no celular, screenshot mobile próprio antes da narrativa. Açaí/K.L incluem o HERO completo para não cortar o produto/veículos.
- Alternância Website / Identidade, mais Desktop / Mobile onde há espaço. A opção por alternância evita telas sobrepostas e mantém o nome e os CTAs livres.
- Título, segmento, descrição, desafio, estratégia, entregas, três depoimentos existentes, autoria, fontes e URLs preservados. Nenhuma avaliação foi adicionada a K.L, Adega ou Navalha.
- CTA de seção e dois CTAs de cada case mantêm os textos e destinos aprovados. WhatsApp oficial: `5511912459144`, com a mensagem atual contextualizada pelo nome canônico do projeto.
- Índice horizontal manual com snap/peek, navegação por clique/toque/setas/Home/End, foco visível e estado real/conceito perceptível. A tab inicial aparece integralmente no mobile.
- Troca de case aguarda a imagem sem apagar a história anterior; solicitações antigas não vencem a seleção mais recente. Mesma seleção preserva nós. Um único listener delegado cuida das vistas. Motion 260ms e hover até 2px; reduced motion remove ambos.
- A faixa superior é apenas contexto de revisão, usando o asset estático original da Terra. Não simula uma nova home, não executa shaders, Terra ou áudio e não modifica esses componentes.

## Arquitetura e fonte de conteúdo

`build.mjs` lê o literal JSON `projects` e a chamada de inicialização em `/index.html`. Gera `projects.generated.mjs` e o HTML inicial de K.L; `--check` rejeita snapshots desatualizados. Os dados não têm manutenção editorial paralela. `templates.mjs` serve tanto ao build estático quanto à troca no navegador, com escape de texto/atributos. Um único `tabpanel` recebe a história selecionada; anúncio breve de seleção fica fora do painel para evitar releitura repetitiva.

`assets/media.json` contém **somente descritores de apresentação**. Pares novos foram capturados dos sites publicados; Ripamonti reutiliza os arquivos do PR #89. Thumbnails pequenas derivam dos assets canônicos, sem novo conteúdo fictício. A vista complementar K.L é uma captura da composição aprovada e inalterada de `renderProjectMedia()`.

As fontes são as mesmas famílias aprovadas, em WOFF2 local com licenças OFL. `assets/sources.json` registra URL, viewport, data, dimensões e hash de cada captura. `assets/font-sources.json` registra a origem das fontes. Não há framework, slider, CDN ou dependência nova de produção.

`data-generate-lead` é preservado no HTML, mas o protótipo não carrega GA4/Meta ou consentimento de produção e **não envia eventos**. A ausência de instrumentação é intencional no Gate A. Nenhuma alteração foi feita aos listeners reais; a integração da mensuração requer regressão no Gate B, depois da aprovação visual.

## Evidências

Comparações usam o mesmo primeiro case, K.L, na `main` inalterada e na prévia, capturadas nos mesmos viewports. As imagens completas da seção podem ser mais altas que o viewport declarado; arquivos `viewport-*` mostram o recorte exato da tela. A ordem das colunas nas comparações é **atual → prévia**.

| Evidência | Arquivo |
| --- | --- |
| Comparativo desktop 1440×900 | [comparison-desktop.webp](evidence/comparison-desktop.webp) |
| Comparativo tablet 768×1024 | [comparison-tablet.webp](evidence/comparison-tablet.webp) |
| Comparativo mobile 390×844 | [comparison-mobile.webp](evidence/comparison-mobile.webp) |
| Desktop 1366×768 / 1440×900 / 1920×1080 | [1366](evidence/desktop-1366.webp), [1440](evidence/desktop-1440.webp), [1920](evidence/desktop-1920.webp) |
| Tablet 768×1024 | [tablet-768.webp](evidence/tablet-768.webp) |
| Mobile 360×800 / 390×844 / 430×932 | [360](evidence/mobile-360.webp), [390](evidence/mobile-390.webp), [430](evidence/mobile-430.webp) |
| Segundo case com prova social: Açaí | [Desktop](evidence/second-desktop-acai.webp), [Mobile](evidence/second-mobile-acai.webp) |
| Outro case real: Ripamonti | [Desktop](evidence/ripamonti-desktop.webp), [Mobile](evidence/ripamonti-mobile.webp) |
| Contexto do HERO e palco | [context-desktop.webp](evidence/context-desktop.webp) |
| Foco de teclado | [focus-desktop.webp](evidence/focus-desktop.webp) |
| Recortes exatos desktop e mobile | [Desktop](evidence/viewport-desktop.webp), [Mobile](evidence/viewport-mobile.webp) |
| Dados brutos da validação | [report.json](evidence/report.json) |
| Auditoria de escopo | [scope-audit.json](evidence/scope-audit.json) |
| Decisões e referência travada | [DECISIONS.md](DECISIONS.md) |

## Testes e reprodução

O fluxo verificado é: abrir prévia → K.L renderiza → selecionar cada case → alternar vistas → reabrir/trocar rapidamente → navegar por teclado/toque → abrir projeto/WhatsApp em nova aba.

```bash
node docs/prototypes/ot-premium-v2-showroom/build.mjs --check
node docs/prototypes/ot-premium-v2-showroom/bundle.mjs
# Usa o mesmo runner Playwright 1.62.1 já usado nos workflows da OT.
OT_QA_ENGINES=chromium,webkit node docs/prototypes/ot-premium-v2-showroom/verify.mjs
```

| Checagem | Resultado local |
| --- | --- |
| Identidade da página / conteúdo / ausência de overlay | Aprovado |
| Sete viewports solicitados, todos os seis cases | Aprovado em Chromium |
| Teclado, foco, clique e toque | Aprovado; setas, Home/End, Tab e links |
| Troca rápida, reabertura e mesmas seleções | Aprovado; última solicitação vence |
| Vistas Website/Identidade/Desktop/Mobile | Aprovado; copy e ações não são reconstruídas |
| Imagens, proporção e documento sem overflow | Aprovado; zero imagem 404 |
| Console e exceções | Zero erro no protótipo |
| Reduced motion desktop/mobile | Aprovado; nenhuma animação ativa |
| Zoom CSS 200% / nomes extensos em português | Aprovado nos seis cases |
| HTML inicial com JS desabilitado | K.L, descrição, mídia e CTA disponíveis |
| Artefato offline | Navegação dos seis cases aprovada, inclusive via `file://` |
| Links externos e WhatsApp | 12 aberturas verificadas; URL, mensagem, `noopener` e `window.opener === null` |
| Analytics | Zero requisição externa na prévia; sem eventos em seleção ou vista |
| Integridade de produção | Arquivos existentes intactos; additions somente no diretório de revisão e CI dedicado |

Workflow novo: **Premium V2 isolated preview QA**, com Chromium e WebKit simulados. CodeQL existente permanece inalterado e roda no PR. Logs e resultados finais de CI ficam na descrição do PR.

## Performance: medição delimitada

Três contextos frios por versão e viewport (1440×900 / 390×844), mesmo Chromium/Linux, HTTP local, consentimento negado e movimento reduzido. Sem throttling artificial. `report.json` traz LCP, CLS e corpos transferidos por Resource Timing. Event Timing registra o máximo de duração observado das interações de laboratório; **não é INP de campo**.

Na execução local, a prévia transferiu aproximadamente **21,8 KB de JS**, versus **100,5 KB da home completa**. CLS mediano da prévia ficou abaixo de 0,03. A comparação inclui uma home completa de um lado e uma seção isolada do outro, com fontes externas da home excluídas dos totais de bytes: **não demonstra um ganho da futura home e não dispensa benchmark de integração**. O artefato offline incorpora todos os assets para revisão e não deve ser integrado como runtime.

## Limitações e aprovação

WebKit de CI é simulação em Linux; não certifica Safari/iPhone físicos, pinch zoom ou barras nativas. Zoom local usa CSS 200%, além das resoluções estreitas. Links são interceptados no teste: não houve envio real de WhatsApp nem conversão a servidores GA/Meta. A consulta live Refero não estava disponível por assinatura; a composição usa a direção já aprovada e os guias locais, conforme o ledger.

**Pendente somente o aceite visual de Alexandre para Gate A.** Este PR não autoriza integração, merge ou publicação. Após o aceite, o Gate B terá plano de integração e nova validação de regressão/performance, com autorização separada.
