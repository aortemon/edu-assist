import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FlashcardFlip from '../../components/FlashcardFlip'

describe('FlashcardFlip', () => {
  const defaultProps = {
    front: 'Что такое React?',
    back: 'Библиотека для создания пользовательских интерфейсов'
  }

  it('should render front side initially', () => {
    render(<FlashcardFlip {...defaultProps} />)
    expect(screen.getByText('Что такое React?')).toBeInTheDocument()
    expect(screen.getByText('Вопрос')).toBeInTheDocument()
    expect(screen.queryByText('Ответ')).not.toBeInTheDocument()
  })

  it('should flip to back side when clicked', async () => {
    const user = userEvent.setup()
    render(<FlashcardFlip {...defaultProps} />)

    const card = screen.getByText('Что такое React?').closest('.card')
    await user.click(card)

    expect(screen.getByText('Библиотека для создания пользовательских интерфейсов')).toBeInTheDocument()
    expect(screen.getByText('Ответ')).toBeInTheDocument()
    expect(screen.queryByText('Вопрос')).not.toBeInTheDocument()
  })

  it('should flip back when clicked again', async () => {
    const user = userEvent.setup()
    render(<FlashcardFlip {...defaultProps} />)

    const card = screen.getByText('Что такое React?').closest('.card')
    await user.click(card)
    await user.click(card)

    expect(screen.getByText('Что такое React?')).toBeInTheDocument()
    expect(screen.getByText('Вопрос')).toBeInTheDocument()
  })

  it('should show button text "Показать ответ" on front', () => {
    render(<FlashcardFlip {...defaultProps} />)
    expect(screen.getByText('Показать ответ')).toBeInTheDocument()
  })

  it('should show button text "Показать вопрос" on back', async () => {
    const user = userEvent.setup()
    render(<FlashcardFlip {...defaultProps} />)

    const card = screen.getByText('Что такое React?').closest('.card')
    await user.click(card)

    expect(screen.getByText('Показать вопрос')).toBeInTheDocument()
  })
})