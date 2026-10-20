# OT Site Quality — distribuição pública

Este repositório hospeda **apenas a automação técnica genérica de QA** necessária para que outros repositórios públicos da Olegario Tech possam reutilizar o quality gate.

A inteligência privada continua fora daqui:
- OT Marketing Intelligence;
- OT Design Intelligence;
- regras internas de pesquisa;
- contexto e estratégia de clientes.

## Reusable workflow

Arquivo:

`.github/workflows/reusable-site-quality.yml`

Ele valida:
- Chromium + WebKit;
- desktop + mobile;
- overflow horizontal;
- CTA principal opcional;
- axe/WCAG;
- links internos quebrados;
- erros de browser/console;
- clipping potencial;
- screenshots;
- Lighthouse;
- budgets técnicos;
- evidências em artifacts.

## Uso

Outros repositórios públicos podem chamar este workflow por branch, commit SHA ou tag.

Enquanto estiver em validação, use uma branch ou SHA de teste.

Após release estável, callers devem preferir uma tag imutável/versionada.
