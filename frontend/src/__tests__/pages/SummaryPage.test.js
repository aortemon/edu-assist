import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import SummaryPage from '../../pages/SummaryPage'
import { AuthContext } from '../../auth/AuthContext'
import api from '../../api/client'

jest.mock('../../api/client')

jest.mock('../../components/MarkdownRenderer', () => {
  return function MockMarkdownRenderer({ content }) {
    return <div data-testid="markdown-content">{content}</div>
  }
})

jest.mock('../../components/ModelSelector', () => {
  return function MockModelSelector({ onChange, value, autoSelectFirst }) {
    return (
      <select
        data-testid="model-selector"
        onChange={(e) => onChange(e.target.value)}
        value={value}
      >
        <option value="">Выберите модель</option>
        <option value="gpt-4">GPT-4</option>
        <option value="llama2">Llama 2</option>
      </select>
    )
  }
})

const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}))

const renderWithAuth = () => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={{ user: { username: 'test' }, loading: false }}>
        <SummaryPage />
      </AuthContext.Provider>
    </BrowserRouter>
  )
}

describe('SummaryPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    api.get.mockResolvedValue({ data: { models: ['gpt-4', 'llama2'] } })
  })

  it('should render summary page', () => {
    renderWithAuth()
    expect(screen.getByText('Конспект')).toBeInTheDocument()
    expect(screen.getByText('Из текста')).toBeInTheDocument()
    expect(screen.getByText('По теме')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Сгенерировать конспект' })).toBeInTheDocument()
  })

  it('should generate summary from text', async () => {
    const user = userEvent.setup()
    api.post.mockResolvedValueOnce({
      data: {
        success: true,
        output: 'Это сгенерированный конспект',
        processing_time_ms: 123,
        from_cache: false
      }
    })

    renderWithAuth()

    const textarea = screen.getByPlaceholderText('Вставьте текст...')
    await user.type(textarea, 'Тестовый текст для конспекта')

    const generateButton = screen.getByRole('button', { name: 'Сгенерировать конспект' })
    await user.click(generateButton)

    await waitFor(() => {
      expect(screen.getByTestId('markdown-content')).toBeInTheDocument()
      expect(screen.getByText('Это сгенерированный конспект')).toBeInTheDocument()
    })
  })

  it('should show error on generation failure', async () => {
    const user = userEvent.setup()
    api.post.mockRejectedValueOnce({
      response: { data: { detail: 'Ошибка генерации' } }
    })

    renderWithAuth()

    const textarea = screen.getByPlaceholderText('Вставьте текст...')
    await user.type(textarea, 'Тестовый текст')

    const generateButton = screen.getByRole('button', { name: 'Сгенерировать конспект' })
    await user.click(generateButton)

    await waitFor(() => {
      expect(screen.getByText('Ошибка генерации')).toBeInTheDocument()
    })
  })

  it('should show generic error when no detail provided', async () => {
    const user = userEvent.setup()
    api.post.mockRejectedValueOnce({ response: { data: {} } })

    renderWithAuth()

    const textarea = screen.getByPlaceholderText('Вставьте текст...')
    await user.type(textarea, 'Тестовый текст')

    const generateButton = screen.getByRole('button', { name: 'Сгенерировать конспект' })
    await user.click(generateButton)

    await waitFor(() => {
      expect(screen.getByText('Ошибка генерации')).toBeInTheDocument()
    })
  })

  it('should switch between text and topic modes', async () => {
    const user = userEvent.setup()
    renderWithAuth()

    const topicButton = screen.getByText('По теме')
    await user.click(topicButton)

    expect(screen.getByPlaceholderText('Например: Основы машинного обучения')).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('Вставьте текст...')).not.toBeInTheDocument()
  })

  it('should adjust max points via slider', () => {
    renderWithAuth()
    const slider = screen.getByRole('slider')
    expect(slider).toBeInTheDocument()
    expect(slider).toHaveAttribute('min', '3')
    expect(slider).toHaveAttribute('max', '20')
  })
})