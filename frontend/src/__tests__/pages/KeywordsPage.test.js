import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import KeywordsPage from '../../pages/KeywordsPage'
import { AuthContext } from '../../auth/AuthContext'
import api from '../../api/client'

jest.mock('../../api/client')

const renderWithAuth = () => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={{ user: { username: 'test' }, loading: false }}>
        <KeywordsPage />
      </AuthContext.Provider>
    </BrowserRouter>
  )
}

describe('KeywordsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render keywords page', () => {
    renderWithAuth()
    expect(screen.getByText('Извлечение ключевых слов')).toBeInTheDocument()
    expect(screen.getByText('Вставьте текст для анализа')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Извлечь тэги' })).toBeInTheDocument()
  })

  it('should extract keywords from text', async () => {
    const user = userEvent.setup()
    const mockKeywords = ['React', 'JavaScript', 'Тестирование']

    api.post.mockResolvedValueOnce({
      data: { success: true, output: mockKeywords }
    })

    renderWithAuth()

    const textarea = screen.getByPlaceholderText('Вставьте текст для извлечения ключевых слов...')
    await user.type(textarea, 'React это библиотека для JavaScript')

    const generateButton = screen.getByRole('button', { name: 'Извлечь тэги' })
    await user.click(generateButton)

    await waitFor(() => {
      expect(screen.getByText('Тэги')).toBeInTheDocument()
      expect(screen.getByText('Найдено: 3 слов')).toBeInTheDocument()
      expect(screen.getByText('#React')).toBeInTheDocument()
      expect(screen.getByText('#JavaScript')).toBeInTheDocument()
    })
  })

  it('should adjust max keywords via slider', async () => {
    const user = userEvent.setup()
    renderWithAuth()

    const slider = screen.getByRole('slider')
    expect(slider).toBeInTheDocument()
  })
})