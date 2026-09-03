// ASCII Radar — Originkit, preset `base`. Codigo de terceiro com alteracoes locais.
//
// Um campo de ruido decide quais celulas da grade acendem; cada celula acesa
// desenha um glifo de um atlas. Clique (ou o cursor passando) solta um ping, que
// e um anel que se expande pela grade acendendo o que atravessa.
//
// Alteracoes locais em relacao ao original, todas marcadas no corpo:
//   1. Os glifos deixaram de ser tracos vetoriais e viraram simbolos de cripto.
//      Era o pedido; deu menos codigo do que o original, porque desenhar texto
//      e uma chamada de fillText contra cinco blocos de path.
//   2. Adicionada a prop `pointerSource`. O original escuta o ponteiro no proprio
//      canvas, o que nao funciona quando o componente e um fundo com
//      `pointer-events: none`. Mesma alteracao ja feita em flow-ribbons.
//   3. Adicionada a prop `trail`: pings acompanhando o cursor, nao so no clique.
//   4. Nada mais. Se atualizar, recopiar do Originkit e refazer estes quatro.

"use client";

import { useEffect, useRef } from "react";

/**
 * ALTERACAO LOCAL. O componente original desenha cinco glifos vetoriais (cruz, X,
 * circulo, quadrado, alvo). Aqui eles viraram simbolos de cripto, que e o assunto
 * da pagina: bitcoin, ether, solana, dolar e um losango de preenchimento.
 *
 * `Segoe UI Symbol` e `Apple Symbols` estao no fim da pilha de fontes de proposito:
 * o `₿` (U+20BF) falta em algumas fontes monoespacadas e sem esse fallback ele
 * sairia como retangulo vazio.
 */
const GLYPHS = ['₿', 'Ξ', '◎', '$', '◆'];
const GLYPH_FONT =
    'ui-monospace, SFMono-Regular, "Cascadia Mono", "Segoe UI Symbol", "Apple Symbols", monospace';
const GLYPH_COUNT = GLYPHS.length;
const DENS_MS = 80;
const MAX_PINGS = 16;

const BASE_COLUMNS = 80;
const CLUSTER_PER_COLUMN = 10 / BASE_COLUMNS;
const columnsFromScale = (scale: number) =>
    Math.max(8, Math.min(400, Math.round((BASE_COLUMNS * 100) / Math.max(1, scale))));

const CLUSTER_DRIFT_AT_50 = 0.14;
const PING_SPEED_AT_50 = 26;

function hash3(i: number, j: number, k: number) {
    let n = Math.imul(i, 374761393) ^ Math.imul(j, 668265263) ^ Math.imul(k, 1274126177);
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    n = n ^ (n >>> 16);
    return (n >>> 0) / 4294967295;
}

function vnoise(x: number, y: number, z: number) {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const zi = Math.floor(z);
    let fx = x - xi;
    let fy = y - yi;
    let fz = z - zi;
    fx = fx * fx * (3 - 2 * fx);
    fy = fy * fy * (3 - 2 * fy);
    fz = fz * fz * (3 - 2 * fz);
    const c000 = hash3(xi, yi, zi);
    const c100 = hash3(xi + 1, yi, zi);
    const c010 = hash3(xi, yi + 1, zi);
    const c110 = hash3(xi + 1, yi + 1, zi);
    const c001 = hash3(xi, yi, zi + 1);
    const c101 = hash3(xi + 1, yi, zi + 1);
    const c011 = hash3(xi, yi + 1, zi + 1);
    const c111 = hash3(xi + 1, yi + 1, zi + 1);
    const x00 = c000 + (c100 - c000) * fx;
    const x10 = c010 + (c110 - c010) * fx;
    const x01 = c001 + (c101 - c001) * fx;
    const x11 = c011 + (c111 - c011) * fx;
    const y0 = x00 + (x10 - x00) * fy;
    const y1 = x01 + (x11 - x01) * fy;
    return y0 + (y1 - y0) * fz;
}

function fbm(x: number, y: number, z: number) {
    return vnoise(x, y, z) * 0.68 + vnoise(x * 2.3 + 11.7, y * 2.3 - 5.1, z * 1.4) * 0.32;
}

