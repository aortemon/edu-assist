import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ModelSelector from '../../components/ModelSelector'
import api from '../../api/client'

jest.mock('../../api/client')

describe('ModelSelector', () => {
  const mockOnChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should fetch and display models on mount', async () => {
    api.get.mockResolvedValueOnce({
      data: { models: ['gpt-4', 'llama2', 'claude-2'] }
    })

    await act(async () => {
      render(<ModelSelector value="" onChange={mockOnChange} />)
    })

    await waitFor(() => {
      expect(screen.getByText('gpt-4')).toBeInTheDocument()
      expect(screen.getByText('llama2')).toBeInTheDocument()
      expect(screen.getByText('claude-2')).toBeInTheDocument()
    })
  })

  it('should auto-select first model when autoSelectFirst is true and no value', async () => {
    api.get.mockResolvedValueOnce({
      data: { models: ['gpt-4', 'llama2'] }
    })

    await act(async () => {
      render(<ModelSelector value="" onChange={mockOnChange} autoSelectFirst={true} />)
    })

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith('gpt-4')
    })
  })

  it('should not auto-select when autoSelectFirst is false', async () => {
    api.get.mockResolvedValueOnce({
      data: { models: ['gpt-4', 'llama2'] }
    })

    await act(async () => {
      render(<ModelSelector value="" onChange={mockOnChange} autoSelectFirst={false} />)
    })

    await waitFor(() => {
      expect(mockOnChange).not.toHaveBeenCalled()
    })
  })

  it('should call onChange when user selects a model', async () => {
    const user = userEvent.setup()
    api.get.mockResolvedValueOnce({
      data: { models: ['gpt-4', 'llama2'] }
    })

    await act(async () => {
      render(<ModelSelector value="" onChange={mockOnChange} />)
    })

    await waitFor(() => {
      expect(screen.getByText('gpt-4')).toBeInTheDocument()
    })

    await user.selectOptions(screen.getByRole('combobox'), 'llama2')
    expect(mockOnChange).toHaveBeenCalledWith('llama2')
  })

  it('should display error when API fails', async () => {
    api.get.mockRejectedValueOnce(new Error('Network error'))

    await act(async () => {
      render(<ModelSelector value="" onChange={mockOnChange} />)
    })

    await waitFor(() => {
      expect(screen.getByText('Не удалось загрузить модели')).toBeInTheDocument()
    })
  })

  it('should show loading spinner while fetching', async () => {
    let resolvePromise
    const promise = new Promise((resolve) => {
      resolvePromise = resolve
    })
    api.get.mockReturnValue(promise)

    await act(async () => {
      render(<ModelSelector value="" onChange={mockOnChange} />)
    })

    expect(screen.getByText('Модель')).toBeInTheDocument()
    expect(document.querySelector('.spinner')).toBeInTheDocument()

    await act(async () => {
      resolvePromise({ data: { models: [] } })
      await promise
    })

    await waitFor(() => {
      expect(document.querySelector('.spinner')).not.toBeInTheDocument()
    })
  })

  it('should render custom label and placeholder', async () => {
    api.get.mockResolvedValueOnce({ data: { models: [] } })

    await act(async () => {
      render(
        <ModelSelector
          value=""
          onChange={mockOnChange}
          label="Выберите ИИ модель"
          placeholder="Не выбрано"
        />
      )
    })

    expect(screen.getByText('Выберите ИИ модель')).toBeInTheDocument()
    expect(screen.getByText('Не выбрано')).toBeInTheDocument()
  })
})