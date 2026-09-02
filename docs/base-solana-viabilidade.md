# Base ↔ Solana — estudo de viabilidade

> Pesquisa feita em 02/09/2026, antes de escrever qualquer código.
> Fonte primária: docs.base.org, repo `base/bridge` (MIT), repo `base/sol2base`, blog de engenharia da Base.

## Resposta curta

É viável, é **oficial**, e o repositório é MIT — dá pra usar o bridge nativo direto do frontend, sem
agregador e sem backend próprio. Mas a direção **Base → Solana não é uma transação só**: são três
passos separados com ~15 minutos de espera no meio. Isso não é um detalhe de implementação, é o
produto inteiro — é aí que o Do A Bridge ganha ou perde.

## Endereços (mainnet)

| Onde | O quê | Endereço |
|---|---|---|
| Base | `Bridge` | `0x3eff766C76a1be2Ce1aCF2B69c78bCae257D5188` |
| Base | `BridgeValidator` | `0xAF24c1c24Ff3BF1e6D882518120fC25442d6794B` |
| Base | `CrossChainERC20Factory` | `0xDD56781d0509650f8C2981231B6C917f2d5d7dF2` |
| Base | SOL como ERC-20 | `0x311935Cd80B76769bF2ecC9D8Ab7635b2139cf82` |
| Solana | Bridge program | `HNCne2FkVaNghhjKXapxJzPaBvAKDG1Ge3gqhZyfVWLM` |
| Solana | Base Relayer program | `g1et5VenhfJHJwsdJsDbxWZuotD5H4iELNG61kS4fb9` |

## Como funciona de verdade

O bridge é **canônico** (lock & mint), não é liquidez de terceiro. Duas partes precisam atestar cada
mensagem: um oráculo operado pela Base e a DON da Chainlink (multisig 3-de-5, indo pra 9-de-16).

### Solana → Base — fácil, ~15 segundos

1. Usuário assina **uma** instrução `bridge_sol` (ou `bridge_spl`) no programa Solana.
   Os fundos ficam travados num PDA-vault e nasce uma conta `OutgoingMessage`.
2. Se o usuário anexar `PayForRelay`, o Base Relayer paga o gas na Base e executa sozinho.
3. Pronto. Latência = finalidade da Solana, ~15s.

**Do ponto de vista de UX: uma assinatura, uma tela de loading curta, acabou.**

### Base → Solana — difícil, ~15 minutos e 3 assinaturas

1. Usuário chama `bridgeToken(Transfer, Ix[])` no contrato `Bridge` da Base.
   `Transfer = { address localToken, Pubkey remoteToken, bytes32 to, uint64 remoteAmount }`.
   A mensagem entra numa Merkle Mountain Range (MMR) no contrato.
2. **Espera ~15 minutos** — a mensagem só é provável depois de ~300 blocos finalizados
   (é a finalidade da L1 Ethereum que manda aqui, não a da Base).
3. O oráculo publica a raiz da MMR na Solana. Aí o usuário (ou um relayer) precisa:
   - gerar a prova de inclusão,
   - assinar `prove_message` na Solana,
   - assinar `relay_message` na Solana.

Ou seja: **1 assinatura na Base + espera + 2 assinaturas na Solana.** É o mesmo formato do
withdrawal do OP Stack, com a diferença de que aqui a espera é de minutos e não de 7 dias.

#### A boa notícia sobre a prova

Eu tinha medo de que gerar a prova exigisse indexer próprio. Não exige. O contrato `Bridge` na Base
expõe `generateProof(uint64 leafIndex) external view returns (bytes32[])` — é uma leitura. O fluxo
que o script oficial usa, e que roda inteiro no browser:

1. `getTransactionReceipt` da tx da Base → decodificar o evento `MessageInitiated`
   (dá `messageHash`, `mmrRoot`, `message.nonce`, `message.sender`, `message.data`).
2. Ler `bridge.data.baseBlockNumber` da conta Bridge na Solana (é o bloco da Base que a Solana
   já conhece — serve de relógio pra saber se já dá pra provar).
3. `readContract(generateProof, [nonce], { blockNumber: baseBlockNumber })`.
4. Montar `prove_message` com esses dados e mandar assinar na carteira Solana.

