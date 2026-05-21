import ky from 'ky'

export async function fetchSource(url: string): Promise<string> {
  const response = await ky.get(url, {
    timeout: 10000,
    retry: {
      limit: 3,
      methods: ['get'],
      statusCodes: [408, 429, 500, 502, 503, 504, 521, 522, 524]
    }
  })
  return response.text()
}
