# PR #128 — contrato de preservação e homologação Gate B

Autorização: direção OT, continuidade exclusiva do PR #128. Referência de produção imutável: `2d6873bffbc66aafd1ff153a0455546b507a9759`. Implementação visual já revisada: `fb57fb8c73d3cc6b9f5bce13797cac33a7d7cfc9`.

## Problema e alteração restrita

O teste `verify-premium-v3.mjs` aceitava somente versões de assets e a antiga capa V5 do Diagnóstico nas três páginas históricas. A igualdade integral com esse HTML abortava complete-home antes do primeiro cenário funcional.

Somente essa asserção é substituída nas três rotas autorizadas. O baseline histórico `66db8f5` permanece. O resultado esperado histórico ainda precisa coincidir com a produção fixa `2d6873b` antes de entrar no novo contrato. Produtos, privacidade e cookies continuam na igualdade estrita antiga.

O novo módulo `verify-commercial-contract.mjs` compara as cinco páginas contra a produção fixa e valida invariantes semânticas independentes. O manifesto `approved-commercial-delta.json` enumera 45 alterações delimitadas por página, com fragmentos anteriores, linha histórica, conteúdo permitido e finalidade. Cada âncora anterior precisa corresponder à referência de produção; todos os bytes fora dessas alterações ficam preservados. Não há snapshot do HTML candidato como novo baseline, normalização genérica de tags, tolerância de conteúdo ou permissão para mudanças futuras arbitrárias. Os fragmentos novos correspondem ao diff já aprovado e foram reconstruídos contra a produção antes do commit.

As adições aprovadas são: metadados das capas OG, assets comerciais opt-in, classe do body, navegação/rodapé comuns, CTA específico de serviço, prova/contratação e os ajustes delimitados do Diagnóstico (viewport, breadcrumb/landmark, posição do botão inicial e label). A identidade e as páginas não são reimplementadas.

## Matriz de proteções

| Proteção | Contrato resultante |
|---|---|
| Home inteira, Terra e todos os demais arquivos existentes na produção | Comparação binária estrita com `2d6873b`, salvo as exceções abaixo, explicitamente delimitadas |
| Regras históricas da home, catálogo, seções, eventos e motores em verify-premium-v3 | Todo o arquivo permanece literal, exceto o único bloco de asserção autorizado |
| Produtos, privacidade, cookies e demais arquivos fora da missão | Igualdade estrita; nenhuma exceção de conteúdo |
| Title, description, canonical e H1 nas cinco páginas | Exatamente uma ocorrência; igualdade literal com a produção |
| Conteúdo regional, cases, FAQ, perguntas, opções, links e markup não autorizados | Preservação integral fora das 45 alterações enumeradas |
| Schemas | Schemas históricos preservados; só o grafo WebPage/BreadcrumbList aprovado do Diagnóstico é adicionado |
| Scripts inline, consentimento e tags de mensuração | Iguais aos históricos; apenas um helper de origem/UTM com URL e atributos exatos é permitido |
| Mensagens e números de WhatsApp existentes | Mensagens históricas presentes e destino institucional obrigatório; diff delimitado impede remoção/alteração de CTAs |
| Runtime do Diagnóstico | Apenas a substituição já aprovada de scroll smooth pelo respeito a prefers-reduced-motion |
| Identidade, cinco capas OG, dez fontes SVG, kit e helper de origem/UTM | Bytes congelados contra a implementação previamente aprovada `fb57fb8`; essa referência não substitui a produção para conteúdo |
| QA comercial, SEO e Gate B funcional | Permanecem complementares e integrais; nenhum cenário removido |
| LCP, CLS e imagens | Mesmo transporte, três amostras alternadas antes/depois; adicionados elemento LCP, recursos/bytes e estado natural das imagens; limiar CLS não muda |

O congelamento anterior de verify-premium-v3 no QA comercial passa a aceitar **somente** a substituição exata dessa asserção. Qualquer outra mudança no arquivo falha. A exceção não é exclusão do arquivo da proteção.

## Testes de rejeição

O contrato testa 86 alterações indevidas nas cinco páginas, além de uma alteração indevida no restante do teste histórico. Cobertura: H1 alterado/duplicado, description, canonical, conteúdo regional, número/mensagem WhatsApp, consentimento concedido por padrão, script de tracking trocado, evento novo, destino da navegação, schema, OG, helper removido, origem do diagnóstico e opções/label. Cada teste comprova que a mutação alterou a entrada e que foi rejeitada. Os testes são executados dentro do Gate B estático e do QA comercial.

## Identidade de assets sem criptografia manual

A identidade exata dos blobs é obtida com `git hash-object --no-filters --stdin`, usando os bytes reais dos arquivos, e comparada aos IDs da árvore fixa de produção. A implementação delega o formato de objetos ao próprio Git. Nenhum algoritmo criptográfico manual, supressão de CodeQL ou mudança de tolerância é necessário. A leitura da árvore usa registros delimitados por NUL para preservar espaços e acentos nos caminhos; binários grandes não são enviados ao buffer de saída de `git show`.

## Correção verificada pelo CodeQL

O SARIF identificou `js/bad-tag-filter`: a expressão que enumera scripts precisava reconhecer tags HTML em maiúsculas e capitalização mista. A enumeração de scripts/JSON-LD passa a usar o DOMParser nativo do navegador já instalado pelo Playwright do CI, em documentos inertes, destacados e offline, sem execução de scripts ou rede. Não é feita filtragem de tags por regex. O parser semântico complementa a preservação literal do diff autorizado. Dez mutações adicionais (duas por página) comprovam que `<SCRIPT>` e `<sCrIpT>` são reconhecidos e rejeitados quando introduzem código não autorizado. O contrato delimitado de conteúdo permanece estrito. A etapa temporária de leitura de SARIF foi retirada e o workflow original do CodeQL restaurado integralmente; nenhum alerta é suprimido.

## Execução e evidências

O ambiente desta retomada não tem executor local. A validação real em Node, Chromium e WebKit é feita pelos workflows existentes do GitHub, com o código e a base exatos. A checagem preparatória em memória validou a reconstrução dos 45 fragmentos e a rejeição das 86 mutações; isso não é apresentado como execução de navegador.

Os resultados definitivos de **cada novo HEAD**, links de jobs/artefatos, capturas revisadas, métricas e parecer estão na [descrição do PR #128](https://github.com/olegariotech-site/olegariotech-site/pull/128). Falhas funcionais expostas após o contrato serão investigadas individualmente antes de GO. Uma execução interrompida ou um artefato antigo não vale como prova atual.

Os logs de exportação existentes fornecem as dez comparações de primeira dobra, cinco OGs e cinco prévias verticais; os artefatos guardam capturas completas e JSONs. A comparação de performance continua contra a produção fixa. Valores de laboratório não certificam CWV, INP ou desempenho em aparelhos físicos.

## Governança

O PR #125 permanece independente (HEAD consultado no início: `a30337c469a452d682620ba0d19116978aab4c08`). Nenhuma escrita nessa branch. A Issue #126 continua aberta; clique não confirma conversa. Nenhuma alteração de GA4, Pixel, consentimento ou semântica de eventos.

Manter PR #128 em draft. GO técnico não autoriza merge, publicação, campanhas ou custos.
