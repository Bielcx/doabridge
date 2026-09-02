# Base Batches 004 — preparação da inscrição

> Prazo: **9 de setembro de 2026**. Aceites em 17/set, programa 21/set a 15/nov (virtual),
> Demo Day 17/nov em Nova York.
>
> **O formulário NÃO salva rascunho.** Tudo precisa estar pronto aqui antes de abrir.
> Ele exige submissão escrita **e vídeo**.

## Bloqueadores

- [ ] **URL do produto no ar.** Campo obrigatório. Sem deploy não dá pra submeter.
- [ ] **Vídeo do time fundador, 1 a 5 minutos.** Obrigatório.
- [x] **Perfil no X.** `@usedoabridge`, nome de exibição "Do A Bridge".
- [ ] **Telegram e LinkedIn.** Obrigatórios. Domínio `doabridge.com` registrado.

---

## Seção 1 — Company

**Company Name**

> Do A Bridge

**What are you building?**

> Rascunho. Revisar tom e cortar o que não for verdade.

Do A Bridge is a standalone interface for the canonical Base ↔ Solana bridge.

Base shipped that bridge as infrastructure, not as a product: it lives embedded
inside Zora, Aerodrome, Virtuals and Relay, and there is no public app where
someone can simply open a page and use it. Every other route between Solana and
Base runs through third-party liquidity, where a market maker prices the
transfer and takes a spread.

We route through Base's own contracts instead, attested by Coinbase and
Chainlink. A transfer is one to one with no spread: SOL locks in Base's vault
and mints as an ERC-20 on the other side. The fee is flat per message, so
bridging 100 SOL costs the same as bridging 0.1.

Solana to Base works today. We are building the return leg, which needs a
proving step, and the transfer-state interface that makes that leg survivable
for a normal user.

**Website / Product URL**

> PENDENTE — depende do deploy.

**X URL**

> https://x.com/usedoabridge

**Which category best describes your company?**

> **DeFi**
>
> As opções são: Trading, Payments, DeFi, Financing, Tokenization, AI/Agents,
> Prediction Markets, Consumer, Other. Bridge canônico é infraestrutura DeFi —
> encaixe direto. A página de marketing fala em "asset issuance", que também
> descreveria o mint do ERC-20, mas DeFi é mais honesto e menos forçado.

---

## Seção 2 — Team

**Founder 1 — Name**

> Gabriel Cavalcanti

**Role**

> PENDENTE — "Founder" ou "Founder & Engineer".

**Brief description of previous professional experiences**

> PENDENTE — precisa do teu histórico. Vale puxar: trabalho atual, contribuições
> open source no SkateHive, projetos entregues pra cliente real.

**Tell us about the hardest problem you've solved or the most significant period
of adversity you've faced (personal or professional). How did you navigate it,
and what did you learn from it?**

> PENDENTE — esta é a pergunta mais pesada do formulário e a mais pessoal.
> Não dá pra terceirizar: precisa ser tua história, com detalhe concreto.
> Escreve em português primeiro se for mais fácil, depois traduzimos.

**Email**

> gabriel@doabridge.com (Cloudflare Email Routing, encaminha pro Hotmail)

**Telegram / X / LinkedIn**

> PENDENTE — os três são obrigatórios.

**Team Size**

> 1–4

**Location**

> PENDENTE — cidade e país.

**Founding Team Video Pitch (1–5 minutes)**

> PENDENTE. Ver roteiro abaixo.

---

## Seções 3 e 4 — Product & Traction, Why Base

Só abrem depois de preencher as anteriores, então as perguntas exatas ainda são
desconhecidas. Pelo nome, dá pra antecipar o material:

**Product & Traction** provavelmente pede estágio, usuários, métricas e evidência
de que algo funciona. Material disponível:

- Transferência canônica Solana → Base funcionando em devnet, com prova pública:
  assinatura Solana `2YY3zY4Xd2wgzVJRMguaK6SLHsW1SYcC4QwnJAS4kTpGUWVY7411g5XbuodWPApvkew2VJnJzv5TfjFuUH5BULeZ`
  e o mint de 0.1 `ERC-20: Solana` na Base Sepolia, vindo de `0x0000...0000`.
- Ethereum ↔ Base cotando e executando via LI.FI.
- Sem usuários ainda. Não inventar tração.

**Why Base** provavelmente pede por que Base é a rede principal. Material:

- O produto só existe por causa de uma peça de infraestrutura que é da Base:
  o bridge canônico Base ↔ Solana.
- O diferencial é não ser agnóstico de rede — é ser específico da Base.

---

## Roteiro do vídeo (1 a 5 minutos)

Note que o campo pede **"Founding Team Video Pitch"**, não demo de produto. Eles
querem ver a pessoa, não a tela. Sugestão de estrutura, mirando 2 a 3 minutos:

1. **Quem você é** (20s) — nome, o que você faz, por que está construindo em Base.
2. **O problema** (40s) — a Base entregou o bridge canônico pra Solana como
   infraestrutura embutida; não existe interface pública. Quem quer atravessar
   usa liquidez de terceiro e paga spread.
3. **O que existe hoje** (40s) — mostrar a transferência real acontecendo, ou o
   explorador com o mint vindo do endereço zero. Prova, não promessa.
4. **Pra onde vai** (30s) — a volta Base → Solana com a etapa de prova, e a
   interface de transferência pendente.
5. **Por que você** (20s) — o que te qualifica.

Falar em inglês. Não precisa de produção: câmera do notebook, luz decente, áudio
limpo. Gravar em uma tomada só é melhor que edição bem feita.

---

## Ordem sugerida até dia 9

1. Deploy com URL viva (bloqueador).
2. Responder as pendências deste documento.
3. Preencher seções 3 e 4 quando abrirem, com o material já reunido.
4. Gravar o vídeo.
5. Acabamento visual com o tempo que sobrar.
6. Submeter com pelo menos um dia de folga.
