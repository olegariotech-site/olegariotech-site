# Issue #138 — fechamento da medição e preparação Search

Data: 23/11/2026. Base publicada imutável: `a09087d4aaf33b590ea3cc77e3357ef92d8b33bd`.
Branch: `fix/138-ga4-qa-privacy`. Proposta para revisão; sem merge, deploy ou alteração de contas Google.

## Problema e comportamento proposto

A navegação interna perdia `debug_analytics=1`; a sessão comum enviava `debug_mode:false`; o progresso do diagnóstico enviava o valor escolhido em `answer_category`. O candidato mantém o sinal QA somente em links internos elegíveis, omite o parâmetro debug em sessões comuns e envia somente nome da etapa e número no progresso. O transporte deixa também de aceitar as chaves de resposta `answer_category`, `estrutura` e `objetivo`. O conteúdo e o destino do WhatsApp continuam preservados.

O início continua sendo a primeira resposta válida e a conclusão exige todas as etapas. `click_whatsapp` significa intenção de contato. Nenhum `generate_lead`, venda ou lead qualificado é criado por um clique. O iframe descartável, as barreiras de origem, de rede e de revogação continuam ativos. Não foi incluído GTM nem outra tag Google, novo ID, fluxo ou propriedade.

As nove páginas mudam apenas versões de cache dos scripts. As versões do núcleo, transporte e seu documento também avançam. Não há alteração de visual, globo, texto comercial, Pages, DNS ou HTTPS.

## Preservação dos controles históricos

`approved-delta.json` fixa o hash Git de cada um dos 15 arquivos revistos. `verify-issue-138-scope.mjs` exige esses bytes, limita HTML a versões de cache, preserva literalmente as assertivas do gate #134 e acrescenta nove controles negativos. A projeção para os bytes antigos existe somente nas comparações históricas. Navegadores sempre executam o candidato real.

O gate #134 recebe três chamadas de integração do novo gate, sem remover ou afrouxar suas comparações ou controles. O controle de cache #126 usa a projeção exata #138 para continuar atacando sua versão histórica; sua mutação negativa permanece ativa. O gate WhatsApp #127 e os manifestos históricos continuam intactos.

## Evidência de contas e seus limites

| Item | Evidência | Conclusão permitida |
|---|---|---|
| GA4 no Edge, conferência anterior nesta conversa | Conta Olegario Tech, propriedade `513114740`, fluxo `12988225600`, `G-0YXCH58MXD`, domínio oficial, coleta ativa nas últimas 48h | Associação oficial confirmada na leitura anterior; não equivale à homologação dos eventos comerciais |
| Abas durante esta execução | Analytics, Tag Manager e Google Ads abertos no Edge | Identificação de abas; não prova acesso administrativo a GTM/Ads |
| Continuidade da leitura no Edge | Timeouts de conexão; depois chamada bloqueada pela configuração do aplicativo | Eventos principais, filtros, GTM e vínculos não puderam ser lidos nesta rodada; sem alteração de contas |
| Conexões de dados existentes | GA4 `513114740`; Google Ads `234-607-3384`, nome Olegario Tech | Acesso por fonte de dados identificado; não prova vínculo GA4↔Ads nem papel administrativo |
| Catálogo específico Ads | Ações `Alexandre Olegario dos Santos (web) click_whatsapp` e `... diagnostico_concluido` aparecem no catálogo de conversões | Referências existentes; revisar/reaproveitar antes de qualquer nova importação. IDs e estados atuais ainda não confirmados |
| Consultas Ads de configuração | Contagem, tipo, estado, prioridade e auto-tagging: `data=[]` | Resultado inconclusivo. Não concluir que ações, vínculo ou auto-tagging estão ausentes |
| Consulta GA4, 21–23/11 | 10 linhas do dia 21/11; `page_view=11`, eventos de navegação; nenhuma linha comercial; eventos principais zero nesse recorte | Há dados históricos. Esse relatório não comprova nem refuta o recebimento comercial de hoje |
| Atualização da fonte | Refresh indisponível no plano conectado | Limite de atualização; nenhum plano, assinatura ou cobrança alterados |
| Fonte administrativa alternativa | Projeto OT encontrado, mas GA4 não conectado nessa fonte | Não foi feita nova conexão nem mudança de integração |

