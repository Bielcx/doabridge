# Codigo vendorizado — nao editar

Este diretorio e uma copia de `clients/ts/src` do repositorio oficial da Base:

- Origem: https://github.com/base/bridge
- Commit: cf64f80a73128c42e818394bb77c826faf3d2a78
- Data do commit: 2026-04-28
- Licenca: MIT (copia integral em ./LICENSE)

## Por que vendorizado

O pacote `@base/bridge` **nao esta publicado no npm**. O repositorio o mantem como
workspace interno buildado com Bun. Como o Do A Bridge precisa das instrucoes do
programa Solana no browser, a unica opcao e trazer a fonte pra dentro. A licenca MIT
permite, exigindo a atribuicao que este arquivo cumpre.

## O que tem aqui

Clientes gerados pelo Codama a partir dos IDLs dos dois programas Solana da Base:

- `bridge/` — o programa `HNCne2FkVaNghhjKXapxJzPaBvAKDG1Ge3gqhZyfVWLM`
- `base-relayer/` — o programa `g1et5VenhfJHJwsdJsDbxWZuotD5H4iELNG61kS4fb9`

Sao construtores de instrucao puros: montam bytes, nao falam com a rede nem assinam
nada. Rodam no browser sem adaptacao.

## Verificado em 02/09/2026

- Compila com `@solana/kit` **8.2.0**, zero erros de tipo. O
  `peerDependencies: "@solana/kit": "4.0.0"` do repositorio de origem esta
  desatualizado — nao fixar na v4 por causa dele.
- O unico uso de API do Node e `process.env.NODE_ENV` nos arquivos de erro, que o
  Next.js inlina no build. Funciona no browser.

## Duas armadilhas

1. `BRIDGE_PROGRAM_ADDRESS` no codigo gerado e **string vazia**. Toda chamada precisa
   receber `{ programAddress }` explicito. Use as constantes de `lib/solana/constants.ts`.
2. Os **seeds das PDAs nao sao exportados** aqui — vivem so em comentarios. Foram
   portados do `idl.json` do repositorio de origem para `lib/solana/pda.ts`.

## Como atualizar

Reclonar o repositorio de origem, recopiar `clients/ts/src`, atualizar o commit acima
e rodar o typecheck. Nao aplicar patch local: qualquer edicao aqui se perde na proxima
atualizacao.
