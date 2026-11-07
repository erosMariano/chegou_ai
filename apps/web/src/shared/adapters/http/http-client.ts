/**
 * HttpClient compartilhado para os Adapters HTTP de produção.
 * Conecta o Next.js BFF à API NestJS Core conforme ADR-001 e api-contracts.md.
 */

export function getApiBaseUrl(): string {
  if (typeof window === "undefined") {
    // Execução Server-Side (Next.js SSR / Server Components)
    return (
      process.env.CORE_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:8080/api/v1"
    )
  }
  // Execução Client-Side (Browser)
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1"
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem("chegou_session")
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed?.token || null
  } catch {
    return null
  }
}

export function getDefaultHeaders(customHeaders?: Record<string, string>): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...customHeaders,
  }

  const token = getAuthToken()
  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`
  }

  return headers
}

export async function httpGet<T>(endpoint: string, fallback?: T): Promise<T> {
  const baseUrl = getApiBaseUrl()
  const url = `${baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`

  try {
    const res = await fetch(url, {
      headers: getDefaultHeaders(),
      cache: "no-store",
    })

    if (res.status === 404 && fallback !== undefined) {
      return fallback
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail || err.message || `Erro ${res.status} ao consultar ${endpoint}`)
    }

    return await res.json()
  } catch (err: unknown) {
    // Caso a API NestJS ainda não tenha subido durante o desenvolvimento local
    if (fallback !== undefined) {
      console.warn(
        `[Chegou.AI HTTP] Backend offline ou indisponível em ${url}. Retornando lista vazia para permitir desenvolvimento do backend.`
      )
      return fallback
    }
    const msg = err instanceof Error ? err.message : "Erro na comunicação com o backend"
    throw new Error(msg)
  }
}

export async function httpPost<T>(
  endpoint: string,
  body?: unknown,
  customHeaders?: Record<string, string>
): Promise<T> {
  const baseUrl = getApiBaseUrl()
  const url = `${baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: getDefaultHeaders(customHeaders),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail || err.message || `Erro ${res.status} ao enviar dados para ${endpoint}`)
    }

    return await res.json()
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Falha ao conectar com o backend"
    throw new Error(msg)
  }
}

export async function httpPut<T>(endpoint: string, body?: unknown): Promise<T> {
  const baseUrl = getApiBaseUrl()
  const url = `${baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`

  try {
    const res = await fetch(url, {
      method: "PUT",
      headers: getDefaultHeaders(),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail || err.message || `Erro ${res.status} ao atualizar ${endpoint}`)
    }

    return await res.json()
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Falha ao conectar com o backend"
    throw new Error(msg)
  }
}

export async function httpDelete(endpoint: string): Promise<void> {
  const baseUrl = getApiBaseUrl()
  const url = `${baseUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`

  try {
    const res = await fetch(url, {
      method: "DELETE",
      headers: getDefaultHeaders(),
    })

    if (!res.ok && res.status !== 404) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail || err.message || `Erro ${res.status} ao excluir em ${endpoint}`)
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Falha ao conectar com o backend"
    throw new Error(msg)
  }
}

