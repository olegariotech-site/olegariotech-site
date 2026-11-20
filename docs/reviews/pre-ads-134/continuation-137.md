# Continuidade autorizada — PR #137

Revisão da direção: [20/11/2026, comentário 7040192378](https://github.com/olegariotech-site/olegariotech-site/pull/137#issuecomment-7040192378).

Ponto de partida: `9e77535863bca43c60abc2bcb2c8ce9043e62364`, na mesma branch `fix/ot-pre-ads-privacy-context-134`. Base publicada da comparação: `70ae38a45831f03ea5e52e5bf45e7d61e1c2b942`.

Esta rodada começa pela instrumentação, sem mudança do globo ou das contas. O parecer continua NO-GO até o fechamento verificável das causas e das execuções do novo HEAD. O corpo da PR será atualizado com a tabela final de resultados.

## Comparação e controles

- Um job suplementar executa base e candidata sequencialmente no **mesmo runner**, com a mesma versão Playwright, engine, configuração e assertions. Earth usa o runner/Playwright do Gate B (ubuntu-latest/1.62.1); V3 usa os da falha V3 (ubuntu-24.04/1.56.1).
- Base/candidata têm diretórios separados, stdout, stderr nativo `pw:browser`, eventos de continuidade, rAF/frames WebGL, amostras de CPU/RSS e contadores de cgroup. RSS agregado inclui memória compartilhada; não é medição de VRAM nem consumo físico de um telefone de 4 GiB. O sinal deviceMemory é simulado igualmente nas duas versões.
- A raiz alternativa aceita somente o checkout **imutável** da base publicada. Nos jobs obrigatórios a raiz continua sendo a candidata. A navegação da base verifica sua URL antiga sem origem; a da candidata mantém a exigência `origem=home`. A comparação suplementar não substitui qualquer gate histórico.
- O servidor lê os arquivos diretamente do checkout, sem chamar `projectApproved134`. Cabeçalhos de hash e inspeção do corpo recebido pelo navegador comprovam HTML/JS/CSS reais. Um controle negativo injeta o HTML histórico com hash compatível e exige sua rejeição por não corresponder ao checkout.
- As projeções continuam restritas às comparações estáticas anteriores, com blobs enumerados por hash. Os contratos, 86 mutações comerciais e demais verificações permanecem ativos. Não se reduz janela, quantidade de frames, rotação, limite CLS, casos, viewports ou engines.
- O prazo operacional do job V3 passa de 20 para 40 minutos para abranger instalação e entrega de evidências. Isso não altera timeouts de ações ou critérios de desempenho. A etapa final mobile roda mesmo após falha anterior, mantendo o workflow reprovado se qualquer etapa falhar.

## CodeQL

Os quatro alertas de comparação incompleta de hostname são corrigidos por domínio exato ou sufixo com ponto. Há casos positivos, negativos e requisições a nomes parecidos inteiramente interceptadas. O classificador geral de coletores também usa a fronteira de domínio. O workflow guarda o SARIF real e verifica a contagem da regra; conclusão verde do job não será apresentada como ausência de alertas.

## Consentimento e critérios pendentes

A regressão existente com SDKs reais continua obrigatória, com todos os coletores interceptados. Esta rodada também precisa comprovar os quatro eventos GA4 solicitados em múltiplos documentos, navegação, abas, recusa/reautorização e remoção do iframe. Métricas auxiliares, Tag Assistant/DebugView e aparelhos físicos permanecem gates explicitamente pendentes quando não puderem ser comprovados no ambiente disponível.

HTTPS permanece somente [plano](HTTPS-PLAN.md). Não há merge, publicação, edição de Ads/GA4/GTM/Meta, domínio/hospedagem ou utilização dos R$ 140.

## Candidata de cache — em validação, ainda NO-GO

A primeira comparação no mesmo runner mostrou a base publicada com 2,68 frames/s no primeiro trecho de continuidade (falha) e a candidata anterior com 3,60 frames/s (passa nesse job, mas falha no Gate B obrigatório). rAF e frames do globo caem juntos, sem long tasks de JavaScript na janela; a pose continua com `animate=true`. Isso restringe a investigação ao custo de renderização/composição, sem comprovar uma causa única ou atribuir o resultado ao ambiente.

A candidata agora mantém o SVG original como fallback e rasteriza sua máscara de leitura somente após a geometria estabilizar, no DPR nativo. Blur, retângulos, opacidade, shaders, textura, órbita, quantidade de partículas, frame budget e proteções de dispositivo ficam iguais. Há controle de geração para descartar decodificações antigas. O teste adicional compara o SVG e o PNG realmente renderizados pelo navegador com uma superfície neutra para isolar o alfa. A versão do recurso muda para evitar cache antigo. A exceção estática é limitada ao bloco da máscara e a seu argumento; as demais fórmulas permanecem comparadas literalmente.

Localmente, WebKit passou nos dois perfis de 4 GiB, retomadas, duas janelas de continuidade e orientação. A comparação de alfa em 390/768 px teve diferença zero. Um ensaio anterior com três suítes concorrentes falhou; ele permanece evidência e não vale como aprovação. É obrigatório confirmar o novo HEAD no CI e em comparação controlada antes de aceitar esta proposta.

A regressão GA4 adicional usa a biblioteca real, quatro documentos em duas abas e bloqueia todos os coletores. Exige 4 `page_view`, 3 `click_whatsapp`, 2 `diagnostico_inicio` e 2 `diagnostico_concluido`, sem repetir eventos após reautorização. A recusa entre abas deve remover iframes, cookies e impedir novas tentativas. Pings auxiliares de conversão observados durante análise autorizada são registrados separadamente, todos interceptados; não representam entrega no Ads nem validação de configuração de conta.

Foi corrigida uma corrida do helper de QA: a interface inicial aparece no próximo rAF; antes ele podia procurar o botão de reabertura antes de existir uma escolha. O helper espera a interface visível e continua operando cliques reais. Não são removidas assertions. Os prazos operacionais de instalação/execução/upload de Comercial, SEO e #134 passam a 40 minutos: houve cancelamento durante download de dependências, sem modificar prazos de interação nem limites de desempenho.


### Preservação em DPR fracionário

O CI `fed7c9a` reprovou o cache no Chromium/DPR 2,625: diferença máxima 74 e média 0,1574 (limites continuam 2 e 0,05). Um ensaio de coordenadas nativas reduziu a diferença máxima a 9, ainda reprovado. A candidata seguinte conserva integralmente o SVG original quando o DPR é fracionário; o cache é usado somente em DPR inteiro. A regressão passa a exercitar explicitamente DPR 3 em 390/768 px e DPR 2,625 em 390 px em cada motor. No Chromium local os três casos tiveram diferença zero. Nenhuma tolerância foi alterada. O helper de respostas também passa a exigir a opção selecionada da pergunta de índice conhecido antes de exigir o próximo passo, acrescentando uma verificação de clique real.


## Retirada da proposta experimental — decisão final de escopo

O cache **não foi aceito**: o Gate B obrigatório repetiu `Continuous surface frames` em `fed7c9a` e `c399565` (3 frames/1,108 s, 2,71 FPS na última falha), mesmo com PNG ativo. A comparação suplementar do mesmo HEAD passou base e candidata, mostrando variabilidade, sem anular a falha. A validação adicional da máscara também reprovou no WebKit na candidata `c399565`. Portanto, esta rodada retira integralmente o cache, a versão de URL associada e a suíte específica dessa funcionalidade retirada. Os commits e artefatos guardam a proposta rejeitada e os resultados. Nenhuma assertion de continuidade, rotação, preferências, CLS, engine, jornada ou interação histórica é removida ou relaxada.

O globo, seus shaders, máscaras, textura, CSS e código de cena ficam novamente **idênticos à base publicada**. A candidata final desta rodada mantém as correções originais #134, o fechamento CodeQL, regressões GA4 reais e a instrumentação. Todos os gates serão reexecutados nesse escopo final. O parecer é **NO-GO**, até uma correção causal segura da continuidade. O fechamento anterior do WebKit não foi demonstrado como OOM ou timeout: o job original terminou com erro antes dos 20 minutos, sem stderr nativo suficiente. Novas rodadas completas aprovadas são evidência de não reprodução, não prova da causa.


## Regressão visual diagnosticada — seletor do cabeçalho

No HEAD `ad7f7cb`, o Firefox concluiu as 23 jornadas funcionais e os SDKs/GA4 reais, mas reprovou a comparação horizontal da home desktop. As capturas mostram os links “Diagnóstico” e “Fale com a OT” deslocados para a esquerda. A causa é determinística: `.top-nav a[href='/diagnostico-digital/'] { margin-left:auto }` deixa de corresponder quando o helper autorizado acrescenta origem/UTMs e torna a URL absoluta. O ajuste mantém **todas as declarações visuais idênticas**, alterando somente o operador desse seletor de igualdade para conteúdo de caminho, dentro da navegação protegida. A versão do CSS muda de 5 para 6. A exceção verifica a substituição exata de uma ocorrência e congela o blob completo; qualquer outra mudança de CSS continua reprovada. Os cinco arquivos centrais do globo/atmosfera continuam idênticos à base publicada.

A comparação geométrica agora inclui também as seis âncoras da navegação, além de todos os elementos anteriores, sem alterar a tolerância de um pixel. O par em análise é salvo antes das assertions para preservar os valores de uma eventual reprovação. É uma correção da compatibilidade entre o contexto comercial e o layout existente, sem redesign ou perda dos parâmetros comerciais. Todos os gates são reexecutados no novo HEAD; o problema de continuidade WebKit continua sem correção causal e mantém NO-GO.

## Rodada causal autorizada — revisão 7046488546

Autorização de 20/11/2026: [direção OT](https://github.com/olegariotech-site/olegariotech-site/pull/137#issuecomment-7046488546). Início no HEAD `45c7ec54d964abf6eb1d41a053d0d43834f971c0`, na mesma branch. NO-GO permanece; nenhuma autorização de produção ou contas.

Primeira alteração desta rodada é somente instrumentação QA, sem mudar qualquer assertion ou arquivo de produção. `qa-consent-timeline-137.mjs` registra ação de consentimento, início/fim da escrita, estado efetivo, storage entre abas, remoção de iframe, API/DOM iniciador de recursos opcionais, frame/parent, início e fim nativos e observação Node. Os relógios usam epoch em milissegundos; resolução/indisponibilidade precisam ser consideradas. Instantes Node são limites de observação, não substitutos do instante de início no navegador. URLs são correlacionadas por SHA-256, com host/caminho; payloads e identificadores pessoais não são retidos.

Requisições canceladas continuam na evidência e nas assertions originais. Um início nativo zero/negativo é indisponível, não prova de início anterior. A classificação causal só poderá fechar o invariante com início conhecido ou iniciador DOM/API correlacionado e fronteira da decisão demonstrada. Dúvidas temporais permanecem bloqueios; não haverá exclusão por status cancelado. Após fechar P0-02, serão feitos diagnósticos de ablação V3 e comparação Earth nas duas ordens, mantendo os gates obrigatórios.

### Controles temporais e repetição limitada

Os novos controles rejeitam uma tentativa pós-recusa mesmo com cancelamento imediato e reconhecem uma carga iniciada antes da escolha, cancelada posteriormente. Há controles unitários para fase incorreta, início nativo indisponível e fronteira de relógio inconclusiva: o último caso não vira PASS. A análise não usa cancelamento como exceção. URL/frame/iniciador correlacionam as evidências; consultas e payloads não são guardados.

O workflow causal executa exatamente três repetições de cada suíte real em Firefox/WebKit, guardando cada código de saída e relatório. Nenhuma assertion por fase foi alterada nesta etapa: qualquer reprovação original ou temporal reprova o job. A injeção deliberada após recusa existe somente no controle negativo identificado como fixture, com a solicitação abortada; ela não é apresentada como comportamento do produto. Provas de relógio por round-trip e relógio de parede acompanham os registros.

### Resultado temporal preliminar e nova homologação

No commit `f265120`, as seis execuções originais por motor terminaram com código zero. Firefox aprovou também a análise causal. WebKit apresentou três fronteiras inicialmente inconclusivas na **reautorização** do Meta SDK, em resolução próxima de um milissegundo. A resolução usa agora a ordem de programa da escrita concluída e do iniciador **no mesmo documento**, com os estados persistido e efetivo concedidos; outras recusas, inclusive entre abas, continuam sendo avaliadas. Um controle negativo impede usar uma concessão antiga de outra aba para encobrir uma recusa posterior. Reanalisar os doze relatórios brutos com essa regra produziu zero violações e zero casos inconclusivos. Isso não transforma o job anterior reprovado em aprovado: uma nova execução CI deve comprovar a versão final.

As duas ocorrências antigas do HEAD `45c7ec5` não possuem relógios suficientes para determinar retrospectivamente seu início. Seu status cancelado não as inocenta. A evidência nova demonstra o comportamento da candidata instrumentada e a sensibilidade dos controles; a limitação histórica permanece explícita. As duas suítes principais recebem uma assertion temporal adicional que considera **todas** as fases. As assertions antigas por fase são preservadas.

### WebKit: desenho causal sem alterar o produto

As comparações suplementares usam base → candidata → candidata → base no mesmo runner; todas as tentativas da candidata precisam aprovar. A V3 registra o erro da ação **antes** do fechamento em `finally`, para separar timeout inicial de eventos de crash produzidos durante a limpeza. Os diagnósticos adicionais comparam base, candidata e ablações isoladas do núcleo de consentimento, observador de contexto e seletor CSS. Contagens/custo de MutationObserver, rAF, visibilidade, iframe e processos nativos acompanham os dados. Anexar gdb pausa brevemente o processo: esses ensaios são identificados como diagnóstico e jamais homologam a candidata.

O Gate B mantém gravação e todos os limites originais. Um ensaio separado alterna gravação ligada/desligada/desligada/ligada para medir esse fator, com resultados brutos preservados. Uma aprovação sem gravação não substitui o Gate B obrigatório. A instrumentação acrescenta intervalos de rAF, suporte ou indisponibilidade de paint timing, pressão de CPU/memória e contadores do processo; ausência de contadores não comprova ausência de OOM.

Acorn compara as 176 chamadas de assertion históricas dessas quatro suítes com `45c7ec5`, na ordem e com o conteúdo originais: nenhuma foi removida ou relaxada. Nenhum arquivo de produção foi alterado nesta rodada causal. O parecer permanece NO-GO enquanto Gate B/V3 ou a comprovação temporal final estiverem pendentes.
