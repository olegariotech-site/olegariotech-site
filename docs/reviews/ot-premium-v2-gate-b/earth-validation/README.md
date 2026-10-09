# Terra — validação visual do PR #91

Gravação real de **11,5 segundos**, viewport **1440 × 900**, Chromium 151.0.7922.34, WebGL/SwiftShader e movimento habilitado. A aplicação é byte-idêntica ao commit **8667ec5473c7f97525826f2a6a91c6067698db65**; esta branch contém apenas automação e evidências de revisão.

[Assistir ao vídeo com áudio real](./earth-home-1440x900.mp4) · [Dados e verificações](./report.json)

A sequência mostra a Terra no HERO, sua rotação, a dissolução em partículas, as ondas e a entrada na vitrine Premium V2. Quadros extraídos do próprio MP4: [partículas, 9,1s](./particles.jpg), [ondas, 10,9s](./waves.jpg) e [vitrine, 11,4s](./premium-v2.jpg). [hero-start.jpg](./hero-start.jpg) é a captura inicial da página. Os tempos das amostras e de `operatorTimeline` no relatório usam o relógio do operador e não equivalem aos timecodes do arquivo, devido ao início da captura nativa.

Captura direta do desktop virtual, sem aceleração do filme ou da Terra. Rotação medida no trecho inicial: **7,71°**, em **10 poses reais**. O frame rate do renderer por software é baixo; o limite original de 100ms por quadro reduz a velocidade percebida nesta captura. O MP4 é codificado a 30 fps, mas isso não representa 30 quadros distintos do renderer por segundo nem certifica a fluidez em GPU física.

Áudio: clique no botão original ativa reprodução, volume desktop 0,25, loop e MP3 aprovados; o relógio avança e há sinal decodificado não nulo. O filme contém o stream real do elemento. Segundo clique pausa/muta e restaura ARIA/label. Não foi verificada a saída física de alto-falante. Zero erros JS/imagens 404.

Renderer, shaders, geometria, estilos, conteúdo e código de áudio não foram alterados. O fallback sem WebGL mantém a foto inicial estática por comportamento já existente, e reduced motion/mobile também desabilitam rotação.

Sem merge ou publicação. PR #91 permanece em rascunho para aprovação de Alexandre.
