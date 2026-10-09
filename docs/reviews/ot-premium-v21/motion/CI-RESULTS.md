# Validação final do PR #93

Aplicação validada: `3c5a507807874e7a95f6b51085bd521668210ac0`. Base: `cef32459b58c3ce779e526a4e6ef7b76e74f8c67`. **PR em rascunho, sem merge ou publicação.**

| Workflow | Resultado | Evidência |
| --- | --- | --- |
| Home integrada — Chromium + WebKit | Aprovado | [Run 37936497898](https://github.com/olegariotech-site/olegariotech-site/actions/runs/37936497898) |
| Immersive + Soluções existentes | Aprovado | [Run 37936497909](https://github.com/olegariotech-site/olegariotech-site/actions/runs/37936497909) |
| CodeQL JavaScript | Aprovado | [Run 37936497808](https://github.com/olegariotech-site/olegariotech-site/actions/runs/37936497808) |
| Filme WebGL + áudio original | Aprovado | [Run 37936736190](https://github.com/olegariotech-site/olegariotech-site/actions/runs/37936736190) |

Home em cada engine: sete viewports, dois reduced motion, seis cases, vistas, dispositivos, expansão, troca rápida, teclado/foco, disclosure, links oficiais/contextuais, resize e consentimento/analytics sem duplicação. Chromium também verifica zoom e performance reduzida. Atmosfera em cada engine: sete viewports e quatro cenários de preferências/ciclo de vida. A bateria existente passou em dez cenários de experiência e nove de soluções.

Captura nativa: 1440 × 900, 21,01 s, WebGL real por SwiftShader, 15 poses da Terra, 12° de rotação inicial, áudio MP3/loop/volume/ARIA preservados, 630 quadros + AAC. [Filme](./ot-v21-journey-1440x900.mp4) · [Timecodes nativos conferidos](./TIMECODES.md). Sem simular/acelerar o planeta. Ambiente por software não certifica fluidez em GPU física.

## Performance com movimento — CI

Medianas de três contextos frios alternados por versão/viewport, home completa. Mesmos browser/HTTP/fontes, consentimento recusado; sem throttling artificial. [Amostras emitidas pelo job](./ci-results.json). O JSON integral, incluindo renderer e tempos de prontidão dos cases, fica no artefato abaixo.

| Viewport | LCP antes → depois | CLS antes → depois | Corpos antes → depois | Canvas JS P95 antes → depois | Máximo Event Timing por run, na mediana |
| --- | --- | --- | --- | --- | --- |
| 1440 × 900 | 160 → 156 ms | 0,05680 → 0,04245 | 2668,7 → 2673,1 KiB | 59,8 → 9,8 ms | 144 → 144 ms |
| 390 × 844 | 144 → 140 ms | 0,30444 → 0,30444 | 2032,3 → 2036,6 KiB | 17 → 2,7 ms | 136 → 128 ms |

**Custo adicional confirmado: 4424 bytes / 4,32 KiB.** Atmosfera inicial mais barata em submissão JS, mas agora permanece em atividade após HERO: 18–20 pinturas/s desktop e 12/s mobile nesta medição; anteriormente zero. Canvas JS P95 não mede rasterização GPU. Event Timing máximo não equivale a INP de campo. Pequenas diferenças de LCP não comprovam melhoria de desempenho.

**Variação mobile:** antes, CLS 0,30444–0,30496; depois, 0,28748–0,36975. A mediana é igual, porém uma amostra V2.1 é maior em 0,06479 que o máximo da base. Não há isolamento causal; o CLS elevado já está presente na main. Manter essa limitação visível na aprovação e validar em dispositivo real antes de qualquer decisão sobre produção. Dados locais registram também tempos desfavoráveis de desktop; não substituí-los pelos resultados favoráveis do CI.

## Artefatos completos

- [Chromium — PNGs, home, atmosfera e medições com/sem movimento](https://github.com/olegariotech-site/olegariotech-site/actions/runs/37936497898/artifacts/11620770609)
- [WebKit — PNGs, home e atmosfera](https://github.com/olegariotech-site/olegariotech-site/actions/runs/37936497898/artifacts/11619495177)
- [Regressão existente](https://github.com/olegariotech-site/olegariotech-site/actions/runs/37936497909/artifacts/11618519027)

Home/atmosfera: retenção até 08/11/2026; regressão existente até 23/10/2026. Comparativos WebP, relatório local e filme permanecem versionados. Sem certificação de Safari/iPhone/GPU físicos, leitor de tela humano, saída física do alto-falante ou WhatsApp enviado.

A aplicação desta branch de evidência permanece byte-idêntica ao commit validado; apenas automação e documentação de revisão diferem. **Aguardar aprovação visual e funcional de Alexandre.**
