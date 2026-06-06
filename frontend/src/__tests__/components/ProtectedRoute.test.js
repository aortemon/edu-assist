import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ProtectedRoute from '../../components/ProtectedRoute'
import { AuthContext } from '../../auth/AuthContext'

const ProtectedContent = () => <div>Защищенный контент</div>

const renderWithAuth = (authValue, initialRoute = '/') => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <AuthContext.Provider value={authValue}>
        <Routes>
          <Route path="/login" element={<div>Страница входа</div>} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <ProtectedContent />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthContext.Provider>
    </MemoryRouter>
  )
}

describe('ProtectedRoute', () => {
  it('should render children when user is authenticated', () => {
    renderWithAuth({ user: { username: 'john' }, loading: false })
    expect(screen.getByText('Защищенный контент')).toBeInTheDocument()
  })

  it('should redirect to login when user is not authenticated', () => {
    renderWithAuth({ user: null, loading: false })
    expect(screen.getByText('Страница входа')).toBeInTheDocument()
  })

  it('should show loading spinner while checking auth', () => {
    renderWithAuth({ user: null, loading: true })
    expect(document.querySelector('.spinner-border')).toBeInTheDocument()
  })
})