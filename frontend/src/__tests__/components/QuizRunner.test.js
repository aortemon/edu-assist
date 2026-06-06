import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import QuizRunner from '../../components/QuizRunner'

const mockQuiz = [
  {
    question: 'Что такое JSX?',
    options: ['JavaScript XML', 'Java Syntax Extension', 'JSON XHR'],
    correct: 0,
    explanation: 'JSX расширяет синтаксис JavaScript'
  },
  {
    question: 'Что такое хук useState?',
    options: ['Функция для работы с состоянием', 'Класс для создания компонентов', 'Метод для API вызовов'],
    correct: 0,
    explanation: 'useState позволяет использовать состояние в функциональных компонентах'
  }
]

describe('QuizRunner', () => {
  it('should render all questions', () => {
    render(<QuizRunner quiz={mockQuiz} />)

    expect(screen.getByText('Что такое JSX?')).toBeInTheDocument()
    expect(screen.getByText('Что такое хук useState?')).toBeInTheDocument()
    expect(screen.getByText('JavaScript XML')).toBeInTheDocument()
    expect(screen.getByText('Функция для работы с состоянием')).toBeInTheDocument()
  })

  it('should show "Нет вопросов" when quiz is empty', () => {
    render(<QuizRunner quiz={[]} />)
    expect(screen.getByText('Нет вопросов для теста.')).toBeInTheDocument()
  })

  it('should enable submit button only after all questions are answered', async () => {
    const user = userEvent.setup()
    render(<QuizRunner quiz={mockQuiz} />)

    const submitButton = screen.getByText('Отправить ответы')
    expect(submitButton).toBeDisabled()

    await user.click(screen.getByLabelText('JavaScript XML'))
    expect(submitButton).toBeDisabled()

    await user.click(screen.getByLabelText('Функция для работы с состоянием'))
    expect(submitButton).toBeEnabled()
  })

  it('should calculate and display score after submission', async () => {
    const user = userEvent.setup()
    render(<QuizRunner quiz={mockQuiz} />)

    await user.click(screen.getByLabelText('JavaScript XML'))
    await user.click(screen.getByLabelText('Функция для работы с состоянием'))
    await user.click(screen.getByText('Отправить ответы'))

    expect(screen.getByText('Результат: 2/2 (100%)')).toBeInTheDocument()
    expect(screen.getByText('Повторить')).toBeInTheDocument()
  })

  it('should show correct and wrong marks after submission', async () => {
    const user = userEvent.setup()
    render(<QuizRunner quiz={mockQuiz} />)

    await user.click(screen.getByLabelText('JavaScript XML'))
    await user.click(screen.getByLabelText('Класс для создания компонентов'))
    await user.click(screen.getByText('Отправить ответы'))

    const correctMarks = screen.getAllByText('✓')
    expect(correctMarks.length).toBeGreaterThan(0)

    const wrongMarks = screen.getAllByText('✗')
    expect(wrongMarks.length).toBeGreaterThan(0)
  })

  it('should show explanations after submission', async () => {
    const user = userEvent.setup()
    render(<QuizRunner quiz={mockQuiz} />)

    await user.click(screen.getByLabelText('JavaScript XML'))
    await user.click(screen.getByLabelText('Функция для работы с состоянием'))
    await user.click(screen.getByText('Отправить ответы'))

    expect(screen.getByText('JSX расширяет синтаксис JavaScript')).toBeInTheDocument()
    expect(screen.getByText('useState позволяет использовать состояние в функциональных компонентах')).toBeInTheDocument()
  })

  it('should reset quiz when "Повторить" is clicked', async () => {
    const user = userEvent.setup()
    render(<QuizRunner quiz={mockQuiz} />)

    await user.click(screen.getByLabelText('JavaScript XML'))
    await user.click(screen.getByLabelText('Функция для работы с состоянием'))
    await user.click(screen.getByText('Отправить ответы'))

    expect(screen.getByText('Результат: 2/2 (100%)')).toBeInTheDocument()

    await user.click(screen.getByText('Повторить'))

    expect(screen.getByText('Отправить ответы')).toBeInTheDocument()
    expect(screen.queryByText('Результат:')).not.toBeInTheDocument()
  })

  it('should disable radio buttons after submission', async () => {
    const user = userEvent.setup()
    render(<QuizRunner quiz={mockQuiz} />)

    await user.click(screen.getByLabelText('JavaScript XML'))
    await user.click(screen.getByLabelText('Функция для работы с состоянием'))
    await user.click(screen.getByText('Отправить ответы'))

    const radios = screen.getAllByRole('radio')
    radios.forEach(radio => {
      expect(radio).toBeDisabled()
    })
  })
})