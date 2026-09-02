'use client'

import { useCallback, useState } from 'react'
import { executeRoute, type Route, type RouteExtended } from '@lifi/sdk'
import { ensureLifiConfig } from '@/lib/lifi'

export type ExecutionState =
  | { status: 'idle' }
  | { status: 'running'; route: RouteExtended }
  | { status: 'done'; route: RouteExtended }
  | { status: 'error'; message: string }

/**
 * Envolve o executeRoute do LI.FI num estado que a UI consegue renderizar.
 *
 * O `updateRouteHook` dispara a cada mudanca de status de cada passo da rota
 * (approve, swap, bridge). E dele que sai o progresso mostrado na tela.
 */
export function useBridgeExecution() {
  const [state, setState] = useState<ExecutionState>({ status: 'idle' })

  const execute = useCallback(async (route: Route) => {
    ensureLifiConfig()
    try {
      const executed = await executeRoute(route, {
        updateRouteHook: (updated) => setState({ status: 'running', route: updated }),
      })
      setState({ status: 'done', route: executed })
      return executed
    } catch (error) {
      setState({
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown execution failure',
      })
      throw error
    }
  }, [])

  const reset = useCallback(() => setState({ status: 'idle' }), [])

  return { state, execute, reset }
}
