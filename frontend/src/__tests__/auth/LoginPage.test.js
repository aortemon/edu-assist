import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import LoginPage from '../../auth/LoginPage'
import { AuthContext } from '../../auth/AuthContext'

const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  Link: ({ children, to }) => <a href={to}>{children}</a>
}))

const renderWithAuth = (authValue) => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={authValue}>
        <LoginPage />
      </AuthContext.Provider>
    </BrowserRouter>
  )
}

describe('LoginPage', () => {
  let mockLogin

  beforeEach(() => {
    mockLogin = jest.fn()
    mockNavigate.mockClear()
  })

  it('should render login form', () => {
    renderWithAuth({ login: mockLogin, loading: false })

    expect(screen.getByText('Вход в EduAssist')).toBeInTheDocument()
    expect(screen.getByText('Имя пользователя или Email')).toBeInTheDocument()
    expect(screen.getByText('Пароль')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Войти' })).toBeInTheDocument()
    expect(screen.getByText('Регистрация')).toBeInTheDocument()
  })

  it('should submit form with username and password', async () => {
    const user = userEvent.setup()
    mockLogin.mockResolvedValueOnce()
    renderWithAuth({ login: mockLogin, loading: false })

    const inputs = document.querySelectorAll('.input-textarea')
    const usernameInput = inputs[0]
    const passwordInput = inputs[1]

    await user.type(usernameInput, 'testuser')
    await user.type(passwordInput, 'password123')
    await user.click(screen.getByRole('button', { name: 'Войти' }))

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('testuser', 'password123')
      expect(mockNavigate).toHaveBeenCalledWith('/')
    })
  })

  it('should show error on login failure', async () => {
    const user = userEvent.setup()
    const errorResponse = {
      response: { data: { detail: 'Неверные учетные данные' } }
    }
    mockLogin.mockRejectedValueOnce(errorResponse)

    renderWithAuth({ login: mockLogin, loading: false })

    const inputs = document.querySelectorAll('.input-textarea')
    const usernameInput = inputs[0]
    const passwordInput = inputs[1]

    await user.type(usernameInput, 'wrong')
    await user.type(passwordInput, 'wrong')
    await user.click(screen.getByRole('button', { name: 'Войти' }))

    await waitFor(() => {
      expect(screen.getByText('Неверные учетные данные')).toBeInTheDocument()
    })
  })

  it('should show generic error when no detail provided', async () => {
    const user = userEvent.setup()
    mockLogin.mockRejectedValueOnce({ response: { data: {} } })

    renderWithAuth({ login: mockLogin, loading: false })

    const inputs = document.querySelectorAll('.input-textarea')
    const usernameInput = inputs[0]
    const passwordInput = inputs[1]

    await user.type(usernameInput, 'test')
    await user.type(passwordInput, 'test')
    await user.click(screen.getByRole('button', { name: 'Войти' }))

    await waitFor(() => {
      expect(screen.getByText('Ошибка входа')).toBeInTheDocument()
    })
  })

  it('should disable button while loading', async () => {
    const user = userEvent.setup()
    let resolveLogin
    const loginPromise = new Promise((resolve) => {
      resolveLogin = resolve
    })
    mockLogin.mockReturnValue(loginPromise)

    renderWithAuth({ login: mockLogin, loading: false })

    const inputs = document.querySelectorAll('.input-textarea')
    const usernameInput = inputs[0]
    const passwordInput = inputs[1]

    await user.type(usernameInput, 'test')
    await user.type(passwordInput, 'test')

    const loginButton = screen.getByRole('button', { name: 'Войти' })
    await user.click(loginButton)

    const buttonAfterClick = screen.getByRole('button', { name: '' })
    expect(buttonAfterClick).toBeDisabled()
    expect(buttonAfterClick.querySelector('.spinner')).toBeInTheDocument()

    resolveLogin()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Войти' })).toBeEnabled()
    })
  })
})