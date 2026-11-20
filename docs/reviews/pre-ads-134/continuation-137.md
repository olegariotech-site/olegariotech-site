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
