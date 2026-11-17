# OT — Contrato de eventos e publicação | Issue #126

**Estado:** candidato em PR isolado; nenhuma alteração em produção, Google Ads, Meta Ads, GA4, pagamentos ou consentimento neste trabalho.

## 1. Definição comercial obrigatória

| Etapa | Fonte / evento | É lead confirmado? | Uso de marketing |
|---|---|---|---|
| Visita | GA4 `session_start` / `page_view` | Não | Diagnóstico de aquisição; não extrapolar entre métricas de sessão e evento |
| Primeira resposta válida | `diagnostico_inicio` | Não | Engajamento; apenas um evento por rodada, mesmo sem âncora opcional |
| Cinco respostas + finalização | `diagnostico_concluido` | Não | Microconversão; um evento por rodada validamente concluída |
| Clique WhatsApp | `click_whatsapp` / Meta `Contact` | Não | **Intenção de contato**; NÃO otimizar como lead recebido |
| Conversa recebida | Confirmação humana/autorizada no OT Comercial/WhatsApp | Sim, contato recebido | Registro comercial externo, sem simular evento a partir da página |
| Lead qualificado | OT Comercial: necessidades, orçamento/fit, próximo passo | Sim, qualificado | `qualify_lead` somente após fonte confiável e política de dados |
| Proposta | OT Comercial | Não é venda | Negociação em andamento |
| Contrato assinado | OT Comercial | Cliente fechado | Valor e margem confirmados; conversão offline opcional, com consentimento apropriado |

O Google Ads recém-conectado ao GA4 **não** recebe automaticamente uma nova ação de conversão por este PR. O histórico de `generate_lead` (evento-chave no GA4) não deve ser reinterpretado como lead confirmado. A remoção ou alteração da condição de evento-chave no GA4 exige revisão manual separada, mantendo o histórico.

## 2. Mudanças no runtime (sem alterar design)

- `assets/js/ot-analytics-core.js`: registra `diagnostico_inicio` na primeira resposta válida e não no clique em `data-start-link`.
- `diagnostico_concluido` requer uma opção selecionada em cada uma das cinco categorias previstas e só pode ocorrer uma vez por rodada; reiniciar limpa a contagem.
- `click_whatsapp` e Meta `Contact` preservados como sinais de intenção; **não** emitir `generate_lead` / Meta `Lead` em cliques.
- `destination_url` de eventos enviados ao GA4 mantém apenas origem e caminho, removendo parâmetros como `?text=` (que poderiam conter nome do negócio, respostas e texto livre). O link real entregue ao WhatsApp **não é modificado**.
- `assets/js/ot-analytics.js` muda a versão do recurso de 7 para 8, para o futuro rollout.
- As categorias de consentimento e o modo de configuração do GA4/Pixel são preservados; não introduzir dados pessoais no GA4.

## 3. Evidência automatizada

`scripts/verify-analytics-funnel.mjs`, executado pelo workflow `analytics-funnel-qa.yml` em Chromium e WebKit, verifica:

- início por resposta sem botão opcional; nenhum início pela âncora sozinha;
- cinco respostas e conclusão válida, sem duplicação e com reinício permitido;
- clique WhatsApp sem conversão falsa no Google/Meta;
- ausência de nome de negócio nos parâmetros de evento;
- consentimento de análise/marketing concedido ou recusado independentemente;
- coletores externos interceptados pelo teste, sem disparos reais à produção.

O teste de interface simula jornadas, não comprova a chegada de uma mensagem WhatsApp. CI, logs e evidência precisam ser revisados antes de qualquer merge.

## 4. Gates antes de investir R$ 140

- [ ] Novo CI (Chromium + WebKit) verde no HEAD do PR.
- [ ] Revisar efeitos em testes legados de comparação byte a byte que protegiam o contrato anterior; **não** desligar silenciosamente gates nem alterar snapshots para forçar aprovação.
- [ ] QA na URL de homologação, com consentimento concedido/negado, sem contaminar relatórios de produção.
- [ ] Alinhar a marcação de eventos-chave do GA4: `generate_lead` histórico **não** é conversa confirmada.
- [ ] Definir uma forma manual/autorizada de registrar conversas recebidas e leads qualificados no OT Comercial.
- [ ] Conferir `gclid`, UTMs, página de destino, palavras-chave negativas e orçamento total + data de encerramento.
- [ ] GO explícito da direção OT para merge/publicação e **autorização separada** para ativar campanha.

## 5. Limitações e riscos que permanecem

- `diagnostico_inicio` e `diagnostico_concluido` dependem de consentimento de análise; relatórios não mostram todos os visitantes.
- A tela de conclusão do diagnóstico é controlada por `ot-diagnostic-v2.js`. O evento de conclusão agora valida as cinco respostas, mas este PR não reconstrói a UX nem impede navegação forçada por código.
- `generate_lead` e `Lead` antigos permanecem no histórico dos provedores; não corrigir dados retroativamente.
- Diferenças entre 52 `session_start` e 50 sessões agregadas por canal podem resultar de definições, cardinalidade ou atribuição; demandam reconciliação com mesmo período, filtros e dimensão.
- `l.wl.co / referral` deve permanecer referência/WhatsApp até prova de origem de aquisição.
- O orçamento pré-pago Google Ads (R$ 140) não é teto técnico de campanha. Configurar data de fim, objetivo de lances e limites de gastos disponíveis no painel antes de ativar.

**Referências:** [Issue #126](https://github.com/olegariotech-site/olegariotech-site/issues/126) · [Google Ads da OT](https://ads.google.com/) · [Windsor.ai](https://onboard.windsor.ai/)
