import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import FavoritesPage from '../../pages/FavoritesPage'
import { AuthContext } from '../../auth/AuthContext'
import api from '../../api/client'

jest.mock('../../api/client')
jest.mock('../../components/HistoryDetailModal', () => {
  return function MockModal({ show, onClose, generationId }) {
    return show ? <div data-testid="modal">Modal for {generationId}</div> : null
  }
})

const mockFavorites = {
  items: [
    {
      favorite_id: 1,
      generation_id: 101,
      type: 'summary',
      input_content: 'Любимый конспект',
      model_used: 'gpt-4',
      created_at: '2024-01-01T00:00:00Z'
    }
  ]
}

const renderWithAuth = async () => {
  let result
  await act(async () => {
    result = render(
      <BrowserRouter>
        <AuthContext.Provider value={{ user: { username: 'test' }, loading: false }}>
          <FavoritesPage />
        </AuthContext.Provider>
      </BrowserRouter>
    )
  })
  return result
}

describe('FavoritesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    window.confirm = jest.fn()
  })

  it('should render favorites page with items', async () => {
    api.get.mockResolvedValueOnce({ data: mockFavorites })

    await renderWithAuth()

    await waitFor(() => {
      expect(screen.getByText('Избранное')).toBeInTheDocument()
      expect(screen.getByText('Любимый конспект')).toBeInTheDocument()
    })
  })

  it('should show empty state when no favorites', async () => {
    api.get.mockResolvedValueOnce({ data: { items: [] } })

    await renderWithAuth()

    await waitFor(() => {
      expect(screen.getByText('Пока нет избранных')).toBeInTheDocument()
      expect(screen.getByText('Отмечайте понравившиеся генерации в истории, чтобы они появились здесь')).toBeInTheDocument()
    })
  })

  it('should remove favorite when delete button clicked and confirmed', async () => {
    const user = userEvent.setup()
    window.confirm.mockReturnValue(true)

    api.get.mockResolvedValueOnce({ data: mockFavorites })
    api.delete.mockResolvedValueOnce({})
    api.get.mockResolvedValueOnce({ data: { items: [] } })

    await renderWithAuth()

    await waitFor(() => {
      expect(screen.getByText('Любимый конспект')).toBeInTheDocument()
    })

    const deleteButton = screen.getByText('Удалить')
    await user.click(deleteButton)

    expect(window.confirm).toHaveBeenCalledWith('Удалить из избранного?')
    expect(api.delete).toHaveBeenCalledWith('/api/favorites/1')
  })

  it('should NOT remove favorite when confirmation cancelled', async () => {
    const user = userEvent.setup()
    window.confirm.mockReturnValue(false)

    api.get.mockResolvedValueOnce({ data: mockFavorites })

    await renderWithAuth()

    await waitFor(() => {
      expect(screen.getByText('Любимый конспект')).toBeInTheDocument()
    })

    const deleteButton = screen.getByText('Удалить')
    await user.click(deleteButton)

    expect(window.confirm).toHaveBeenCalledWith('Удалить из избранного?')
    expect(api.delete).not.toHaveBeenCalled()
  })

  it('should open modal when clicking on favorite item', async () => {
    const user = userEvent.setup()

    api.get.mockResolvedValueOnce({ data: mockFavorites })

    await renderWithAuth()

    await waitFor(() => {
      expect(screen.getByText('Любимый конспект')).toBeInTheDocument()
    })

    const favoriteItem = screen.getByText('Любимый конспект').closest('.results-section')
    await user.click(favoriteItem)

    expect(screen.getByTestId('modal')).toBeInTheDocument()
  })
})