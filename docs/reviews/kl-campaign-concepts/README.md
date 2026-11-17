# OT — conceitos de campanha com K.L Transporte Express

Missão: 17/11/2026. Base publicada confirmada: `c0289b5b2bfd58dc0b7b3d84f579f6014b83c0f9` (PR #130), após a publicação do PR #129. Branch isolada `feat/kl-campaign-concepts-20261117`. Não alterar a home nem publicar automaticamente.

## Direção e integridade comercial

O HERO conserva dois mockups: pesquisa no Google e conceito social com seleção nativa Instagram/Facebook. A seleção usa radios e labels de HTML, com legenda, teclado e foco visível. Não acrescenta JavaScript público ou biblioteca. Os dois painéis ocupam a mesma área de grid; o painel inativo fica invisível também para a árvore de acessibilidade, mantendo a altura reservada.

ROTA 019 é substituída pela identidade publicada da K.L Transporte Express. Os azuis `#021c42`/`#032a63` e dourado `#e0ae2b` são usados dentro dos conceitos; a interface externa mantém a identidade OT. Logotipo e imagem foram obtidos do site oficial, com URLs e hashes dos originais em [brand-sources.json](brand-sources.json). Apenas redimensionamento proporcional e codificação web: nenhuma reinterpretação do logotipo ou veículo inventado. Não apresentamos a imagem de identidade como prova documental de frota ou operação.

Google apresenta transporte de cargas em Campinas. Instagram destaca coletas/entregas para empresas; Facebook adapta a chamada para transporte empresarial e consulta de orçamento. Todas as peças têm identificação de conceito. Não há “Patrocinado”, avaliações, métricas, promessas ou atribuição de investimento/veiculação ao cliente. Os CTAs dentro dos mockups são ilustrações estáticas; os dois controles de seleção de canal são interativos de verdade.

Identificação comum: **“Conceito de campanha para cliente real”**. A FAQ explica que as peças não comprovam veiculação, investimento ou resultados. Os cases e depoimentos externos ao HERO permanecem intactos.

## Autorização da marca — pendência de publicação

**Autorização promocional da K.L: não confirmada nesta missão.** A relação de cliente e a publicação dos ativos em seu site não são tratadas como autorização para promover a OT. A direção deve obter e registrar a autorização de uso da marca, imagem e peças nesse contexto antes de qualquer publicação. Não houve contato automático com o cliente.

O PR deve permanecer em draft. Um eventual GO técnico não elimina esse **NO-GO de publicação**, nem autoriza merge, campanha ou custo. O relatório do QA registra separadamente homologação técnica e prontidão de publicação.

## Conteúdo e SEO

H1, apoio, title/description, Open Graph/Twitter, WebPage/Service/BreadcrumbList e FAQ passam a nomear Google, Instagram e Facebook. Preservadas a URL `/anuncios-google-instagram/`, canonical, indexabilidade, regiões de Valinhos/Campinas e estrutura dos dados. Não é criada outra página.

O kit OT tem somente a entrada e as fontes OG/Story de Anúncios atualizadas para três canais. A capa continua promovendo o serviço da OT; não usa a marca K.L como prova de mídia paga. O PNG OG deve ser renderizado das novas fontes e conferido contra a exportação do navegador antes de GO técnico.

Links, números e mensagens atuais de WhatsApp, Diagnóstico/origem e UTMs ficam literais. O nome histórico do serviço dentro da mensagem de origem é preservado para não alterar o contrato de conversão. Analytics, Pixel, consentimento e seu controle visual não mudam.

## Escopo e proteção

Os novos estilos são inline e limitados à página de Anúncios. O CSS comercial compartilhado, os quatro outros HTMLs, a home e todos os motores/ativos da Terra permanecem byte a byte iguais à base publicada, incluindo os ajustes de linguagem do PR #130. PR #125 permanece independente; Issue #126 não é alterada.

[approved-campaign-delta.json](approved-campaign-delta.json) enumera os fragmentos autorizados de conteúdo, fontes e integração dos testes contra a publicação fixa, além dos hashes da capa e dos dois assets locais. A referência histórica não é substituída pelo HEAD candidato.

Os contratos anteriores conservam seus baselines e testes de rejeição. Após validar a árvore atual contra o novo contrato exato, recebem uma projeção estrita de seus bytes publicados anteriores, apenas nos arquivos explicitamente autorizados. Não é uma normalização genérica: dados diferentes do fragmento aprovado reprovam antes de qualquer projeção. Os testes de navegador sempre servem os arquivos atuais reais; o novo QA também valida de forma independente os metadados, schemas, conversão, canais e transparência atuais.

Nenhum cenário é desligado ou marcado continue-on-error. As expectativas antigas de empresa fictícia/ausência de controles são atualizadas para a declaração de conceito com cliente real e os dois radios nativos. Transferências adicionais de imagem são permitidas somente para os dois arquivos K.L congelados, não para imagens arbitrárias. CLS é limitado a 0,02 na página de Anúncios; permanece em 0,1 nas demais páginas. O filtro de acionamento do Gate B passa a incluir a página de anúncios e os módulos dos contratos que ele executa indiretamente; seus jobs, cenários, baselines e tolerâncias permanecem iguais.

## Homologação e evidências

Workflow `OT real-client campaign concepts QA`: Chromium/WebKit nos tamanhos 1920, 1440, notebook 1366×612, 1024, 768, 360, 390 e 430px. Testa alternância por teclado, nome/estado dos controles, foco, exclusão do painel inativo da acessibilidade, altura estável, CTAs acima da dobra, contraste/axe nos dois canais em 390/1440px, assets e ausência de erros/overflow. Verifica os campos exatos de SEO e schemas e a igualdade de scripts, WhatsApp e Diagnóstico com a publicação.

Performance: três amostras frias alternadas antes/depois contra `c0289b5` nas cinco páginas em 390/1440px no Chromium. Medição natural separada das capturas, incluindo LCP, CLS, documento, recursos, imagens e fontes. Os dois assets web somam aproximadamente 52KB; não são carregados pelas outras páginas. Não se promete ganho de CWV por inspeção de código.

Artefatos guardam antes/depois e os estados Instagram/Facebook do HERO e dos cards, kit social e relatório numérico. Os resultados do HEAD final, links de workflows, capturas revisadas, riscos e parecer estarão na descrição do único PR draft. Browser de CI não certifica aparelhos físicos, interface do Safari, INP ou experiência de rede real.

Os demais workflows aplicáveis devem concluir no mesmo HEAD antes de GO técnico. A publicação continua bloqueada enquanto faltar a autorização da marca e a decisão explícita da direção.

## Achado da primeira execução

O primeiro QA detectou uma regressão real de overflow em 1024px: largura de rolagem 1036px contra viewport de 1024px, sem elemento DOM listado fora da tela. A composição maior expôs a extensão do halo decorativo rotacionado e comprimiu os cards no grid de duas colunas do HERO. A correção limita a elipse sem rotação e empilha o HERO até 1100px, conservando os dois mockups lado a lado dentro da área visual quando há espaço. Não se mascara o documento com overflow hidden e não se altera a tolerância do teste. Os testes completos precisam confirmar a correção.

O PNG OG integrado foi substituído pela exportação Chromium das fontes atualizadas; o novo QA exige igualdade com uma nova renderização, além de conferir dimensões e conteúdo coordenado. As execuções intermediárias com falha não são apresentadas como homologação do HEAD final.

## Foco entre motores

A execução WebKit do primeiro ajuste de layout revelou ausência do contorno no radio nativo após a troca por seta, apesar de a seleção mudar corretamente. O controle visual passa a usar `:focus + label`, de modo que todo foco no input recortado tenha um contorno visível no rótulo, inclusive no WebKit. O teste exige que o foco permaneça no grupo nativo e mede o contorno do rótulo do input efetivamente focado; mantém separadas e estritas as verificações de seleção, painel ativo e exclusão do inativo. Não depende de heurística de `:focus-visible` após foco programático.

A execução `4f734e6` passou nos dois motores: 16 combinações de viewport/motor, dois canais em cada combinação e oito análises axe sem violações. O commit `e9886c6` acrescenta somente diagnóstico de fontes de layout shift ao QA. Os arquivos públicos são os mesmos entre esses dois commits. A homologação completa do HEAD final permanece vinculada aos workflows indicados na descrição do PR.

## Investigação de CLS

A instrumentação do commit `e9886c6` atribuiu a regressão à quebra adicional do H1 durante a troca de fonte: deslocamento do apoio/CTAs de aproximadamente 34px no celular e 56px no desktop. Não foi causado pelo carregamento da imagem do veículo. O CLS máximo medido foi 0,0339 em 390px e 0,0820 em 1440px, contra 0,0067 e 0,0034 na base. Mesmo dentro do antigo limite 0,1, a diferença motivou correção.

O H1 passa a reservar quatro linhas nas faixas estreita e de duas colunas, sem aumentar a fonte ou limitar a altura do conteúdo. O layout empilhado de tablet mantém a altura natural. O QA de Anúncios fica mais rigoroso, com teto de CLS 0,02 nas amostras frias; os demais orçamentos não são ampliados. Capturas e métricas anteriores à correção não serão apresentadas como resultado final.
