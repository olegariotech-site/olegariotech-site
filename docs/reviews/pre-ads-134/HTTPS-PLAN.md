# P1-02 - Plano HTTPS para aprovação separada

**Somente plano. Nenhuma alteração de Pages, domínio, CNAME, DNS, certificado ou hospedagem é feita por este PR.**

A auditoria encontrou `http://olegariotech.com.br/` respondendo 200 e a origem `https://olegariotech-site.github.io/olegariotech-site/` redirecionando para HTTP. A URL final HTTPS das landings não apresentou downgrade. Revalidar o estado imediatamente antes de uma intervenção: dados de domínio e certificados podem mudar.

## Preparação para uma decisão concreta

1. Confirmar em leitura que a publicação continua no GitHub Pages, a branch de publicação é a prevista e `CNAME` mantém `olegariotech.com.br`.
2. Registrar A/AAAA/CNAME atuais e resultado de DNS. Confirmar ausência de serviço/proxy intermediário que altere redirects. Não remover registros só por existir mais de um: confrontar com a documentação vigente do GitHub e a configuração real.
3. Conferir certificado de origem, nomes cobertos (`olegariotech.com.br` e `www` se utilizado), validade, cadeia, provisionamento e eventuais avisos em Settings > Pages. A inspeção desta VM passa por proxy; não interpretar o certificado do proxy como o certificado de origem.
4. Apresentar à direção o estado do Enforce HTTPS, disponibilidade do certificado, alterações estritamente necessárias e rollback. Se houver mudança de DNS, detalhar registros/valores/TTL e impactos antes de solicitar autorização.

## Execução proposta, ainda não autorizada

Se DNS, CNAME e certificado estiverem corretos e o único problema for o enforcement, propor habilitar **Enforce HTTPS** na configuração existente de Pages. Não trocar plataforma. Se a opção estiver indisponível ou o certificado não estiver pronto, primeiro identificar a causa e apresentar novo plano; não improvisar alteração de domínio.

## Aceite pós-intervenção

- HTTP raiz e ambas as landings terminam no domínio canônico HTTPS, sem ciclo ou downgrade.
- `www`, origem `github.io` e variante sem barra final chegam ao endereço canônico esperado.
- Preservar caminho, `utm_source`, `utm_medium`, `utm_campaign`, `utm_content` e `utm_term`; conferir as referências OT no rascunho.
- Certificado válido em navegador comum; sem conteúdo misto ou recursos ausentes.
- Diagnóstico completo, WhatsApp, políticas e consentimento continuam funcionando em desktop/mobile.

## Riscos e retorno

Certificado incompleto pode causar erro de conexão; alteração DNS desnecessária pode causar indisponibilidade ou afetar outros serviços; regra incorreta pode criar ciclos e perder parâmetros comerciais. Registrar previamente os valores exatos atuais e a hora da intervenção. Se houver incidente, retornar apenas a configuração efetivamente modificada e autorizada, verificando novamente DNS, certificado e redirects. A direção deve aprovar separadamente qualquer ação que reduza a proteção para resolver uma emergência.

**Decisões independentes:** aprovar código deste PR; autorizar a intervenção HTTPS; autorizar mídia e seu limite. Este documento não concede nenhuma das três autorizações.
