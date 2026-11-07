/**
 * Feature Flag helper para isolar componentes de mock/teste da UI de produção.
 */
export function isMockUiEnabled(): boolean {
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_ENABLE_MOCK_UI === "false") {
    return false
  }
  return true
}

