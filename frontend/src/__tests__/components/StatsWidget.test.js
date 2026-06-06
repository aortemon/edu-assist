import { render, screen } from '@testing-library/react'
import StatsWidget from '../../components/StatsWidget'

describe('StatsWidget', () => {
  it('should render null when no stats provided', () => {
    const { container } = render(<StatsWidget stats={null} />)
    expect(container.firstChild).toBeNull()
  })

  it('should render all stats when provided', () => {
    const mockStats = {
      total_generations: 150,
      generations_last_7_days: 25,
      total_favorites: 12,
      avg_processing_time_ms: 342
    }

    render(<StatsWidget stats={mockStats} />)

    expect(screen.getByText('Всего генераций')).toBeInTheDocument()
    expect(screen.getByText('150')).toBeInTheDocument()

    expect(screen.getByText('За неделю')).toBeInTheDocument()
    expect(screen.getByText('25')).toBeInTheDocument()

    expect(screen.getByText('Избранное')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()

    expect(screen.getByText('Среднее время (мс)')).toBeInTheDocument()
    expect(screen.getByText('342')).toBeInTheDocument()
  })

  it('should handle zero values', () => {
    const zeroStats = {
      total_generations: 0,
      generations_last_7_days: 0,
      total_favorites: 0,
      avg_processing_time_ms: 0
    }

    render(<StatsWidget stats={zeroStats} />)

    const zeroElements = screen.getAllByText('0')
    expect(zeroElements).toHaveLength(4)
  })
})