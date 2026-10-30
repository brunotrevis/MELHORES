# Melhores do Ano 2026 · Pinguim Doidim

Site da votação e da cerimônia de premiação do clã. Funciona direto no GitHub Pages, sem servidor próprio.

- **index.html**: a cerimônia para os membros. Abertura, o clã, os membros, os troféus, login e votação (uma categoria por tela, com troféu e cartões para arrastar), revisão e envio dos votos lacrados.
- **cerimonia.html**: a apuração ao vivo, só para a comissão. Nenhum resultado aparece antes de você clicar em **Revelar ganhador**.

## Estrutura

```
index.html            site da votação
cerimonia.html        revelação ao vivo (comissão)
css/estilo.css        visual completo
js/dados.js           ← membros, bios, fotos, categorias, opções, áudios (edite aqui)
js/config.js          ← Firebase, e-mails da comissão, datas (edite aqui)
js/app.js             lógica da votação
js/cerimonia.js       lógica da revelação
js/backend.js         login e gravação dos votos
js/trofeu.js          desenho dos troféus
js/efeitos.js         sons, partículas, transições, confete
assets/img/           logo, mascote dourado, mascote cristal, marca d'água
assets/membros/       fotos (jpg) e recortes sem fundo (png, 600×800)
midia/audios/         áudios em mp3
midia/videos/         vídeos em mp4 (ou use links do YouTube)
firestore.rules       regras de segurança do banco de votos
```

## Modo "vem aí" (votação fechada)

Em `js/config.js`, `votacaoAberta: false` deixa o site no modo de divulgação: abertura, clã, membros e troféus ficam abertos, e no lugar da votação aparece a tela **A votação abre em breve** com a lista das categorias. Se preencher `aberturaVotacao` com uma data, aparece uma contagem regressiva.

Quando for liberar: configure o Firebase (abaixo), mude para `votacaoAberta: true` e suba o `config.js` de novo. O link continua o mesmo.

## Testar no computador

Dá para abrir o `index.html` com dois cliques, mas o ideal é rodar um servidor local na pasta:

```
python -m http.server 8000
```

e abrir `http://localhost:8000`. Sem o Firebase configurado, o site fica em **modo demonstração**: qualquer e-mail entra e os votos ficam guardados só naquele navegador. Na `cerimonia.html`, o botão **Gerar votos de teste** cria votos fictícios para você ensaiar a revelação.

## Publicar no GitHub Pages

1. Crie um repositório no GitHub (ex.: `melhores-do-ano`).
2. Envie todos os arquivos desta pasta (pode arrastar tudo em **Add file → Upload files**).
3. Em **Settings → Pages**, escolha **Deploy from a branch**, branch `main`, pasta `/ (root)` e salve.
4. Em um ou dois minutos o site fica em `https://SEU-USUARIO.github.io/melhores-do-ano/`.
5. A cerimônia fica em `https://SEU-USUARIO.github.io/melhores-do-ano/cerimonia.html`. Não divulgue esse link no grupo.

## Ligar a votação de verdade (Firebase, gratuito)

O GitHub Pages só hospeda arquivos. Para o login por e-mail e para guardar os votos, o site usa o Firebase.

