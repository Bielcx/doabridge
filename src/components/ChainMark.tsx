import { CHAINS, type ChainKey } from '@/lib/routes'

/**
 * A marca da rede.
 *
 * Antes era uma bolinha de cor chapada. Cor sozinha nao identifica rede: quem
 * chega na tela nao sabe que roxo e Solana, e quem nao distingue as cores nao
 * recebe informacao nenhuma. O simbolo e reconhecivel na hora e sobrevive ao
 * tema, ao daltonismo e ao print em preto e branco.
 *
 * SVG inline, e nao <img> do catalogo do LI.FI: sao tres redes fixas, isso e
 * meio kilobyte que ja vem no HTML, sem requisicao, sem estado de carregando e
 * sem o piscar do logo aparecendo depois do resto. As formas sao as oficiais de
 * cada rede.
 *
 * Todas desenham disco colorido + simbolo branco, de proposito: como marcador de
 * 15px em cima do icone do token, a silhueta redonda e o que faz o simbolo se
 * separar do que esta atras.
 */
export function ChainMark({ chain, size = 20 }: { chain: ChainKey; size?: number }) {
  const info = CHAINS[chain]
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      role="img"
      aria-label={info.name}
      className="shrink-0"
    >
      <circle cx="16" cy="16" r="16" fill={info.tint} />
      {chain === 'ethereum' && (
        // O losango da Ethereum: as faces claras e escuras dao o volume.
        <g fill="#fff">
          <path d="M16 5v8.2l6.9 3.1z" fillOpacity=".6" />
          <path d="M16 5 9.1 16.3 16 13.2z" />
          <path d="M16 22.1V27l6.9-9.6z" fillOpacity=".6" />
          <path d="M16 27v-4.9l-6.9-4.7z" />
          <path d="m16 20.8 6.9-4.5-6.9-3.1z" fillOpacity=".2" />
          <path d="m9.1 16.3 6.9 4.5v-7.6z" fillOpacity=".6" />
        </g>
      )}
      {chain === 'base' && (
        // O circulo aberto da Base, escalado do desenho oficial de 111px.
        <g transform="translate(7.4 7.4) scale(0.1495)">
          <path
            fill="#fff"
            d="M54.9 110c30.4 0 55.1-24.7 55.1-55.1C110 24.5 85.3 0 54.9 0 26 0 2.4 22.2 0 50.5h72.8v9.1H0c2.4 28.3 26 50.4 54.9 50.4z"
          />
        </g>
      )}
      {chain === 'solana' && (
        // As tres barras inclinadas, escaladas do desenho oficial de 397x311.
        <g transform="translate(6.5 8.7) scale(0.0478)">
          <path
            fill="#fff"
            d="M64.6 237.9a11 11 0 0 1 7.8-3.2h319a5.5 5.5 0 0 1 3.9 9.4l-63 63a11 11 0 0 1-7.8 3.2h-319a5.5 5.5 0 0 1-3.9-9.4zM64.6 3.8A11 11 0 0 1 72.4.6h319a5.5 5.5 0 0 1 3.9 9.4l-63 63a11 11 0 0 1-7.8 3.2h-319A5.5 5.5 0 0 1 1.6 66.8zM331.5 120.1a11 11 0 0 0-7.8-3.2h-319a5.5 5.5 0 0 0-3.9 9.4l63 63a11 11 0 0 0 7.8 3.2h319a5.5 5.5 0 0 0 3.9-9.4z"
          />
        </g>
      )}
    </svg>
  )
}
