import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import HistoryDetailModal from '../../components/HistoryDetailModal'
import api from '../../api/client'

jest.mock('../../api/client')
jest.mock('../../components/FlashcardFlip', () => {
  return function MockFlashcardFlip({ front, back }) {
    return <div data-testid="flashcard">Вопрос: {front} | Ответ: {back}</div>
  }
})
jest.mock('../../components/QuizRunner', () => {
  return function MockQuizRunner({ quiz }) {
    return <div data-testid="quiz-runner">Тест: {quiz.length} вопросов</div>
  }
})
jest.mock('../../components/MarkdownRenderer', () => {
  return function MockMarkdownRenderer({ content }) {
    return <div data-testid="markdown-content">{content}</div>
  }
})

describe('HistoryDetailModal', () => {
  const mockOnClose = jest.fn()
  const mockOnFavoriteToggle = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  const renderModal = async (props = {}) => {
    let result
    await act(async () => {
      result = render(
        <HistoryDetailModal
          show={true}
          onClose={mockOnClose}
          generationId={1}
          onFavoriteToggle={mockOnFavoriteToggle}
          {...props}
        />
      )
    })
    return result
  }

  it('should not render when show is false', () => {
    render(
      <HistoryDetailModal
        show={false}
        onClose={mockOnClose}
        generationId={1}
      />
    )
    expect(screen.queryByText('Конспект')).not.toBeInTheDocument()
  })

  it('should render loading state', async () => {
    let resolvePromise
    const promise = new Promise((resolve) => {
      resolvePromise = resolve
    })
    api.get.mockReturnValue(promise)

    await renderModal()

    expect(document.querySelector('.spinner-border')).toBeInTheDocument()

    await act(async () => {
      resolvePromise({ data: {} })
      await promise
    })
  })

  it('should render summary content', async () => {
    const mockItem = {
      id: 1,
      type: 'summary',
      input_content: 'Тестовый ввод',
      output_content: '# Конспект\n\nСодержание конспекта',
      processing_time_ms: 123,
      model_used: 'gpt-4',
      created_at: '2024-01-01T00:00:00Z',
      from_cache: false,
      is_favorite: false,
      input_type: 'text',
      language: 'ru'
    }

    api.get.mockResolvedValueOnce({ data: mockItem })

    await renderModal()

    await waitFor(() => {
      expect(screen.getByText('Конспект')).toBeInTheDocument()
      expect(screen.getByText('Тестовый ввод')).toBeInTheDocument()
    })
  })

  it('should render flashcards type', async () => {
    const mockItem = {
      id: 1,
      type: 'flashcards',
      input_content: 'Текст для карточек',
      output_content: JSON.stringify([
        { front: 'Вопрос 1', back: 'Ответ 1' }
      ]),
      processing_time_ms: 123,
      model_used: 'gpt-4',
      created_at: '2024-01-01T00:00:00Z',
      from_cache: false,
      is_favorite: false,
      input_type: 'text'
    }

    api.get.mockResolvedValueOnce({ data: mockItem })

    await renderModal()

    await waitFor(() => {
      expect(screen.getByText('Карточки')).toBeInTheDocument()
      expect(screen.getByTestId('flashcard')).toBeInTheDocument()
    })
  })

  it('should render quiz type', async () => {
    const mockItem = {
      id: 1,
      type: 'quiz',
      input_content: 'Текст для теста',
      output_content: JSON.stringify([
        { question: 'Вопрос 1', options: ['A', 'B', 'C'], correct: 0 }
      ]),
      processing_time_ms: 123,
      model_used: 'gpt-4',
      created_at: '2024-01-01T00:00:00Z',
      from_cache: false,
      is_favorite: false,
      input_type: 'text'
    }

    api.get.mockResolvedValueOnce({ data: mockItem })

    await renderModal()

    await waitFor(() => {
      expect(screen.getByText('Тест')).toBeInTheDocument()
      expect(screen.getByTestId('quiz-runner')).toBeInTheDocument()
    })
  })

  it('should render keywords type', async () => {
    const mockItem = {
      id: 1,
      type: 'keywords',
      input_content: 'Текст для ключевых слов',
      output_content: JSON.stringify(['React', 'JavaScript', 'Тесты']),
      processing_time_ms: 123,
      model_used: 'gpt-4',
      created_at: '2024-01-01T00:00:00Z',
      from_cache: false,
      is_favorite: false,
      input_type: 'text'
    }

    api.get.mockResolvedValueOnce({ data: mockItem })

    await renderModal()

    await waitFor(() => {
      expect(screen.getByText('Ключевые слова')).toBeInTheDocument()
      expect(screen.getByText('#React')).toBeInTheDocument()
      expect(screen.getByText('#JavaScript')).toBeInTheDocument()
      expect(screen.getByText('#Тесты')).toBeInTheDocument()
    })
  })

  it('should render study_plan type with sessions', async () => {
    const mockItem = {
      id: 1,
      type: 'study_plan',
      input_content: 'Тема для плана',
      output_content: JSON.stringify({
        total_hours: 10,
        sessions: [
          { day: 1, topic: 'Введение', hours: 2, tasks: ['Прочитать', 'Посмотреть видео'] }
        ]
      }),
      processing_time_ms: 123,
      model_used: 'gpt-4',
      created_at: '2024-01-01T00:00:00Z',
      from_cache: false,
      is_favorite: false,
      input_type: 'text'
    }

    api.get.mockResolvedValueOnce({ data: mockItem })

    await renderModal()

    await waitFor(() => {
      expect(screen.getByText('Учебный план')).toBeInTheDocument()
      expect(screen.getByText('Всего часов: 10')).toBeInTheDocument()
      expect(screen.getByText('День 1:')).toBeInTheDocument()
      expect(screen.getByText('Введение')).toBeInTheDocument()
      expect(screen.getByText('Прочитать')).toBeInTheDocument()
      expect(screen.getByText('Посмотреть видео')).toBeInTheDocument()
    })
  })

  it('should render simplify type', async () => {
    const mockItem = {
      id: 1,
      type: 'simplify',
      input_content: 'Сложный текст',
      output_content: 'Упрощенный текст',
      processing_time_ms: 123,
      model_used: 'gpt-4',
      created_at: '2024-01-01T00:00:00Z',
      from_cache: false,
      is_favorite: false,
      input_type: 'text'
    }

    api.get.mockResolvedValueOnce({ data: mockItem })

    await renderModal()

    await waitFor(() => {
      expect(screen.getByText('Упрощение текста')).toBeInTheDocument()
      expect(screen.getByTestId('markdown-content')).toBeInTheDocument()
    })
  })

  it('should handle favorite toggle', async () => {
    const mockItem = {
      id: 1,
      type: 'summary',
      input_content: 'Тест',
      output_content: 'Результат',
      processing_time_ms: 123,
      model_used: 'gpt-4',
      created_at: '2024-01-01T00:00:00Z',
      from_cache: false,
      is_favorite: false
    }

    api.get.mockResolvedValueOnce({ data: mockItem })

    await renderModal()

    await waitFor(() => {
      expect(screen.getByText('☆ В избранное')).toBeInTheDocument()
    })

    const favButton = screen.getByText('☆ В избранное')
    await userEvent.click(favButton)

    expect(mockOnFavoriteToggle).toHaveBeenCalledWith(1, false)
  })

  it('should close modal when close button clicked', async () => {
    const mockItem = {
      id: 1,
      type: 'summary',
      input_content: 'Тест',
      output_content: 'Результат',
      processing_time_ms: 123,
      model_used: 'gpt-4',
      created_at: '2024-01-01T00:00:00Z',
      from_cache: false,
      is_favorite: false
    }

    api.get.mockResolvedValueOnce({ data: mockItem })

    await renderModal()

    await waitFor(() => {
      expect(screen.getByText('✕ Закрыть')).toBeInTheDocument()
    })

    const closeButton = screen.getByText('✕ Закрыть')
    await userEvent.click(closeButton)

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should handle error when API fails', async () => {
    api.get.mockRejectedValueOnce({
      response: { data: { detail: 'Ошибка загрузки данных' } }
    })

    await renderModal()

    await waitFor(() => {
      expect(screen.getByText('Ошибка загрузки данных')).toBeInTheDocument()
    })
  })

  it('should handle generic error when no detail provided', async () => {
    api.get.mockRejectedValueOnce({ response: { data: {} } })

    await renderModal()

    await waitFor(() => {
      expect(screen.getByText('Ошибка загрузки')).toBeInTheDocument()
    })
  })

  it('should copy input content to clipboard', async () => {
    const mockItem = {
      id: 1,
      type: 'summary',
      input_content: 'Текст для копирования',
      output_content: 'Результат',
      processing_time_ms: 123,
      model_used: 'gpt-4',
      created_at: '2024-01-01T00:00:00Z',
      from_cache: false,
      is_favorite: false,
      input_type: 'text'
    }

    Object.assign(navigator, {
      clipboard: { writeText: jest.fn() }
    })

    api.get.mockResolvedValueOnce({ data: mockItem })

    await renderModal()

    await waitFor(() => {
      expect(screen.getAllByText('Копировать').length).toBe(2)
    })

    const copyButtons = screen.getAllByText('Копировать')
    await userEvent.click(copyButtons[0])

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Текст для копирования')
  })

  it('should close modal by clicking on overlay', async () => {
    const mockItem = {
      id: 1,
      type: 'summary',
      input_content: 'Тест',
      output_content: 'Результат',
      processing_time_ms: 123,
      model_used: 'gpt-4',
      created_at: '2024-01-01T00:00:00Z',
      from_cache: false,
      is_favorite: false
    }

    api.get.mockResolvedValueOnce({ data: mockItem })

    await renderModal()

    await waitFor(() => {
      expect(screen.getByText('Конспект')).toBeInTheDocument()
    })

    const overlay = screen.getByText('Конспект').closest('div[style*="position: fixed"]')
    await userEvent.click(overlay)

    expect(mockOnClose).toHaveBeenCalled()
  })
})