# OT — unificação comercial premium (candidata)
Data da missão: 16/11/2026, horário de São Paulo.
Base de produção e comparação: `2d6873bffbc66aafd1ff153a0455546b507a9759`.
**NO-GO para merge, produção e mídia paga até concluir a homologação.**

## Limite da evidência nesta sessão
A sessão oferece leitura e escrita do GitHub, mas não disponibilizou shell nem navegador de captura. Esta é uma auditoria do código e uma proposta implementada em branch; não constitui auditoria visual concluída. Nenhuma captura antiga foi usada como evidência atual. As dez fontes SVG são composições de ativos originais, não screenshots de páginas.

O workflow adicional prepara capturas novas, exportação PNG, comparação da base exata e relatórios de testes. Exportação ou teste verde não substitui inspeção visual. Não declarar desempenho preservado, acessibilidade integral nem aprovação estética sem ler os resultados e examinar as capturas.

## Direção visual e prioridades
O ponto de partida é a home e o DESIGN.md já aprovado: fundo #050008, Space Grotesk, Inter, Share Tech Mono, ciano #67e8f9 e violeta #8b5cf6. As páginas de serviço já usam esses fundamentos; não precisam de outra marca nem de um novo motor 3D.

| Prioridade | Evidência do código da base | Proposta implementada para revisão |
|---|---|---|
| P1 | Títulos das páginas locais chegam a 5.7rem; HERO mínimo de 650px; anúncios têm ajustes locais próprios | Escala e espaçamento comuns, com CTA antes da imagem; atmosfera estática reaproveitada |
| P1 | No mobile, a navegação comercial esconde links e deixa só o diagnóstico | Cabeçalho comum, menu nativo details/summary com cinco serviços e Início, Escape e foco |
| P1 | CTA principal genérico para diagnóstico em todos os serviços | WhatsApp principal específico por serviço; diagnóstico secundário com origem conhecida |
| P1 | Diagnóstico usa cabeçalho próprio; footer oculto em desktop; input só com placeholder | Identidade comum, footer visível, label explícito, botão de começar antes do painel |
| P1 | Links diretos de WhatsApp já têm mensagens por página; diagnóstico perde o serviço anterior | Preservar mensagens, propagar UTMs com limites e origem allowlisted; acrescentar só nome público da página à mensagem |
| P2 | Casos reais já presentes nas páginas locais; anúncios não têm prova de infraestrutura | Preservar cases e adicionar nos anúncios dois sites reais, explicitamente sem resultados de mídia paga |
| P2 | Depoimentos reais já publicados na home | Reutilizar literalmente Lucas Mazett e Cíntia Pereira Almeida Gomes, com o mesmo link de avaliações gerais |
| P2 | Processo técnico existe, mas a sequência comercial não é uniforme | Quatro passos de contratação, sem inventar preço ou prazo |
| P2 | Quatro serviços usam a mesma capa OG genérica | Cinco capas específicas e cinco Stories em fontes SVG, com roteiro e exportação PNG auditáveis |

## Antes/depois proposto por página
1. **Home de referência:** somente leitura; HTML, assets e comportamento preservados. Saúde visual: não certificada nesta sessão.
2. **Sites Valinhos:** H1, conteúdo local, casos Armazém/Açaí e SEO preservados. Novo cabeçalho, ritmo, CTA de site, depoimento e contratação. Saúde: candidata, pendente de captura e testes.
3. **Sites Campinas:** conteúdo próprio de serviços/logística e casos K.L/Cíntia preservados. Mesmos componentes, sem homogeneizar os textos das cidades. Saúde: candidata.
4. **Google/SEO:** preservar case K.L em destaque, dois complementares e diferenças entre Perfil da Empresa e SEO. CTA específico e identidade comum. Saúde: candidata.
5. **Anúncios:** preservar mockups rotulados como ilustrativos, regras de verba/gestão e ausência de garantia. Cases adicionais comprovam sites, não campanhas. Saúde: candidata.
6. **Diagnóstico:** manter cinco perguntas, resultado e mensagem com respostas. Acrescentar label, origem pública e identidade; scroll respeita movimento reduzido. Saúde: candidata; Issue #126 permanece aberta.

