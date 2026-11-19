# OT — Google Search → WhatsApp | atribuição comercial (Issue #127)

## Escopo do candidato

- Branch isolada. Não publicar, não criar/ativar anúncios e não alterar orçamento, pixel, GA4 ou consentimento.
- A página comercial já passa UTMs válidas a links internos (principalmente ao Diagnóstico).
- Quando há **ambos** `utm_source=google` e `utm_medium=cpc` (ou `ppc`), anexar ao texto de WhatsApp uma referência **fixa e não pessoal**, baseada na página de serviço:
  - Sites Valinhos: `OT-GADS-SITES-VALINHOS`
  - Sites Campinas: `OT-GADS-SITES-CAMPINAS`
- Após navegação serviço → diagnóstico, usar `origem` da própria navegação para preservar o contexto; o relatório e as respostas do visitante continuam no texto.
- Não copiar `gclid`, `utm_campaign`, telefone, querystring ou identificadores livres para a referência; não transmitir o texto de WhatsApp ao GA4.
- Não adicionar `generate_lead`, Meta `Lead` ou disparo de conversão de recebimento: apenas um marcador no rascunho de contato **iniciado pelo visitante**. O usuário precisa enviar a mensagem no aplicativo para que o atendimento possa recebê-la.

## Configuração exigida para o piloto (não executada)

O Google Ads deve chegar às páginas regionais incluindo UTMs seguras. Exemplo de URL final para Valinhos:

`https://olegariotech.com.br/criacao-de-sites-valinhos/?utm_source=google&utm_medium=cpc&utm_campaign=ot_pesquisa_valinhos`

Campinas:

`https://olegariotech.com.br/criacao-de-sites-campinas/?utm_source=google&utm_medium=cpc&utm_campaign=ot_pesquisa_campinas`

Manter auto-tagging onde estiver habilitado; o `gclid` pode existir na URL inicial, mas **não** é copiado para o WhatsApp e **não** acompanha a navegação por este helper. O código é uma *pista operacional*, nunca prova de clique pago autenticado, conversa enviada ou conversão atribuída. Usuários podem editar URLs e mensagens.

## Testes

`node scripts/verify-ads-whatsapp-origin.mjs`

Cenários: caminhos regionais, paid/organic, duplicação, resumo gerado no diagnóstico, URL interna/UTM, número e protocolo WhatsApp, preservação de texto e privacidade. Teste offline sem requisições, sem enviar mensagens e sem poluir GA4.

## Bloqueios antes de merge e ativação

- [ ] CI total, inclusive contratos históricos de preservação: adaptar por **exceção estrita revisada**, não desabilitar guards.
- [ ] Atualizar `?v=1` de `ot-commercial-context.js` nas páginas comerciais, com QA dos contratos estáticos e cache; a branch atual **não** muda HTML.
- [ ] QA em navegador mobile/desktop, com cliques interceptados e consentimento concedido/negado, sem disparo de mensagens reais; confirmar que os CTAs dinâmicos continuam funcionais.
- [ ] Smoke e homologação em URL de produção **após** autorização de publicação.
- [ ] Revisar no GA4 o `generate_lead` histórico e conversões primárias/secundárias no Google Ads.
- [ ] Criar campanha pausada com orçamento e prazo explícitos; ativar somente mediante autorização separada.

## Atendimento

O Alexandre continua responsável por confirmar manualmente o recebimento da conversa, registrar no OT Comercial a necessidade, o estágio e a próxima ação. Nenhuma automação de resposta.