Não foram enviados novos eventos de teste ao GA4 pelo Edge nesta rodada. Os HTTP 204 e a atividade em Tempo Real descritos na Issue são evidências prévias da direção, não uma nova captura desta execução. SDK interceptado não é recibo de recebimento na conta.

## Pontos de arquitetura ainda abertos

O site carrega `gtag.js` após consentimento em documento vazio e descartável. Uma URL `googletagmanager.com/gtag/js` não significa que exista um contêiner GTM instalado: não há `GTM-*` ou `gtm.js` nesses caminhos. Acesso, contêiner, tags e versões publicadas do GTM continuam sem leitura efetiva. Não instalar um segundo GA4 por GTM; qualquer migração deve substituir a fonte atual, manter consentimento e passar o mesmo teste de unicidade.

O código mantém `ad_storage`, `ad_user_data` e `ad_personalization` negados, inclusive com marketing autorizado. O bloco marketing atual ativa Meta, não uma autorização Google Ads. A inferência técnica é que a atribuição publicitária precisa de validação própria; coletar GA4 não basta para dar GO às conversões Ads. O Google documenta limites na exportação associada a click ID quando `ad_user_data` é negado. Não reabrir destinos publicitários bloqueados nem transformar consentimento de análise em consentimento para anúncios.

O transporte permite GCLID validado na URL de entrada para análise; o helper não copia GCLID para navegação interna ou WhatsApp. UTMs e marcadores fixos já cobrem contexto comercial. Preservação e atribuição publicitária entre documentos precisam ser verificadas com o vínculo, auto-tagging e a decisão de consentimento corretos; não prometidas a partir de um marcador no WhatsApp.

## Conversões propostas, ainda sem aplicação

| Evento | Significado | GA4 proposto | Ads proposto |
|---|---|---|---|
| `page_view` | Visita | Evento comum | Sem conversão |
| `diagnostico_inicio` | Primeira resposta válida | Evento comum | Sem conversão |
| `diagnostico_concluido` | Diagnóstico completo; não contato recebido | Evento principal de microconversão, se aprovado | Reaproveitar ação existente; secundária/observação; uma por clique; sem valor monetário inventado |
| `click_whatsapp` | Clique de intenção | Evento principal de intenção, se aprovado | Reaproveitar ação existente; secundária nesta fase; uma por clique; sem valor monetário inventado |
| Lead recebido/qualificado | Atendimento confirmado pelo Alexandre | Integração CRM/offline futura, com prova | Não criada nesta missão |

Antes de aplicar: ler IDs, origem das ações, contagem, prioridade, janela, metas de conta/campanha e regras GA4 que criam/modificam eventos. Conferir uma única origem por intenção, sem tag nativa Ads e importação GA4 contadas como duas conversões primárias. Clique e conclusão da mesma visita são etapas diferentes; não somá-los como dois leads. Não usar um objetivo personalizado que torne ações secundárias elegíveis a lances sem decisão explícita.

## Campanha preparada

`campaign-prepared.json`, `keywords-prepared.csv` e `ads-prepared.csv` são materiais de revisão, não alterações aplicadas nem importação já homologada no Editor. Contêm uma campanha Search, dois grupos regionais, 12 palavras em frase/exata e dois anúncios responsivos. Todos têm estado PAUSED. Destinos são as landings existentes de Valinhos e Campinas. Há negativas, UTM, presença geográfica, rede Google sem parceiros/Display e mensagens sem garantia de resultado ou preço inventado.

