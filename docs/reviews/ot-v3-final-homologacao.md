# OT V3 — refinamento final, 28/10/2026

PR #114 permanece em rascunho. Merge, deploy e publicação não autorizados.
Base: `66db8f5169c30b0904667b56c03a8e9d7e8c3549`; V3 aprovada visualmente:
`d89b56b546d1ec26e3ea4232b8e9eef642e2a810`. Nenhum novo redesign.

## Interação: diagnóstico e limites

A mediana anterior de 480 → 744 ms não isolava a versão: o
`scrollIntoViewIfNeeded()` deixava o painel em y≈908 na main e y≈564 na V3.
Havia cargas de pintura visíveis diferentes. A atribuição antiga também usava
a fase em que o observer entregava o evento, em vez do instante do evento.
Essa geometria foi registrada na reprodução da rotina anterior. O registro
histórico é preservado, mas não prova isoladamente uma regressão de 55%.

O novo laboratório usa Chromium 141 / Linux, 1440×900, HTTP local sem throttling,
um navegador, contextos novos sequenciais e ordem intercalada. Fontes reais têm
o mesmo transporte aquecido; a imagem inicial é decodificada, as imagens de
destino permanecem frias. O trilho fica em y≈90 e o painel em y≈249, com tolerância
menor que 1 px entre versões. Aguarda-se 1 s após o scroll e 350 ms após mover
o ponteiro; cliques nativos: recusar, Açaí, K.L, Ripamonti. Eventos tardios são
observados por mais 1,2 s e associados por `startTime` e `pointerdown` confiável.

Cinco amostras sem tracing por versão; amostra zero excluída:

| Maior Event Timing com interactionId por execução | main | V3 anterior | refinamento |
|---|---:|---:|---:|
| Mediana, todos os quatro controles | 504 ms | 416 ms | 392 ms |
| Faixa das cinco execuções | 400–576 ms | 352–440 ms | 344–456 ms |
| Mediana do maior evento só do showroom | 360 ms | 352 ms | 344 ms |

O +55% não reapareceu nesse cenário controlado. As amostras são pequenas e
variáveis; **não constituem ganho comprovado, INP de campo ou homologação**.
O controle de recusa e as trocas K.L/Ripamonti concentram os maiores tempos
no cenário alinhado. Os arquivos brutos preservam também eventos ausentes
no observer; ausências não são convertidas em zero.

Traces equivalentes, separados das medianas, mostram manipuladores de cerca de
0,2–0,7 ms e a maior parte dos eventos lentos na espera de apresentação. Há
trabalho expressivo de rasterização/composição no processo GPU, com tarefas
de raster de até 92–122 ms nas amostras instrumentadas. Totais inclusivos de
eventos aninhados não devem ser somados como tempo de parede. A observação não
isola a causa entre imagens, animação contínua e composição. O dispositivo
observado é ANGLE/SwiftShader; não há GPU física disponível. Isso **não prova
que uma GPU por software seja a causa** nem permite certificar hardware real.

Ocultar os novos destaques mantendo sua altura não eliminou a latência no
controle exploratório. Uma pausa breve da cena durante interação foi testada,
não teve benefício conclusivo e foi integralmente revertida. Os scripts da
Terra e da galáxia permanecem idênticos à base. Execuções interrompidas ou com
concorrência de processos foram explicitamente excluídas das comparações.

## Correções restritas

- Na primeira visita à home até 780 px, o consentimento passa ao fluxo, após
  o hero. O diagnóstico fica acessível sem escolher cookies. Revisitar pelo
  rodapé mantém painel fixo e retorno de foco. Não houve remoção de texto,
  política, opções ou guardas de tags. Recusar/aceitar têm alvos iguais de
  pelo menos 48 px. O painel avisa e permite personalizar antes de qualquer
  autorização opcional; continuar navegando não consente.
- Links das avaliações descrevem a listagem geral do Google. Conferência
  pública em 28/10 confirmou os trechos de Lucas e Cíntia. A pontuação/caixa de
  Evandro foi restaurada literalmente ao original publicado, sem reescrita.
- Texto do WhatsApp passou de branco a escuro sobre o verde aprovado; a
  assinatura do rodapé ganhou contraste. Layout e identidade preservados.
- Versões de cache atualizadas nas sete páginas e no carregador compartilhado.