function buildAtlas(tile: number, glyphFrac: number, color: string) {
    const cv = document.createElement("canvas");
    cv.width = tile * GLYPH_COUNT;
    cv.height = tile;
    const g = cv.getContext("2d");
    if (!g) return cv;

    // ALTERACAO LOCAL: texto no lugar dos tracos vetoriais do original. O resto do
    // componente so le o atlas por indice, entao nada mais precisou mudar.
    g.fillStyle = color;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.font = `600 ${Math.max(6, Math.round(tile * glyphFrac))}px ${GLYPH_FONT}`;
    for (let i = 0; i < GLYPH_COUNT; i++) {
        g.fillText(GLYPHS[i], i * tile + tile / 2, tile / 2 + tile * 0.02);
    }
    return cv;
}

interface AsciiRadarProps {
    background?: string;
    glyphColor?: string;
    ringColor?: string;
    scale?: number;
    glyphSize?: number;
    density?: number;
    speed?: number;
    click?: boolean;
    /** Alteracao local: pings seguindo o ponteiro, nao so no clique. */
    trail?: boolean;
    /** Alteracao local: onde escutar o ponteiro. Ver o cabecalho. */
    pointerSource?: "element" | "window";
    ringSpeed?: number;
    ringSize?: number;
    width?: number | string;
    height?: number | string;
    style?: React.CSSProperties;
}

type Ping = { x: number; y: number; r: number; max: number };

