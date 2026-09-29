# Card social padrão OT

Antes de publicar um novo site ou campanha, conferir:

1. Criar uma capa **JPG 1200 × 630**, com nome novo e versionado (`cliente-social-preview-1200x630-v2.jpg`). Usar a identidade e imagens oficiais do projeto; testar a leitura reduzida a aproximadamente 400 × 210. Não usar automaticamente a imagem quadrada do logo ou um screenshot do site.
2. No HTML entregue pelo servidor, incluir `og:type`, `og:url` (canônica), `og:title`, `og:description`, `og:image`, `og:image:secure_url`, `og:image:type=image/jpeg`, `og:image:width=1200`, `og:image:height=630`, `og:image:alt`, `og:site_name` e `og:locale=pt_BR`. A imagem precisa ter URL **HTTPS absoluta** no domínio publicado.
3. Incluir `twitter:card=summary_large_image`, `twitter:title`, `twitter:description`, `twitter:image` e `twitter:image:alt` com a mesma capa. O título e a descrição devem identificar o negócio e a oferta sem depender do texto dentro da imagem.
4. Depois da publicação, conferir o HTML bruto com `curl -L -A 'facebookexternalhit/1.1' URL` e `curl -L -A 'WhatsApp/2.0' URL`. Checar `HTTP 200`, ausência de `noindex` e `robots.txt` sem bloqueio de `/` ou da capa. Conferir a imagem com `curl -IL URL_DA_IMAGEM`: `200` e `Content-Type: image/jpeg`; confirmar os pixels reais 1200 × 630.
5. Abrir a URL no depurador de compartilhamento da Meta e enviar o link em conversa de teste no WhatsApp. Verificar capa, título e descrição. Se o preview antigo persistir, solicitar nova leitura na Meta e testar a **página** com query string nova (por exemplo `?preview=20260929`), mantendo a URL canônica e o novo nome da imagem.

Não reutilizar o mesmo caminho de `og:image` para uma capa diferente: WhatsApp e Meta podem manter a versão anterior em cache. Registrar o URL final e a captura do teste na entrega.
