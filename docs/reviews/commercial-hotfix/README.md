# OT — refinamento de privacidade e exemplos de anúncios

Missão: 17/11/2026. Base publicada confirmada: `7dfb0eeaccccfa63fe6f305f19c04884dcd62c30`, merge do PR #128. Branch `fix/commercial-privacy-ads-20261117`. Somente auditoria, implementação e homologação; sem publicação automática.

## Auditoria e decisão visual

As capturas da direção mostram o controle de privacidade como engrenagem e os dois cards abstratos de publicidade. O código confirma que o botão nativo é criado por `ot-analytics-core.js`, com texto e nome acessível corretos. A aparência de engrenagem vem do CSS comercial e de uma regra antiga local de Anúncios. O módulo mobile compartilhado já encurta esse texto para “Privacidade” até 900px; esse comportamento e o nome acessível completo são preservados. O consentimento é compartilhado com a home e outros serviços: alterar seu módulo causaria impacto fora da missão.

1. **Privacidade — recomendação visual/comercial:** mostrar o texto nativo “Privacidade e cookies” com escudo vetorial decorativo, fundo escuro e borda ciano. O mecanismo, nome acessível, foco, categorias e política são preservados. Não há nova biblioteca ou script público.
2. **Posicionamento — proteção de leitura:** abaixo de 1600px, usar o espaço de 76px já reservado no rodapé. A pílula permanece no fluxo, abaixo dos links, sem cobrir formulários ou CTAs. Em telas a partir de 1600px, a margem externa comporta o controle fixo sem ocupar a coluna de conteúdo. Essa decisão troca a presença flutuante permanente no mobile por uma utilidade explícita e segura no rodapé; a política permanece nos links existentes.
3. **Anúncios — recomendação comercial:** preservar integralmente o HERO principal, seu texto e os dois CTAs. Apenas o bloco visual mostra a mesma empresa fictícia nos contextos de busca e descoberta. A pesquisa usa uma necessidade local concreta; o Instagram usa composição editorial e um utilitário vetorial desenhado para a peça. O percurso Anúncio → Página profissional → WhatsApp une os exemplos.
4. **Transparência:** “ROTA 019” é uma empresa fictícia; `rota019.example` é texto de demonstração, sem link. Os exemplos não são réplicas funcionais de plataformas, não têm controles falsamente clicáveis, resultados, métricas, preço ou promessa de conversão. Cases e depoimentos reais fora do HERO ficam intocados.

Em telas pequenas, os cards empilham para conservar legibilidade. Não são carregadas fotos, fontes, bibliotecas ou scripts adicionais. O escudo e o veículo são vetores inline; não representam anúncios reais.

## Escopo protegido

Dois arquivos de produção mudam:

- `assets/css/ot-commercial-premium.css`: aparência e posição da utilidade opt-in das cinco páginas; estilos do exemplo restritos ao body de Anúncios.
- `anuncios-google-instagram/index.html`: substituição dos dois exemplos genéricos pelo conjunto ilustrativo. Metadados, schemas, H1, conteúdo principal, links e CTAs não mudam.

Home e todos os seus assets, Analytics, Pixel, consentimento, Diagnóstico, demais HTMLs, OGs, kit, robots e sitemap ficam byte a byte iguais à publicação. PR #125 permanece independente (HEAD auditado `a30337c469a452d682620ba0d19116978aab4c08`); Issue #126 continua aberta. Nenhuma alteração de semântica de lead: clique não confirma conversa.

## Contratos e testes

O contrato publicado do PR #128 congelava exatamente o antigo HERO e CSS. Mantemos seus baselines `2d6873b`/`fb57fb8`, as 45 alterações históricas e as 86 mutações de rejeição. A extensão pós-publicação enumera somente os novos fragmentos em [approved-visual-hotfix.json](approved-visual-hotfix.json), ancorados à publicação `7dfb0ee`.

O verificador adicional exige identidade de **329 arquivos existentes**, além de **cinco arquivos com alterações delimitadas** (dois de produção e três testes). Também rejeita dez mutações novas, incluindo consentimento concedido por padrão, rastreador, resultado inventado, mudança de WhatsApp, ocultação do botão e edição da home. Não há nova referência baseada no candidato, normalização genérica, exclusão de teste, aumento de tolerância ou `continue-on-error`.

As asserções antigas de engrenagem sem texto são substituídas por verificações de rótulo legível, escudo, área de toque, ausência da engrenagem, espaço no rodapé e abertura real do painel. Todos os demais cenários continuam.

Workflow adicional: `OT published commercial hotfix QA`, Chromium e WebKit, com comparação obrigatória contra checkout separado de `7dfb0ee`. Cobre 24 combinações de página/viewport por motor, consentimento pelo painel real, teclado/foco, política, axe, contraste, cards, CTAs, movimento reduzido e overflow. Os workflows existentes permanecem aplicáveis e integrais.

Performance: três amostras frias alternadas antes/depois por página em 390px e 1440px no Chromium, sem forçar lazy images. Registrar LCP, CLS, DOM, fontes, recursos/bytes e imagens. O limite CLS permanece 0,1; uma nova transferência de imagem inicial reprova. LCP deve ser analisado pelo resultado medido, sem afirmar ausência de regressões por inspeção de código.

## Evidências e limites

O workflow guarda capturas antes/depois de privacidade em 390/1440/1920px, painel aberto, HERO e detalhe dos cards em 390/1440px, além de `report-chromium.json` e `report-webkit.json`. Resultados definitivos do HEAD, links dos workflows/artefatos, inspeção visual e GO/NO-GO serão registrados na descrição do único PR draft desta missão.

Preparação local: verificação de escopo e sintaxe executadas. A tentativa de Chromium local foi bloqueada na inicialização por restrição de socket do runtime; não conta como navegador aprovado. A homologação real usa os motores instalados nos runners existentes do GitHub. Medições locais de CI não certificam dispositivos físicos, UI do Safari, INP ou Core Web Vitals de usuários reais.

Manter o PR em draft. Homologação técnica não autoriza merge, produção, campanha, contratação ou custo.
