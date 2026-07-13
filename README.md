# Olegario Tech — site oficial

Site institucional e comercial da **Olegario Tech**, por Alexandre Olegario.

- Domínio oficial: https://olegariotech.com.br/
- Repositório: `olegariotech-site/olegariotech-site`
- Publicação: GitHub Pages
- Fonte publicada: branch `main`, pasta raiz
- WhatsApp oficial: +55 11 91245-9144

## Estrutura principal

- `index.html` — página inicial, portfólio, planos, apresentação, produtos digitais, FAQ e CTAs.
- `diagnostico-digital/index.html` — diagnóstico gratuito com envio do resumo para o WhatsApp.
- `assets/img/` — identidade, projetos, capas, favicons e imagens sociais.
- `assets/audio/background.mp3` — áudio da experiência imersiva.
- `CNAME` — domínio personalizado do GitHub Pages.
- `robots.txt` e `sitemap.xml` — rastreamento e indexação.
- `site.webmanifest` — instalação e identidade do site em dispositivos.
- `AGENTS.md` — regras obrigatórias para manutenção segura.

## Fluxo de alteração

1. Criar uma branch a partir da `main`.
2. Alterar os arquivos completos; não aplicar remendos automáticos por workflow.
3. Testar HTML, CSS, JavaScript, links internos e WhatsApp.
4. Conferir desktop e mobile.
5. Abrir um Pull Request.
6. Revisar o preview/diff e só então fazer merge na `main`.
7. Confirmar a publicação no domínio oficial.

A `main` não deve receber alterações diretas sem autorização explícita.

## Validação rápida

Com Node.js instalado:

```bash
npx html-validate index.html --rule=no-inline-style:off
npx html-validate diagnostico-digital/index.html --rule=prefer-native-element:off
```

Também conferir:

- menu desktop e mobile;
- todos os CTAs para `https://wa.me/5511912459144`;
- imagens do portfólio;
- links de compra da Kiwify;
- áudio apenas após interação do usuário;
- `https://olegariotech.com.br/robots.txt`;
- `https://olegariotech.com.br/sitemap.xml`;
- visual em telas de 360 px e 1440 px.

## Conteúdo protegido

Não remover sem auditoria e aprovação:

- `CNAME`;
- favicons, OG images, `robots.txt` e `sitemap.xml`;
- logo oficial;
- áudio da experiência;
- apresentação da Olegario Tech;
- eBooks e produtos digitais;
- portfólio;
- schema `LocalBusiness`;
- WhatsApp oficial;
- fundo neural e experiência visual.