**Único pegadinha real:** o passo 3 é uma leitura em bloco histórico (~450 blocos atrás). RPC público
guarda estado de ~128 blocos. **Vai precisar de RPC com archive** — Alchemy, QuickNode ou o RPC da
Coinbase Developer Platform. Isso é uma dependência de infra a orçar, não um bloqueio.

## O que já existe pronto pra reaproveitar

- **`base/bridge`** (MIT) — inclui `clients/ts`, um SDK TypeScript com os clientes Codama gerados
  dos dois programas Solana, em cima de `@solana/kit`. São instruction builders puros, rodam no
  browser. **Não está publicado no npm** (`@base/bridge` não existe no registry) — vai ter que
  vendorizar o diretório ou buildar do repo. Licença MIT permite.
- **`base/sol2base`** (= terminallyonchain.com) — frontend Next.js 15 + Tailwind + `@solana/wallet-adapter`
  da própria Base, cobrindo a direção **Solana → Base**. É referência de código de primeira mão.

## Onde está o buraco de mercado (e onde não está)

Reavaliando o brief com o que apurei — duas correções honestas:

1. **"Ninguém oferece Base ↔ Solana" não é verdade.** deBridge, Symbiosis, Mayan, Relay e o próprio
   LI.FI (`@lifi/sdk-provider-solana`, v4.1.3) já movem valor entre Base e Solana. Se o diferencial
   for só "existe a rota", ele não existe.
2. **O que realmente não existe é uma UI standalone do bridge NATIVO.** A Base lançou isso como
   infraestrutura, não como produto: está embutido dentro de Zora, Aerodrome, Virtuals, Flaunch e
   Relay. Não há um site oficial onde o usuário simplesmente entra e faz a ponte canônica.
   E a direção Base → Solana (a complicada, das 3 assinaturas) é justamente a menos coberta.

**Então o diferencial defensável é este:** *bridge canônico, não liquidez de terceiro* — o usuário
não paga spread de market maker, não confia num pool, e os fundos ficam no contrato oficial
auditado da Base com atestação da Chainlink. Somado a: a única UI que torna o fluxo de 3 passos
suportável (persistir a transação pendente, avisar quando der pra provar, retomar de onde parou).

Isso é uma tese de produto bem mais forte que "mais uma rota".

## Consequências pro MVP

- **O estado pendente é o núcleo do app, não um extra.** Se o usuário fechar a aba no meio dos 15
  minutos e perder o caminho de volta, os fundos ficam presos até ele descobrir como provar na mão.
  Precisa de persistência local (a tx da Base é a chave de tudo — dá pra reconstruir o resto dela)
  e, idealmente, uma tela "resgatar transferência pendente" que aceite um hash colado.
- **Duas carteiras conectadas ao mesmo tempo**, sempre. Isso reforça a escolha do Reown AppKit.
- **RPC com archive na Base é requisito**, não opcional.
- Reordenar o escopo: fazer **Solana → Base primeiro** (uma assinatura, feedback em 15s, dá pra ter
  algo funcionando de ponta a ponta rápido) e só depois encarar Base → Solana.
- O LI.FI continua fazendo sentido pro Ethereum ↔ Base, como estava decidido. São dois motores
  diferentes convivendo: agregador pro L1↔L2, contrato nativo pro Base↔Solana.

## Decisões que isso destrava

- **Contrato nativo ou agregador pro Base↔Solana?** → Nativo. É o que sustenta o diferencial;
  via agregador o app vira mais um Brid.gg.
- **Qual o segundo diferencial?** → Sugestão: a gestão do estado pendente / "recuperar transferência".
  É funcional, resolve dor real e ninguém cobre. PT-BR e presets Gnars/SkateHive são distribuição,
  não produto — valem depois, não como pilar.

## Fontes

- https://docs.base.org/base-chain/quickstart/base-solana-bridge
- https://blog.base.dev/engineering-the-base-solana-bridge
- https://blog.base.org/base-solana-bridge
- https://github.com/base/bridge
- https://github.com/base/sol2base
- https://www.npmjs.com/package/@lifi/sdk-provider-solana
