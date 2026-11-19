# OT Experience Comercial — auditoria inicial da jornada

**Projeto:** Olegario Tech (olegariotech.com.br)  
**Data de referência:** 22/10/2026  
**Origem:** `main` no commit `66db8f5169c30b0904667b56c03a8e9d7e8c3549`  
**Branch:** `review/ot-customer-experience-20261022`  
**Escopo:** revisão estática de HTML, CSS e JavaScript. **Não é uma homologação visual em navegadores.**

## Objetivo

Melhorar a clareza e conversão da jornada do cliente sem alterar a identidade cinematográfica aprovada: Terra, partículas, constelações, som, portfólio e narrativa visual.

## Jornada real identificada no código

1. Home apresenta "Sites que geram negócios", CTA "Fazer meu diagnóstico gratuito" e CTA secundário "Ver projetos reais".
2. Existe acesso **direto** ao WhatsApp no site, inclusive no cabeçalho mobile (transformado pelo `assets/js/ot-mobile-v3.js`); o diagnóstico não é obrigatório.
3. Portfólio mostra projetos e CTAs para visitar e conversar com a OT.
4. O diagnóstico digital apresenta cinco perguntas; nome do negócio é opcional na etapa final.
5. A tela de resultado monta um resumo com base nas respostas e abre o WhatsApp com mensagem pré-preenchida. **Não gera nem envia automaticamente um plano de ação personalizado.**

## Achados e prioridades

| Prioridade | Achado | Evidência no código | Direção |
|---|---|---|---|
| P1 | Rótulo do botão final prometia "Receber meu plano de ação" | `diagnostico-digital/index.html`; `assets/js/ot-diagnostic-v2.js` apenas prepara `wa.me` | **Corrigido na branch:** "Conversar sobre meu diagnóstico no WhatsApp" |
| P1 | Eventos `generate_lead` e Meta `Lead` ocorrem no **clique** em certos links WhatsApp, não na confirmação de conversa | `assets/js/ot-analytics-core.js`, `classifyClick` | **Não alterar ainda:** separar intenção de contato de lead confirmado; preservar séries históricas e revisar impacto de otimização de campanhas |
| P1 | Header mobile com toque reduzido (áudio 36–38 px; WhatsApp 38–40 px) e fonte de 0,66–0,70 rem | `assets/css/ot-mobile-v3.css` | **Ajustado na branch:** controles com 44 px e fonte WhatsApp de 0,72–0,75 rem. Exige teste de overflow e toque em 320–430 px |
| P2 | Navegação mobile usa rótulos de cerca de 0,6 rem no CSS base | `index.html` (`.mobile-nav a`) | Investigar legibilidade sem cortar títulos ou aumentar densidade |
| P2 | Hero tem diagnóstico e prova, mas o contato imediato deve permanecer evidente em desktop e mobile | `index.html`, `assets/js/ot-mobile-v3.js` | Manter ambos os caminhos; testar ordem dos CTAs em vez de adicionar mais controles |
| P2 | Presença de efeitos visuais e módulos JS precisa ser testada sob redes/dispositivos modestos | home e assets JS/CSS | Medir LCP, INP, CLS, consumo e fallback; não remover efeitos sem medição |

## Alterações isoladas nesta revisão

- `diagnostico-digital/index.html`: somente texto do CTA final do diagnóstico.
- `assets/css/ot-mobile-v3.css`: somente dimensões e legibilidade dos controles WhatsApp e áudio no cabeçalho mobile.

**Fora de escopo:** alterar `main`, publicar, mudar desenho do hero, mexer nas marcas, integrar delivery, alterar eventos de Analytics sem plano de migração ou adicionar efeitos.

## Testes estáticos executados

- CTA do diagnóstico trocado exatamente uma vez; links de WhatsApp inalterados.
- CSS dos dois controles apresenta mínimos de 44 px nos breakpoints examinados.
- Elementos cromáticos e regras de media query preservados.
- Branch deriva da `main`; nenhuma alteração foi aplicada à `main`.

## QA obrigatório antes de publicar

1. Capturas e interação em larguras 320, 360, 390, 430, 768, 1366 e 1920 px, incluindo iOS Safari/WebKit e Android Chromium; verificar que logo, áudio e WhatsApp não se sobrepõem no header.
2. Testar por teclado e toque o botão WhatsApp e o controle de áudio, inclusive os estados `prefers-reduced-motion` e áudio desligado.
3. Executar o diagnóstico completo, voltar etapas, reiniciar e verificar resultado e mensagem montada no WhatsApp. Não enviar mensagem real durante QA.
4. Validar links de projetos, privacidade, CTA de diagnóstico e acessibilidade.
5. Comparar capturas da versão atual e da branch, incluindo layout mobile e notebook. Verificar regressão em Terra e efeitos.
6. Coletar Web Vitals (LCP, INP e CLS) e tempos por navegador; não inventar valores.
7. Após aprovação explícita do proprietário, planejar publicação e monitoramento de cliques, contatos confirmados, propostas e contratos.

## Observação sobre métricas comerciais

O evento de clique WhatsApp é um **sinal de intenção**, não prova de conversa recebida. Para avaliar conversão em vendas, confrontar os cliques com registros de mensagens efetivamente recebidas, reuniões, propostas e contratos no CRM, sem vincular dados pessoais indiscriminadamente.
