# OT - Correção controlada da auditoria pré-Google Ads (#134)

Autorização: [comentário da direção de 19/11/2026](https://github.com/olegariotech-site/olegariotech-site/issues/134#issuecomment-7024434451).

Base imutável: `70ae38a45831f03ea5e52e5bf45e7d61e1c2b942`, a `main` vigente ao iniciar. As PRs #135/#136 alteraram apenas documentação desde o SHA auditado `6bbc1bf`; seus textos são preservados. Não integrar as PRs independentes #125/#131 nesta correção.

**Somente candidato para revisão em PR draft. Sem merge, publicação, mudanças de contas ou ativação de mídia.** O novo parecer e os resultados do HEAD estão no corpo/conversa da PR e nos artefatos do CI. Esta documentação descreve a implementação e seus critérios; não substitui os resultados de execução.

## Correções autorizadas

| Item | Causa | Implementação |
|---|---|---|
| P0-01 | O SDK Meta instalava coleta automática de botões, incluindo a URL `wa.me?text=` do resumo. | `autoConfig=false` antes de `init`; apenas eventos explícitos com parâmetros seguros. O resumo do visitante continua completo no botão WhatsApp. |
| P0-02 / Meta | Remover cookies e bloquear eventos próprios não revogava o SDK já carregado. | Chamadas reais `consent revoke/grant`, decisão efetiva em memória e sincronização entre abas. |
| P0-02 / Google | A flag `ga-disable-*` e Consent Mode não impediram o flush de `scroll` já enfileirado. | SDK em documento oculto da mesma origem, com transporte próprio descartável. Antes de remover o documento, fecha-se seu gate de beacon/fetch/XHR/imagem, inclusive no unload. Só esse contexto de medição é afetado; nenhuma API de rede da página comercial é alterada. |
| P1-01 | Helper não executava na home, ignorava rodapés e não conservava a região no retorno ao diagnóstico. | Home incluída, links dinâmicos observados e links de home/diagnóstico recebem origem válida e cinco UTMs restritas. Sem storage de atribuição novo e sem gclid no rascunho. |
| P1-03 | Contêiner da tabela de cookies tinha overflow sem foco. | `tabindex=0`, região com nome acessível e contorno visível ao teclado. Layout e conteúdo preservados. |
| P1-02 | Cadeias HTTP/canônico exigem intervenção de hospedagem. | Apenas [plano HTTPS](HTTPS-PLAN.md). Nenhuma configuração foi alterada. |

P2 permanece fora do escopo. Não trocar ROTA 019 por K.L., não recolocar links regionais, não alterar sitemap ou otimizar a home nesta PR.

## Ciclo de vida do Google e preservações

O documento `assets/ot-google-measurement.html` não é uma landing nem uma interface nova: fica oculto, fora da navegação/acessibilidade, sem indexação, e não carrega SDK quando aberto diretamente. O bootstrap recebe mensagens somente do seu próprio pai e origem. Usa o mesmo ID GA4 e mantém primeira parte/cookies da mesma origem; a URL/título/referrer da página comercial são passados explicitamente. A coleta real é validada com o caminho do diagnóstico e presença/limpeza dos cookies GA, sem gravar seus identificadores nos relatórios.

O SDK não consome o `dataLayer` da interface principal. Esse registro continua disponível para os eventos próprios e os verificadores existentes; eventos permitidos são encaminhados à biblioteca real no documento de medição. A fila do pai é descartada na recusa, e a fila do fornecedor não pode escapar pelo unload porque o gate do seu transporte já está fechado. Reautorizar cria um contexto novo, sem repetir o `page_view` no mesmo documento principal.

Mantêm-se: eventos próprios comerciais e categorias gerais, page URL/campanha com allowlist, parâmetros de CTA sem query, endereço de atendimento, perguntas/respostas, recomendação, texto WhatsApp e referências OT. O sinal útil de 90% de rolagem é emitido pela interface somente com análise autorizada; não se confunde com lead recebido. Nenhum nome/resposta digitado é encaminhado ao Google ou à Meta nos cenários exercitados.

Cache: `ot-analytics.js?v=10`, `ot-analytics-core.js?v=9`, `ot-commercial-context.js?v=3`. As nove páginas recebem exclusivamente a versão do loader; as cinco comerciais atualizam o helper e a home o inclui. As únicas mudanças visuais públicas são o foco da tabela solicitado em P1-03. Não há novas dependências de produção.

## Testes e critérios

```bash
node scripts/verify-ads-whatsapp-origin.mjs
node scripts/build-showroom.mjs --check
OT_QA_STATIC_ONLY=1 node scripts/verify-premium-v3.mjs
OT_ANALYTICS_ENGINE=chromium node scripts/verify-analytics-funnel.mjs
OT_ANALYTICS_ENGINE=webkit node scripts/verify-analytics-funnel.mjs
OT_134_ENGINE=chromium node scripts/verify-pre-ads-134-real.mjs
OT_134_ENGINE=webkit node scripts/verify-pre-ads-134-real.mjs
OT_134_ENGINE=firefox node scripts/verify-pre-ads-134-real.mjs
OT_134_ENGINE=chromium OT_134_BEFORE=/checkout/da/base node scripts/verify-pre-ads-134-journeys.mjs
```

As bibliotecas reais são carregadas das URLs oficiais. Todos os destinos de coleta e qualquer navegação WhatsApp são interceptados antes do envio. Os relatórios guardam nomes dos eventos, flags, presença da fixture fictícia e hashes/bytes dos SDKs; não guardam cookies/client IDs reais ou credenciais. A rede de produção do site não é usada para servir o candidato: o replay usa os bytes deste checkout sob o domínio canônico em um navegador isolado.

O teste exige: nenhuma coleta antes da escolha; Meta Contact explícito funcionando sem autoeventos ou rascunho; independência de categorias; zero requisição opcional ao revogar SDK carregado e fazer novos cliques/rolagens/respostas; recusa persistente; reautorização sem duplicar configuração ou gerar `generate_lead`/Meta Lead. Google precisa medir o caminho comercial real e manter a sessão/cookie de primeira parte. Falha de fornecedor ou ambiente não conta como PASS silencioso.

Jornadas: duas cidades, 390/1366 px, CTA direto, rodapé, regional > home > diagnóstico e header do diagnóstico; orgânico e chatgpt.com sem alegação Google; home sem cidade não inventa referência regional; origens inválidas; gclid não encaminhado; resumo e marcador sem duplicação. Tabela testada com teclado/axe em 360/390. Comparação geométrica e capturas antes/depois das seis páginas críticas na base imutável e candidato.

Os workflows históricos, incluindo os oito jobs Gate B, permanecem ativos. O job offline de atribuição passa a buscar o histórico completo, necessário à comparação com a base imutável; nenhuma afirmação é removida. O novo workflow adiciona testes reais e de jornadas nos três motores; não substitui a proteção anterior.

### Compatibilidade com contratos históricos

O gate independente `verify-pre-ads-134-scope.mjs` verifica os arquivos reais: edições HTML são substituições literais delimitadas da base; runtime e adaptadores de teste têm blobs exatos enumerados; os dois assets novos também estão congelados. O candidato precisa conter a correção (reverter para a base não passa o gate). Só depois disso as comparações históricas recebem sua projeção conhecida, mantendo todas as verificações antigas. Navegadores sempre recebem os arquivos reais, nunca a projeção. Os controles negativos rejeitam mudanças em H1, foco, coleta automática, flags, referências, transporte no unload e origem das mensagens. A exceção README reconhece somente os bytes já publicados em #135; não muda documentação da marca.

## Evidência local para inspeção

[Comparação mobile antes/depois](evidence/mobile-before-after.jpg) e [prova dos SDKs/rede interceptada](evidence/local-sdk-proof.json). A folha foi inspecionada visualmente: home, Valinhos, diagnóstico e resultado preservam a identidade aprovada; o contorno ciano mostra o foco da tabela. O CI contém as capturas individuais e demais larguras.

Compatibilidade adicional de QA: o teste de entregas verifica a mesma rota do diagnóstico e agora exige a origem `home`; a fixture do teste de consentimento roda somente no documento principal para não sobrescrever a escolha do usuário a partir do iframe. O teste de rotação também abre o mesmo CTA e exige caminho do diagnóstico mais origem `home`, em vez da URL antiga sem parâmetros. O teste V3 final aguarda a requisição real do SDK após salvar, mantendo a afirmação original de carregamento. Sem remoção de cenários ou redução de tolerâncias.

## Riscos e limites para revisão

- O ciclo Google mudou: a biblioteca real executa em documento filho. Metadados de contexto incorporado e comportamento auxiliar do SDK podem diferir. Conferir em revisão DebugView/Tag Assistant e relatórios após eventual publicação autorizada; a auditoria não alterou a propriedade GA4.
- O gate de transporte fica restrito ao documento descartável, carregado somente com consentimento. A mesma origem é necessária aos cookies e dados da sessão; o iframe não é apresentado como isolamento de segurança contra SDK comprometido. A opção sandbox pode emitir aviso de mesma origem no Chromium.
- SDKs e configuração remota dos fornecedores podem mudar. O CI registra hashes/versões observadas e deve ser repetido quando houver mudança relevante; não há garantia eterna por snapshot.
- Simulação Linux, inclusive toque/UA de iPhone/Pixel, não certifica Safari/iPhone/Android físicos. Não declarar INP/CWV de campo a partir destes testes.
- P1-02 segue sem execução. Configuração primária/secundária e metas padrão/personalizadas no Ads, `generate_lead` histórica e recebimento real de WhatsApp continuam fora da comprovação deste candidato.

**Três decisões separadas:** aprovação de código; autorização HTTPS; autorização de mídia. Mesmo com CI verde, esta PR permanece draft até a direção revisar. Nenhum saldo ou gasto é acionado pelo teste.
