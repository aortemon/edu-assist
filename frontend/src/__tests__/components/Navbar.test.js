import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter, MemoryRouter } from 'react-router-dom'
import Navbar from '../../components/Navbar'
import { AuthContext } from '../../auth/AuthContext'

const mockLogout = jest.fn()

const renderWithAuth = (user = { username: 'testuser' }, loading = false) => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={{ user, logout: mockLogout, loading }}>
        <Navbar />
      </AuthContext.Provider>
    </BrowserRouter>
  )
}

describe('Navbar', () => {
  beforeEach(() => {
    mockLogout.mockClear()
  })

  it('should not render when user is not authenticated', () => {
    renderWithAuth(null)
    expect(screen.queryByText('EduAssist')).not.toBeInTheDocument()
  })

  it('should render when user is authenticated', () => {
    renderWithAuth({ username: 'testuser' })
    expect(screen.getByText('EduAssist')).toBeInTheDocument()
    expect(screen.getByText('testuser')).toBeInTheDocument()
  })

  it('should show all navigation items', () => {
    renderWithAuth({ username: 'testuser' })

    expect(screen.getByText('Панель')).toBeInTheDocument()
    expect(screen.getByText('Конспект')).toBeInTheDocument()
    expect(screen.getByText('Карточки')).toBeInTheDocument()
    expect(screen.getByText('Тест')).toBeInTheDocument()
    expect(screen.getByText('Тэги')).toBeInTheDocument()
    expect(screen.getByText('История')).toBeInTheDocument()
    expect(screen.getByText('Избранное')).toBeInTheDocument()
  })

  it('should call logout when logout button clicked', async () => {
    const user = userEvent.setup()
    renderWithAuth({ username: 'testuser' })

    const logoutButton = screen.getByText('Выйти')
    await user.click(logoutButton)

    expect(mockLogout).toHaveBeenCalled()
  })
})