Proposta de teste: orçamento **total de R$ 140 por sete dias**, datas apenas após autorização, Maximize Clicks com teto inicial hipotético de R$ 3 por clique. Não é estimativa de mercado nem promessa de volume. O Google documenta orçamento total para novas campanhas Search. Se essa opção não aparecer na conta, parar para revisar o limite; não trocar silenciosamente por orçamento diário. Um orçamento médio diário não é um teto rígido de R$ 140. Nenhuma campanha foi criada, salva, publicada ou ativada na conta. Não houve gasto publicitário causado por esta execução.

## QA reproduzível e limites

```sh
node scripts/verify-issue-138-scope.mjs
node scripts/verify-issue-138.mjs
node scripts/verify-consent-timeline-137.mjs
node scripts/verify-ads-whatsapp-origin.mjs
# Com Playwright e engine disponíveis:
OT_134_ENGINE=chromium node scripts/verify-issue-138.mjs --browser
OT_134_ENGINE=chromium node scripts/verify-ga4-consent-137.mjs
```

O offline executa o runtime real em VM, com casos positivos e controles do commit base que reproduzem perda de QA, debug false e resposta no transporte. Não substitui navegador/SDK real. A automação nova executa Chromium, Firefox e WebKit com coletores interceptados, mais o contrato histórico completo de consentimento entre abas. CodeQL permanece no workflow existente. Nenhuma assertiva manual foi substituída por uma inferência de sucesso.

O ambiente local não conseguiu iniciar Chromium por restrição de socket e não tem os binários Playwright instalados. Esses testes locais não receberam PASS; a execução de navegador e CodeQL deve ser lida nos checks do PR. Os controles estáticos #134/#127/#126 passaram antes desse limite; a tentativa de suíte visual parou ao iniciar o navegador e não constitui aprovação visual. Não foi refeita a auditoria geral do site.

## Decisão e sequência

- **Site publicado:** GO funcional/HTTPS herdado das evidências anteriores. Candidato ainda sem publicação e dependente dos checks do PR; não há nova homologação geral.
- **GA4 comercial em produção:** NO-GO de homologação. Correções preparadas não são produção; falta correlação final dos quatro eventos e leitura dos eventos principais/regras/filtros na propriedade.
- **Google Ads:** NO-GO de ativação. Preparação comercial concluída em arquivos; vínculo, consentimento de uso Ads, ações existentes, auto-tagging e recebimento precisam de confirmação.

Depois dos checks, fazer uma única sessão autenticada curta: ler eventos principais/regras/filtros, vínculo da propriedade com Ads, ações de conversão, auto-tagging e GTM. Só depois da autorização para publicar o candidato, correlacionar uma jornada QA identificada com `page_view`, `diagnostico_inicio`, `diagnostico_concluido` e um clique WhatsApp sem enviar mensagem. Se DebugView continuar limitado pelo iframe, registrar coletores reais 204 mais Tempo Real/Eventos e os limites residuais; não repetir cliques indefinidamente. A presença de iframe e timeout do Tag Assistant, isoladamente, não provam perda de coleta.

Rollback: antes do merge, descartar o PR/branch não afeta produção. Após eventual publicação autorizada, reverter o commit do candidato completo, incluindo versões de cache, preserva o estado base. Nenhuma reversão automática de conta Google foi preparada porque nenhuma conta foi modificada.

## Referências oficiais

- [DebugView: omitir debug_mode para desativar](https://support.google.com/analytics/answer/7201382?hl=pt-BR)
- [Importar eventos do Analytics para Ads e opções de contagem](https://support.google.com/google-ads/answer/2375435?hl=en)
- [Requisitos para importar conversões GA4](https://support.google.com/google-ads/answer/16560108)
- [Consent Mode e limites da exportação por click ID](https://support.google.com/analytics/answer/13802165?hl=en)
- [Vincular Google Ads ao Analytics](https://support.google.com/analytics/answer/9379420?hl=en)
- [Orçamento total de campanha, incluindo Search](https://support.google.com/google-ads/answer/10486938?hl=en)

As referências explicam o produto. As evidências específicas e os limites da OT estão separados acima. Não aplicar orientação específica do EEE como conclusão jurídica sobre a OT no Brasil.
