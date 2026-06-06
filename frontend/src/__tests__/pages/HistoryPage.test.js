import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import HistoryPage from '../../pages/HistoryPage'
import { AuthContext } from '../../auth/AuthContext'
import api from '../../api/client'

jest.mock('../../api/client')
jest.mock('../../components/HistoryDetailModal', () => {
  return function MockModal({ show, onClose, generationId }) {
    return show ? <div data-testid="modal">Modal for {generationId}</div> : null
  }
})

const mockHistoryItems = {
  items: [
    {
      id: 1,
      type: 'summary',
      input_content: 'Тестовый текст',
      model_used: 'gpt-4',
      processing_time_ms: 123,
      created_at: '2024-01-01T00:00:00Z',
      is_favorite: false
    },
    {
      id: 2,
      type: 'flashcards',
      input_content: 'Другой текст',
      model_used: 'llama2',
      processing_time_ms: 456,
      created_at: '2024-01-02T00:00:00Z',
      is_favorite: true
    }
  ],
  total: 2,
  pages: 1
}

const renderWithAuth = () => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={{ user: { username: 'test' }, loading: false }}>
        <HistoryPage />
      </AuthContext.Provider>
    </BrowserRouter>
  )
}

describe('HistoryPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render history page with items', async () => {
    api.get.mockResolvedValueOnce({ data: mockHistoryItems })

    renderWithAuth()

    await waitFor(() => {
      expect(screen.getByText('История генераций')).toBeInTheDocument()
      expect(screen.getByText('Тестовый текст')).toBeInTheDocument()
      expect(screen.getByText('Другой текст')).toBeInTheDocument()
    })
  })

  it('should show empty state when no history', async () => {
    api.get.mockResolvedValueOnce({ data: { items: [], total: 0, pages: 0 } })

    renderWithAuth()

    await waitFor(() => {
      expect(screen.getByText('История пуста. Сгенерируйте что-нибудь!')).toBeInTheDocument()
    })
  })

  it('should filter by type', async () => {
    const user = userEvent.setup()
    api.get.mockResolvedValue({ data: mockHistoryItems })

    renderWithAuth()

    await waitFor(() => {
      expect(screen.getByText('Тестовый текст')).toBeInTheDocument()
    })

    const filterSelect = screen.getByRole('combobox')
    await user.selectOptions(filterSelect, 'summary')

    expect(api.get).toHaveBeenCalledWith('/api/history', expect.objectContaining({
      params: expect.objectContaining({ type: 'summary' })
    }))
  })

  it('should search by text', async () => {
    const user = userEvent.setup()
    api.get.mockResolvedValue({ data: mockHistoryItems })

    renderWithAuth()

    const searchInput = screen.getByPlaceholderText('Поиск...')
    await user.type(searchInput, 'test')
    await user.click(screen.getByText('Искать'))

    expect(api.get).toHaveBeenCalledWith('/api/history', expect.objectContaining({
      params: expect.objectContaining({ search: 'test' })
    }))
  })
})