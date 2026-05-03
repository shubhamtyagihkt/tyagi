const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  })

  if (response.status === 204) {
    return null
  }

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.error || `Request failed (${response.status})`)
  }

  return data
}

export const api = {
  sku: {
    list: (q = '') => request(`/sku${q ? `?q=${encodeURIComponent(q)}` : ''}`),
    get: (id) => request(`/sku/${id}`),
    create: (payload) => request('/sku', { method: 'POST', body: JSON.stringify(payload) }),
    update: (id, payload) =>
      request(`/sku/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  },
  purchase: {
    list: ({ dateFrom, dateTo } = {}) => {
      const params = new URLSearchParams()
      if (dateFrom) params.set('date_from', dateFrom)
      if (dateTo) params.set('date_to', dateTo)
      const query = params.toString()
      return request(`/purchase${query ? `?${query}` : ''}`)
    },
    create: (payload) =>
      request('/purchase', { method: 'POST', body: JSON.stringify(payload) }),
    remove: (id) => request(`/purchase/${id}`, { method: 'DELETE' }),
  },
  sale: {
    list: ({ dateFrom, dateTo } = {}) => {
      const params = new URLSearchParams()
      if (dateFrom) params.set('date_from', dateFrom)
      if (dateTo) params.set('date_to', dateTo)
      const query = params.toString()
      return request(`/sale${query ? `?${query}` : ''}`)
    },
    create: (payload) => request('/sale', { method: 'POST', body: JSON.stringify(payload) }),
    remove: (id) => request(`/sale/${id}`, { method: 'DELETE' }),
  },
  expense: {
    list: ({ dateFrom, dateTo } = {}) => {
      const params = new URLSearchParams()
      if (dateFrom) params.set('date_from', dateFrom)
      if (dateTo) params.set('date_to', dateTo)
      const query = params.toString()
      return request(`/expense${query ? `?${query}` : ''}`)
    },
    create: (payload) => request('/expense', { method: 'POST', body: JSON.stringify(payload) }),
    remove: (id) => request(`/expense/${id}`, { method: 'DELETE' }),
  },
  reports: {
    summary: ({ dateFrom, dateTo } = {}) => {
      const params = new URLSearchParams()
      if (dateFrom) params.set('date_from', dateFrom)
      if (dateTo) params.set('date_to', dateTo)
      const query = params.toString()
      return request(`/reports${query ? `?${query}` : ''}`)
    },
  },
  finance: {
    summary: () => request('/finance'),
    addInvestment: (payload) =>
      request('/finance/investment', { method: 'POST', body: JSON.stringify(payload) }),
  },
  database: {
    select: async (path) => {
      const response = await fetch(`${API_BASE_URL}/database/select`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || `Request failed (${response.status})`)
      }
      return data
    },
  },
}