## Marca e ativos
- Logo fonte: `assets/img/brand/olegario-tech-logo-oficial.webp`, SHA `679f87403eb8cdaa16b8ae0364e61551093a7727`.
- O arquivo original tem grandes margens pretas. `ot-logo-commercial.svg` é um invólucro com viewBox que enquadra a imagem original embutida. Não redesenha curvas nem interpreta o símbolo.
- Terra: `assets/img/orbit/ot-earth-atmosphere-static-v2.webp`, SHA `cdb61cc52d8fbcb2af75962ce552fa62aa827f71`. Mantida como imagem, sem WebGL/Three no runtime comercial.
- `ot-commercial-premium.css` só é carregado pelas cinco páginas e usa opt-in `body.ot-commercial`. A home não carrega esse arquivo.
- As fontes do kit são SVGs autossuficientes para os rasters embutidos; usam as famílias oficiais quando disponíveis. O exportador carrega e verifica fontes antes de gerar PNG.

## SEO, origem e métricas
Titles, descriptions, canonical, H1, conteúdo local, schemas existentes, robots.txt e sitemap.xml são preservados. O diagnóstico ganha WebPage e BreadcrumbList. Não foram criadas novas páginas comerciais.
O atributo origem identifica somente um dos cinco serviços públicos. O helper não cria cookies, storage nem eventos. Encaminha UTMs em links internos apenas se forem slugs curtos e seguros; não coloca UTMs na mensagem de WhatsApp. Nomes de empresas e respostas continuam no fluxo existente e não são enviados por um novo evento.
O JS de diagnóstico só altera a opção de scroll sob prefers-reduced-motion. Os demais comportamentos de medição seguem a base.

**Issue #126 permanece um gate de mensuração:** generate_lead ainda pode acompanhar o clique. Isso não comprova conversa recebida. Não usar os eventos atuais como volume de leads confirmados, nem otimizar campanha por esse indicador até a revisão específica. Este PR não muda GA4, Pixel, consentimento, eventos-chave ou dados históricos. Nenhum teste emite requisições para coletores de produção.

## Kit de divulgação
`kit.json` contém links oficiais, legenda curta e CTA por página. `kit/` contém dez fontes SVG (1200×630 e 1080×1920), reaproveitando os bytes dos ativos da marca.
Executar `node scripts/render-commercial-kit.mjs` com Playwright disponível. A exportação gera dez PNGs e manifesto no artefato `ot-commercial-premium-chromium/kit`.

**Gate OG:** os metadados atuais continuam apontando para as capas existentes, para evitar URLs quebradas. Antes de aprovar merge, inspecionar os cinco PNGs OG, incorporá-los em `assets/img/commercial/`, atualizar og:image e twitter:image de cada página e validar 200, dimensões, MIME e preview do WhatsApp/Meta. Logo, a integração das capas específicas ao HTML ainda está pendente.
Stories devem ser revisados também com a interface real das plataformas; o SVG reserva a composição principal entre 250 e 1670px.

## QA e evidências esperadas
Workflow adicional: `OT commercial premium candidate QA`, Chromium + WebKit. Os workflows e gates existentes permanecem intactos.
- Comparação byte a byte de home, teste protegido do PR #125, analytics, consentimento, robots e sitemap.
- Oito viewports: 1920×1080, 1440×900, 1366×768, 1024×768, 768×1024, 360×780, 390×844, 430×932.
- Capturas atuais antes/depois em 1440px e 390px; depois nos demais tamanhos. Conferir arquivos antes de aceitar como prova.
- HTTP, ausência de 404/erros JS/overflow, H1/canonical, imagens, targets de 44px, primeira dobra, menu, teclado, axe.
- Jornada UTM → serviço → diagnóstico → cinco respostas → resultado → link WhatsApp interceptado → reinício.
- Três amostras frias alternadas antes/depois, para cinco páginas em desktop/mobile Chromium, com LCP, CLS, bytes locais e DOM. São medições de laboratório sem emulação de rede/CPU; não são Core Web Vitals de usuários reais nem INP.
- A matriz WebKit cobre o motor; não certifica aparelho iPhone, Edge/Android físico ou UI de Safari.

## Critérios para GO
1. CI atual verde, incluindo gates existentes sem ajustes de tolerância ou desligamento.
2. Revisão humana das capturas e dos PNGs, correção dos problemas encontrados.
3. Ler comparação de performance; investigar regressões de LCP/CLS e requests antes de liberar.
4. Integrar PNGs OG e validar compartilhamento; manter fontes e legenda correspondentes.
5. Confirmar consentimento negado/concedido e DebugView controlado sem contaminar operação; resolver semântica da Issue #126 em trabalho separado autorizado.
6. Autorização explícita da direção OT para merge e publicação. Aprovação da branch não é autorização de campanha ou gasto.

## Governança
PR #125 não foi alterado: sem commits na branch dele, sem modificação em index.html ou scripts/verify-premium-v3.mjs.
Não houve merge, deploy, envio de mensagens, compra, contratação nem ativação de campanha.
