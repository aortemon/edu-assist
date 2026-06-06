import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider, AuthContext } from '../../auth/AuthContext'
import { useAuth } from '../../auth/useAuth'
import api from '../../api/client'

jest.mock('../../api/client')

const TestComponent = () => {
  const { user, loading, login, logout, register } = useAuth()
  return (
    <div>
      <div data-testid="loading">{loading.toString()}</div>
      <div data-testid="user">{user?.username || 'no-user'}</div>
      <button onClick={() => login('test', 'pass')}>Login</button>
      <button onClick={() => register('user', 'email@test.com', 'pass')}>Register</button>
      <button onClick={logout}>Logout</button>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear()
    jest.clearAllMocks()
  })

  it('should load user from token on mount', async () => {
    localStorage.setItem('access_token', 'valid-token')
    api.get.mockResolvedValueOnce({ data: { username: 'john' } })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false')
      expect(screen.getByTestId('user')).toHaveTextContent('john')
    })
    expect(api.get).toHaveBeenCalledWith('/api/users/me')
  })

  it('should clear tokens if profile fetch fails', async () => {
    localStorage.setItem('access_token', 'invalid')
    localStorage.setItem('refresh_token', 'some-refresh')
    api.get.mockRejectedValueOnce(new Error('Unauthorized'))

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('false')
      expect(screen.getByTestId('user')).toHaveTextContent('no-user')
    })

    expect(localStorage.getItem('access_token')).toBeNull()
    expect(localStorage.getItem('refresh_token')).toBeNull()
  })

  it('should login successfully', async () => {
    const user = userEvent.setup()
    api.post.mockResolvedValueOnce({
      data: { access_token: 'new-token', refresh_token: 'new-refresh' }
    })
    api.get.mockResolvedValueOnce({ data: { username: 'testuser' } })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await user.click(screen.getByText('Login'))

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('testuser')
    })
    expect(localStorage.getItem('access_token')).toBe('new-token')
    expect(localStorage.getItem('refresh_token')).toBe('new-refresh')
    expect(api.post).toHaveBeenCalledWith('/api/auth/login', {
      username: 'test',
      password: 'pass'
    })
  })

  it('should logout and clear user', async () => {
    localStorage.setItem('access_token', 'token')
    api.get.mockResolvedValueOnce({ data: { username: 'john' } })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('user')).toHaveTextContent('john')
    })

    const userEventInstance = userEvent.setup()
    await userEventInstance.click(screen.getByText('Logout'))

    expect(screen.getByTestId('user')).toHaveTextContent('no-user')
    expect(localStorage.getItem('access_token')).toBeNull()
    expect(localStorage.getItem('refresh_token')).toBeNull()
  })
})

describe('useAuth hook', () => {
  it('should throw error when used outside AuthProvider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => { })

    const BrokenComponent = () => {
      useAuth()
      return null
    }

    expect(() => render(<BrokenComponent />)).toThrow(
      'useAuth must be used within AuthProvider'
    )
    consoleError.mockRestore()
  })
})