**A autorização documental dos depoimentos continua PENDENTE de confirmação
pelo proprietário da OT. Uma fonte pública não comprova essa autorização.**

## Evidência e execução

O relatório entregue no PR contém comparativos de primeira tela e do próprio
aviso em 360/390/430 px, JSON bruto, traces comprimidos e estado dos workflows.
`verify-premium-v3-final.mjs` verifica três motores, seis variantes de largura/
versão, CTA sem obstrução, texto de privacidade, alvos iguais, teclado,
personalização, ausência de tags antes de consentir, revogação, foco e axe.
`verify-premium-v3.mjs` conserva a matriz de 21 combinações e contratos estáticos.
As suítes legadas do showroom e da imersão mantêm seus testes de execução.
A guarda de scripts inline examina o atributo `src` da tag de abertura, sem
confundi-lo com strings de imagens dentro do próprio JavaScript. A exceção
literal de Evandro é aplicada após extrair o script, preservando todo o resto.
No teste legado de soluções, `decode()` era chamado com `currentSrc` ainda
vazio em um `<picture>` recém-inserido. O diagnóstico registrou a imagem válida
carregando logo em seguida. O teste agora rola até a mídia, aguarda fonte
selecionada/carga/dimensões e continua exigindo decodificação, com limite de
15 s. Nenhum erro de imagem é ignorado; código de produção não foi alterado.
Um ciclo de CI também encerrou inesperadamente a página/processo WebKit em
768 px, sem reproduzir esse encerramento na matriz local completa. A causa
não foi atribuída à GPU ou ao ambiente sem evidência. O relatório de QA passa
a registrar eventos de crash/desconexão e contadores de memória do cgroup em
falha. A execução final e esse histórico devem ser considerados na revisão.
WebKit no Linux não equivale a certificação em Safari/iPhone; o mesmo vale para
emulação Android. Os destinos GA/Meta são interceptados nos testes.

```bash
npm install --no-save --package-lock=false playwright@1.56.1 @axe-core/playwright@4.10.2
npx playwright install --with-deps chromium firefox webkit
git worktree add --detach /tmp/ot-main 66db8f5169c30b0904667b56c03a8e9d7e8c3549
git worktree add --detach /tmp/ot-v3-before d89b56b546d1ec26e3ea4232b8e9eef642e2a810
node scripts/build-showroom.mjs --check
node scripts/verify-premium-v3.mjs
OT_V3_BEFORE_DIR=/tmp/ot-v3-before node scripts/verify-premium-v3-final.mjs
OT_PROFILE_ROOTS='{"main":"/tmp/ot-main","v3":"/tmp/ot-v3-before","current":"'"$PWD"'"}' \
  OT_PROFILE_VARIANTS=main,v3,current OT_PROFILE_SCENARIO=aligned \
  OT_PROFILE_SAMPLES=5 OT_PROFILE_TRACE=0 node scripts/profile-premium-v3.mjs
# Após encerrar o laboratório acima, coletar traces separados:
OT_PROFILE_ROOTS='{"main":"/tmp/ot-main","v3":"/tmp/ot-v3-before","current":"'"$PWD"'"}' \
  OT_PROFILE_VARIANTS=main,v3,current OT_PROFILE_SCENARIO=aligned \
  OT_PROFILE_SAMPLES=0 OT_PROFILE_TRACE=1 OT_PROFILE_OUTPUT=/tmp/ot-v3-traces \
  node scripts/profile-premium-v3.mjs
```

O finalizador pausa o tempo virtual **depois** de observar as interações para
esvaziar o stream de tracing de uma página continuamente animada. Amostras com
tracing são diagnósticas, nunca incluídas nas medianas. Executar perfis sem
outros testes/navegadores concorrentes. `OT_PROFILE_NATIVE_GPU=1` retira a
seleção explícita de SwiftShader, mas o relatório deve confirmar o dispositivo
efetivamente utilizado; a variável sozinha não comprova GPU física.

## Veredito

**Ainda bloqueado para homologação final.** A regressão de 55% não foi
reproduzida no cenário alinhado, mas permanecem latências de laboratório acima
de 200 ms, validação em hardware/aparelhos reais e confirmação documental dos
depoimentos. Workflows verdes certificam os contratos exercitados, não resolvem
esses impedimentos. Aguardar aprovação expressa de Alexandre e Hipásia.
