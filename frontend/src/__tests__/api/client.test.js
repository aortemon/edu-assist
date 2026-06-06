import api from '../../api/client'
import MockAdapter from 'axios-mock-adapter'

const mock = new MockAdapter(api)

describe('API client', () => {
  beforeEach(() => {
    localStorage.clear()
    mock.reset()
    jest.spyOn(console, 'error').mockImplementation(() => { })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('request interceptor', () => {
    it('should add Authorization header when token exists', async () => {
      localStorage.setItem('access_token', 'test-token')
      mock.onGet('/test').reply(200, { success: true })

      const response = await api.get('/test')
      expect(response.data).toEqual({ success: true })

      const request = mock.history.get[0]
      expect(request.headers?.Authorization).toBe('Bearer test-token')
    })

    it('should not add Authorization header when no token', async () => {
      mock.onGet('/test').reply(200, { success: true })

      const response = await api.get('/test')
      expect(response.data).toEqual({ success: true })

      const request = mock.history.get[0]
      expect(request.headers?.Authorization).toBeUndefined()
    })
  })

  describe('response interceptor - token refresh', () => {

    it('should handle refresh failure gracefully', async () => {
      localStorage.setItem('access_token', 'expired')
      localStorage.setItem('refresh_token', 'invalid')

      mock.onGet('/api/test').replyOnce(401)
      mock.onPost('http://localhost:8000/api/auth/refresh').reply(401)

      try {
        await api.get('/api/test')
      } catch (error) {
        expect(error).toBeDefined()
      }

      expect(localStorage.getItem('access_token')).toBeNull()
      expect(localStorage.getItem('refresh_token')).toBeNull()
    })
  })
})