function __OriginkitBase_AsciiRadar({
    background = "#000000",
    glyphColor = "#E5FF32",
    ringColor = "#E5FF32",
    scale = 100,
    glyphSize = 62,
    density = 60,
    speed = 50,
    click = true,
    trail = true,
    pointerSource = "element",
    ringSpeed = 50,
    ringSize = 2,
    width = "100%",
    height = "100%",
    style,
}: AsciiRadarProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const live = useRef<Record<string, unknown>>({}).current;
    Object.assign(live, {
        background,
        glyphColor,
        ringColor,
        columns: columnsFromScale(scale),
        glyphSize,
        density,
        clusterSize: Math.max(2, Math.round(columnsFromScale(scale) * CLUSTER_PER_COLUMN)),
        clusterSpeed: speed,
        clickOn: click,
        trailOn: trail,
        pingSpeed: ringSpeed,
        ringWidth: ringSize,
    });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        let raf = 0;
        let last = 0;
        let t = 0;

        let W = 0;
        let H = 0;
        let cols = 0;
        let rows = 0;
        let cell = 0;
        let tile = 0;
        let dens = new Float32Array(0);
        let glyph = new Uint8Array(0);
        let ringA = new Uint8Array(0);
        let fillA = new Uint8Array(0);
        let xs = new Int32Array(0);
        let gxs = new Int32Array(0);
        let atlas: HTMLCanvasElement | null = null;
        let atlasKey = "";
        let densAcc = 1e9;

        let pings: Ping[] = [];

        const spawn = (px: number, py: number) => {
            if (pings.length >= MAX_PINGS) pings.shift();
            const dx = Math.max(px, cols - px);
            const dy = Math.max(py, rows - py);
            pings.push({ x: px, y: py, r: 0, max: Math.sqrt(dx * dx + dy * dy) });
        };

        const buildField = () => {
            const patch = Math.max(2, (live.clusterSize as number) | 0);
            const z =
                t *
                (Math.max(0, Math.min(100, live.clusterSpeed as number)) / 50) *
                CLUSTER_DRIFT_AT_50;
            const T = 0.5 - (Math.max(0, Math.min(100, live.density as number)) / 100 - 0.5) * 0.62;
            for (let r = 0; r < rows; r++) {
                const ny = r / patch;
                const row = r * cols;
                for (let c = 0; c < cols; c++) {
                    const n = fbm(c / patch, ny, z);
                    dens[row + c] = n > T ? 0.5 + 0.5 * Math.min(1, (n - T) / 0.09) : 0;
                }
            }
        };

        const render = (now: number) => {
            if (!last) last = now;
            let dt = (now - last) / 1000;
            last = now;
            if (dt > 0.05) dt = 0.05;
            t += dt;

            const cssW = canvas.clientWidth || 300;
            const cssH = canvas.clientHeight || 300;
            const nW = Math.max(1, Math.round(cssW * dpr));
            const nH = Math.max(1, Math.round(cssH * dpr));
            const nCols = Math.max(8, Math.min(400, (live.columns as number) | 0));
            if (nW !== W || nH !== H || nCols !== cols) {
                W = nW;
                H = nH;
                canvas.width = W;
                canvas.height = H;
                cols = nCols;
                cell = W / cols;
                rows = Math.max(1, Math.ceil(H / cell));
                const n = cols * rows;
                dens = new Float32Array(n);
                ringA = new Uint8Array(n);
                fillA = new Uint8Array(n);
                glyph = new Uint8Array(n);
                for (let i = 0; i < n; i++) glyph[i] = (hash3(i, 7, 13) * GLYPH_COUNT) | 0;
                xs = new Int32Array(cols + 1);
                gxs = new Int32Array(cols);
                tile = Math.max(3, Math.round(cell));
                for (let c = 0; c <= cols; c++) xs[c] = Math.round(c * cell);
                for (let c = 0; c < cols; c++)
                    gxs[c] = xs[c] + Math.round((xs[c + 1] - xs[c] - tile) / 2);
                densAcc = 1e9;
                pings = [];
            }

            const key = `${tile}|${live.glyphSize}|${live.glyphColor}`;
            if (key !== atlasKey) {
                atlasKey = key;
                atlas = buildAtlas(
                    tile,
                    Math.max(0.2, Math.min(1, (live.glyphSize as number) / 100)),
                    (live.glyphColor as string) || "#E5FF32"
                );
            }

            densAcc += dt * 1000;
            if (densAcc >= DENS_MS) {
                densAcc = 0;
                buildField();
            }

            const half = Math.max(0.5, (live.ringWidth as number) / 2);
            const v = (Math.max(0, Math.min(100, live.pingSpeed as number)) / 50) * PING_SPEED_AT_50;
            ringA.fill(0);
            fillA.fill(0);
            for (let i = pings.length - 1; i >= 0; i--) {
                const p = pings[i];
                p.r += v * dt;
                if (p.r - half > p.max) {
                    pings.splice(i, 1);
                    continue;
                }
                const prog = p.r / p.max;
                const a = prog < 0.72 ? 1 : Math.max(0, 1 - (prog - 0.72) / 0.28);
                const av = Math.max(1, Math.round(a * 255));
                const rOut = p.r + half;
                const rIn = p.r - half;
                const r0 = Math.max(0, Math.floor(p.y - rOut - 0.5));
                const r1 = Math.min(rows - 1, Math.ceil(p.y + rOut + 0.5));
                for (let ry = r0; ry <= r1; ry++) {
                    const dy = ry + 0.5 - p.y;
                    const o2 = rOut * rOut - dy * dy;
                    if (o2 <= 0) continue;
                    const ox = Math.sqrt(o2);
                    const i2 = rIn > 0 ? rIn * rIn - dy * dy : -1;
                    const row = ry * cols;
                    if (i2 > 0) {
                        const ix = Math.sqrt(i2);
                        let c0 = Math.ceil(p.x - ox - 0.5);
                        let c1 = Math.floor(p.x - ix - 0.5);
                        for (let c = Math.max(0, c0); c <= Math.min(cols - 1, c1); c++)
                            if (ringA[row + c] < av) ringA[row + c] = av;
                        c0 = Math.ceil(p.x + ix - 0.5);
                        c1 = Math.floor(p.x + ox - 0.5);
                        for (let c = Math.max(0, c0); c <= Math.min(cols - 1, c1); c++)
                            if (ringA[row + c] < av) ringA[row + c] = av;
                    } else {
                        const c0 = Math.max(0, Math.ceil(p.x - ox - 0.5));
                        const c1 = Math.min(cols - 1, Math.floor(p.x + ox - 0.5));
                        for (let c = c0; c <= c1; c++) if (ringA[row + c] < av) ringA[row + c] = av;
                    }
                }

                if (rIn <= 0) continue;
                const wake = Math.max(12, p.max * 0.45);
                const rHole = p.r - wake;
                const hole2 = rHole > 0 ? rHole * rHole : -1;
                const f0 = Math.max(0, Math.floor(p.y - rIn - 0.5));
                const f1 = Math.min(rows - 1, Math.ceil(p.y + rIn + 0.5));
                for (let ry = f0; ry <= f1; ry++) {
                    const dy = ry + 0.5 - p.y;
                    const i2 = rIn * rIn - dy * dy;
                    if (i2 <= 0) continue;
                    const ix = Math.sqrt(i2);
                    const row = ry * cols;
                    const c0 = Math.max(0, Math.ceil(p.x - ix - 0.5));
                    const c1 = Math.min(cols - 1, Math.floor(p.x + ix - 0.5));
                    const dy2 = dy * dy;
                    for (let c = c0; c <= c1; c++) {
                        const dx = c + 0.5 - p.x;
                        const d2 = dx * dx + dy2;
                        if (hole2 > 0 && d2 < hole2) continue;
                        const f = a * (1 - (p.r - Math.sqrt(d2)) / wake);
                        if (f <= 0) continue;
                        const fv = Math.min(255, Math.round(f * 255));
                        if (fillA[row + c] < fv) fillA[row + c] = fv;
                    }
                }
            }

            ctx.clearRect(0, 0, W, H);
            ctx.fillStyle = (live.ringColor as string) || "#E5FF32";
            for (let r = 0; r < rows; r++) {
                const y0 = Math.round(r * cell);
                const y1 = Math.round((r + 1) * cell);
                const gy = y0 + Math.round((y1 - y0 - tile) / 2);
                const row = r * cols;
                for (let c = 0; c < cols; c++) {
                    const idx = row + c;
                    const ra = ringA[idx];
                    if (ra) {
                        ctx.globalAlpha = ra / 255;
                        ctx.fillRect(xs[c], y0, xs[c + 1] - xs[c], y1 - y0);
                        continue;
                    }
                    const f = fillA[idx] / 255;
                    const a = f > dens[idx] ? f : dens[idx];
                    if (a <= 0.02) continue;
                    ctx.globalAlpha = a;
                    ctx.drawImage(
                        atlas as HTMLCanvasElement,
                        glyph[idx] * tile,
                        0,
                        tile,
                        tile,
                        gxs[c],
                        gy,
                        tile,
                        tile
                    );
                }
            }
            ctx.globalAlpha = 1;

            raf = requestAnimationFrame(render);
        };

        const cellAt = (e: PointerEvent) => {
            const rect = canvas.getBoundingClientRect();
            if (!rect.width || !rect.height || !cols) return null;
            return {
                x: ((e.clientX - rect.left) / rect.width) * cols,
                y: ((e.clientY - rect.top) / rect.height) * rows,
            };
        };

        const onDown = (e: PointerEvent) => {
            if (!live.clickOn) return;
            const q = cellAt(e);
            if (!q) return;
            spawn(q.x, q.y);
        };

        // ALTERACAO LOCAL: rastro do ponteiro. So o clique deixaria um fundo que
        // parece morto — o radar acompanha o cursor, e o clique continua sendo o
        // ping forte. Espacado no tempo E na distancia porque um ping por evento
        // de pointermove enche a fila de dezesseis em meio segundo.
        let lastTrail = 0;
        let lastX = -1e9;
        let lastY = -1e9;
        const onMove = (e: PointerEvent) => {
            if (!live.trailOn) return;
            const q = cellAt(e);
            if (!q) return;
            const now = performance.now();
            if (now - lastTrail < 320) return;
            if (Math.hypot(q.x - lastX, q.y - lastY) < cols * 0.06) return;
            lastTrail = now;
            lastX = q.x;
            lastY = q.y;
            spawn(q.x, q.y);
        };

        const pointerTarget: HTMLElement | Window =
            pointerSource === "window" ? window : canvas;
        pointerTarget.addEventListener("pointerdown", onDown as EventListener);
        pointerTarget.addEventListener("pointermove", onMove as EventListener);

        raf = requestAnimationFrame(render);
        return () => {
            cancelAnimationFrame(raf);
            pointerTarget.removeEventListener("pointerdown", onDown as EventListener);
            pointerTarget.removeEventListener("pointermove", onMove as EventListener);
        };
    }, []);

    return (
        <div
            style={{
                position: "relative",
                overflow: "hidden",
                background,
                width,
                height,
                ...style,
            }}
        >
            <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "100%" }} />
        </div>
    );
}

const __originkitPresetProps = {
  "background": "#000000",
  "glyphColor": "#E5FF32",
  "scale": 100,
  "glyphSize": 62,
  "density": 60,
  "speed": 50,
  "click": true,
  "ringColor": "#E5FF32",
  "ringSpeed": 50,
  "ringSize": 2
};

export default function AsciiRadar(props: Record<string, unknown>) {
  return <__OriginkitBase_AsciiRadar {...(__originkitPresetProps as Record<string, unknown>)} {...props} />;
}