1. Entre em [console.firebase.google.com](https://console.firebase.google.com) e crie um projeto (pode desativar o Analytics).
2. Na página do projeto, clique no ícone **`</>`** (Web), dê um nome e registre o app. Copie o objeto `firebaseConfig` e cole em `js/config.js`, no lugar de `firebase: null`:
   ```js
   firebase: {
     apiKey: '...',
     authDomain: '...',
     projectId: '...',
     appId: '...',
   },
   ```
3. **Authentication → Começar → Método de login**:
   - ative **E-mail/senha** e, dentro dele, **Link do e-mail (login sem senha)**;
   - ative **Google** (opcional, mas ajuda quem usa Gmail).
4. **Authentication → Configurações → Domínios autorizados**: adicione `SEU-USUARIO.github.io`.
5. **Firestore Database → Criar banco de dados**, modo de produção, região `southamerica-east1` (São Paulo).
6. Na aba **Regras** do Firestore, apague o que estiver lá, cole o conteúdo de `firestore.rules`, troque `SEU-EMAIL@gmail.com` pelo seu e-mail e clique em **Publicar**.
7. Em `js/config.js`, coloque o mesmo e-mail em `admins`.
8. Suba os arquivos alterados para o GitHub e teste: vote com um e-mail, depois abra a `cerimonia.html` com o e-mail da comissão.

**Dica para o grupo:** quem abrir o link pelo WhatsApp pode ter problema com o botão do Google dentro do navegador do app. O link por e-mail funciona sempre; se preferir, oriente a abrir no Chrome/Safari.

## Editar o conteúdo (`js/dados.js`)

- **Membros**: `nick`, `nome`, `titulo` (frase curta em dourado) e `bio`. As bios atuais são provisórias.
- **Fotos**: `foto` é a foto normal; `recorte` é a versão sem fundo usada nos cartões (PNG 600×800, pessoa encostada na borda de baixo). Se não tiver recorte, apague a linha `recorte` e o site usa a foto normal.
- **Foto do clã**: em `evento.fotoCla` coloque o caminho (ex.: `'assets/img/foto-cla.jpg'`). Enquanto for `null`, aparece a montagem com os recortes.
- **Áudio de abertura** e **áudio por membro**: campos `audioAbertura` e `audio`.
- **Categorias**: a ordem da lista é a ordem da votação e da revelação. Para mudar o texto, edite `nome` e `texto`.
  - `tipo: 'membros'` vota nos membros. Use `indicados: ['id1', 'id2']` para limitar quem concorre.
  - `tipo: 'opcoes'` vota em opções (frase, áudio, vídeo, lance). Cada opção:
    ```js
    { id: 'p1', titulo: 'Clutch de 4 no galpão', autor: 'zheus', video: 'midia/videos/clutch.mp4' }
    ```
    `autor` (id do membro) faz o troféu dessa categoria contar para ele no Pinguim Imperador. Também aceita `audio`, `imagem` e link do YouTube em `video`.
  - Remova `provisorio: true` quando colocar as indicações de verdade.
- **Ícone do troféu**: campo `icone` (nomes disponíveis em `js/icones.js`).

Vídeos grandes pesam no GitHub (limite de 100 MB por arquivo). Para clipes longos, suba no YouTube como "não listado" e use o link.

## A cerimônia ao vivo (`cerimonia.html`)

1. Entre com o e-mail da comissão.
2. O **painel** mostra só quem já lacrou os votos. Nenhum resultado aparece ali.
3. **Abrir a cerimônia** toca a abertura. Em cada categoria, clique em **Revelar ganhador**: o holofote passa pelos indicados com rufar de tambor e para no vencedor. Depois aparece a tela do troféu com confete e a contagem de votos (para esconder a contagem, use `mostrarContagemNaRevelacao: false` em `config.js`).
4. Na categoria de áudio, o áudio vencedor toca sozinho na revelação.
5. Empates mostram todos os vencedores juntos e cada um recebe o troféu.
6. No fim, **Revelar o Pinguim Imperador** faz a corrida dos troféus e coroa quem venceu mais categorias. Desempate: mais votos somados em todas as categorias.
7. Atalhos: setas ← → trocam de categoria, Esc fecha a tela do vencedor. O ícone de grade no topo abre a lista de categorias.
8. **Exportar todos os votos (CSV)** fica no painel. Use só depois da cerimônia.

Para transmitir no Discord, compartilhe a aba do navegador com o áudio ligado.

## Créditos

- Fonte Saira (SIL Open Font License), em `assets/fonts`.
- Ícones Tabler Icons (MIT), em `js/icones.js`.
- Sons gerados pelo próprio navegador, sem arquivos.
