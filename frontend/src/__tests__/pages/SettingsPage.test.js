import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import SettingsPage from '../../pages/SettingsPage'
import { AuthContext } from '../../auth/AuthContext'
import api from '../../api/client'

jest.mock('../../api/client')

const mockUser = {
  username: 'testuser',
  settings: JSON.stringify({
    default_model: 'llama3.1',
    temperature: 0.5
  })
}

const renderWithAuth = () => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={{ user: mockUser, loading: false }}>
        <SettingsPage />
      </AuthContext.Provider>
    </BrowserRouter>
  )
}

describe('SettingsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render settings page', () => {
    renderWithAuth()
    expect(screen.getByText('Настройки')).toBeInTheDocument()
    expect(screen.getByText('Настройки генерации')).toBeInTheDocument()
    expect(screen.getByText('API-доступ')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Сохранить настройки' })).toBeInTheDocument()
  })

  it('should load user settings on mount', () => {
    renderWithAuth()
    const modelInput = screen.getByPlaceholderText('llama3.1:latest')
    expect(modelInput.value).toBe('llama3.1')
  })

  it('should save settings', async () => {
    const user = userEvent.setup()
    renderWithAuth()

    const saveButton = screen.getByRole('button', { name: 'Сохранить настройки' })
    await user.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText('Настройки сохранены!')).toBeInTheDocument()
    })
  })

  it('should generate API key', async () => {
    const user = userEvent.setup()
    api.post.mockResolvedValueOnce({ data: { api_key: 'test-api-key-123' } })

    renderWithAuth()

    const generateButton = screen.getByRole('button', { name: 'Сгенерировать API-ключ' })
    await user.click(generateButton)

    await waitFor(() => {
      expect(screen.getByText('Новый API-ключ сгенерирован!')).toBeInTheDocument()
    })
  })
})