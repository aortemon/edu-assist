import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import FlashcardsPage from '../../pages/FlashcardsPage'
import { AuthContext } from '../../auth/AuthContext'
import api from '../../api/client'

jest.mock('../../api/client')
jest.mock('../../components/FlashcardFlip', () => {
  return function MockFlashcardFlip({ front, back }) {
    return <div data-testid="flashcard">Вопрос: {front} | Ответ: {back}</div>
  }
})
jest.mock('../../components/ModelSelector', () => {
  return function MockModelSelector({ onChange, value }) {
    return (
      <select data-testid="model-selector" onChange={(e) => onChange(e.target.value)} value={value}>
        <option value="">Выберите модель</option>
        <option value="gpt-4">GPT-4</option>
        <option value="llama2">Llama 2</option>
      </select>
    )
  }
})

const renderWithAuth = () => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={{ user: { username: 'test' }, loading: false }}>
        <FlashcardsPage />
      </AuthContext.Provider>
    </BrowserRouter>
  )
}

describe('FlashcardsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    api.get.mockResolvedValue({ data: { models: ['gpt-4', 'llama2'] } })
  })

  it('should render flashcards page', () => {
    renderWithAuth()
    expect(screen.getByText('Карточки для запоминания')).toBeInTheDocument()
    expect(screen.getByText('Из текста')).toBeInTheDocument()
    expect(screen.getByText('По теме')).toBeInTheDocument()
  })

  it('should generate flashcards from text', async () => {
    const user = userEvent.setup()
    const mockFlashcards = [
      { front: 'Вопрос 1', back: 'Ответ 1' },
      { front: 'Вопрос 2', back: 'Ответ 2' }
    ]

    api.post.mockResolvedValueOnce({
      data: { success: true, output: mockFlashcards }
    })

    renderWithAuth()

    const textarea = screen.getByPlaceholderText('Вставьте текст...')
    await user.type(textarea, 'Тестовый текст для карточек')

    const generateButton = screen.getByRole('button', { name: 'Сгенерировать карточки' })
    await user.click(generateButton)

    await waitFor(() => {
      expect(screen.getByText('Ваши карточки')).toBeInTheDocument()
      expect(screen.getByText('2 карточек')).toBeInTheDocument()
    })
  })

  it('should adjust number of cards via slider', async () => {
    const user = userEvent.setup()
    renderWithAuth()

    const slider = screen.getByRole('slider')
    await user.click(slider)
    expect(slider).toBeInTheDocument()
    expect(slider).toHaveAttribute('min', '1')
    expect(slider).toHaveAttribute('max', '20')
  })
})