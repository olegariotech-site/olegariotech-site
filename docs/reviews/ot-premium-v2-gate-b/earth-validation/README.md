# Terra — validação visual do PR #91

Gravação real de **11,5 segundos**, viewport **1440 × 900**, Chromium 151.0.7922.34, WebGL/SwiftShader e movimento habilitado. A aplicação é byte-idêntica ao commit **8667ec5473c7f97525826f2a6a91c6067698db65**; esta branch contém apenas automação e evidências de revisão.

[Assistir ao vídeo com áudio real](./earth-home-1440x900.mp4) · [Dados e assertions](./report.json)

0–4,5s: Terra inteira e rotação original. 4,5–6,5s: partículas. 6,5–9,1s: ondas. 9,1–11,5s: vitrine Premium V2 integrada. Captura direta do desktop virtual, sem aceleração do filme ou da Terra. Rotação medida no trecho inicial: **7.71°**, em **10 poses reais**. O frame rate do renderer por software é baixo; o cap de 100ms por quadro da implementação original reduz a velocidade percebida nesta captura. Isso não certifica a fluidez em GPU física.

Áudio: clique no botão original ativa playback, volume desktop 0,25, loop e MP3 aprovados; o relógio avança e há sinal decodificado não nulo. O filme contém o stream real do elemento. Segundo clique pausa/muta e restaura ARIA/label. Nenhuma certificação de saída física de alto-falante. Zero erros JS/imagens 404.

Renderer, shaders, geometria, estilos, conteúdo e código de áudio não foram alterados. O fallback sem WebGL mantém a foto inicial estática por comportamento já existente, e reduced motion/mobile também desabilitam rotação.

Sem merge ou publicação. PR #91 permanece em rascunho para aprovação de Alexandre.
