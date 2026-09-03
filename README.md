# Do A Bridge

Bridge entre Ethereum, Base e Solana, nas duas direções de cada par.

O catálogo de ativos vem do LI.FI em tempo de execução: ~5.500 tokens na Ethereum,
~1.000 na Base e ~4.400 na Solana. Não existe lista fixa de moedas no código.

**O diferencial é Solana.** O Brid.gg hoje é um widget do LI.FI (`@lifi/widget`,
`integrator: "bridgg"`) rodando com `chains: { types: { allow: ["EVM"] } }` — ou seja,
mesmo motor que o nosso, mas configurado para não mostrar Solana. Nós mostramos, e
para o par SOL nativo → SOL embrulhado na Base usamos o bridge canônico da Base em
vez do agregador; ver `docs/base-solana-viabilidade.md`.

## Rodar

```bash
npm install
cp .env.example .env.local   # opcional, o app roda sem isso
npm run dev
```

Sem `.env.local` o app funciona com carteiras injetadas (MetaMask, Rabby) e Coinbase
Wallet, e usa RPC público. Com um `NEXT_PUBLIC_WC_PROJECT_ID` (gratuito em
cloud.reown.com) o WalletConnect entra na lista e habilita carteiras mobile por QR.

## Estrutura

```
src/
  app/
    layout.tsx        reidrata o estado da carteira via cookie no SSR
    providers.tsx     ← fronteira de isolamento (RainbowKit vive aqui)
    page.tsx
  components/
    ConnectWallet.tsx ← fronteira de isolamento (botão de conectar)
    BridgeForm.tsx    tela principal, fala só com wagmi
  hooks/
    useTokens.ts           catálogo de ativos do LI.FI + busca, cache de 1h
    useBridgeRoutes.ts     cotação via react-query, revalida a cada 20s
    useBridgeExecution.ts  executeRoute do LI.FI + estado renderizável
  lib/
    wagmi.ts          ← fronteira de isolamento (config das chains e conectores)
    lifi.ts           configuração do LI.FI SDK (EVM + Solana) e busca de rotas
    routes.ts         redes, tipo Asset, e qual motor atravessa cada par
    routes.check.ts   autoteste de engineFor — `npm run check`
    solana/lifi-adapter.ts  shim Wallet Standard → SignerWalletAdapter do LI.FI
```

## Fundos

O fundo animado é escolha do usuário, nas configurações: **Ribbons** (padrão),
**Waves**, **Ether**, **Radar** e **None**. A escolha fica em `localStorage`.

Os componentes vivem em `src/components/vendor/` e são código de terceiro
(React Bits e Originkit) mantido como veio, com as alterações locais listadas no
cabeçalho de cada arquivo. Não editar o corpo: para atualizar, recopiar da fonte e
refazer as alterações do cabeçalho. O ESLint ignora essa pasta por isso.

Duas alterações se repetem e valem a explicação:

- **`pointerSource="window"`.** O fundo é uma camada com `pointer-events: none`, que
  por definição não recebe evento nenhum. Componente que escuta o ponteiro no próprio
  container fica inerte ali. Com `"window"` ele escuta na janela e converte a posição
  para as coordenadas do container. O Liquid Ether já faz isso de origem.
- **Glifos do Radar.** Os cinco traços vetoriais do original viraram `₿ Ξ ◎ $ ◆`.

`three` (Ether) e `ogl` (Waves) entram por `next/dynamic` com `ssr: false`, então só
baixa quem escolheu aquele fundo.

## Regra de isolamento da carteira

Só três arquivos importam de `@rainbow-me/rainbowkit`: `lib/wagmi.ts`,
`app/providers.tsx` e `components/ConnectWallet.tsx`. Todo o resto usa hooks do wagmi.

O motivo: quando a v2 trouxer Solana, vamos reavaliar RainbowKit contra Reown AppKit
e contra `@solana/wallet-adapter` em paralelo. Mantendo esse limite, a troca toca três
arquivos em vez de espalhar pela árvore de componentes. Se aparecer um
`useConnectModal()` no meio de um componente de feature, o isolamento morreu.

## Decisões de versão (e por quê)

**`@lifi/sdk` fixado em 3.x, não 4.x.** A v4 removeu o provider EVM do pacote core e
ainda não publicou um substituto — existe `@lifi/sdk-provider-solana` no npm, mas não
existe `@lifi/sdk-provider-evm`. A v3.16.3 exporta `EVM()` e `createConfig()` e é o que
funciona hoje. Reavaliar quando o provider EVM da v4 sair.

**`wagmi` fixado em 2.x, não 3.x.** O RainbowKit 2.2.11 (o latest) declara
`peerDependencies: { wagmi: "^2.9.0" }`. Não existe RainbowKit v3. Subir o wagmi para 3
quebra o peer.

**`@x402/*` nas dependências, sem o app usar.** O conector `baseAccount` do
`@wagmi/connectors`, que o índice do RainbowKit importa, arrasta o `@coinbase/cdp-sdk`,
que faz import estático de `@x402/core`, `@x402/evm` e `@x402/svm`. Eles são peer
dependencies *opcionais* do cdp-sdk, mas o Turbopack resolve imports estaticamente e o
build quebra sem eles. Tentei stub com módulo vazio: não funciona, o Turbopack valida
os named exports. Instalar os quatro é o caminho limpo. Se um dia o RainbowKit parar de
puxar o `baseAccount`, dá pra remover.

## Estado

- [x] Conectar carteira
- [x] Cotação de rota Ethereum ↔ Base via LI.FI
- [x] Execução do bridge
- [ ] Gas e preços em tempo real (Basescan)
- [ ] Histórico de transações
- [ ] Bridge nativo Base ↔ Solana (v2)
