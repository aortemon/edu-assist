import { render, screen } from '@testing-library/react'
import MarkdownRenderer from '../../components/MarkdownRenderer'

jest.mock('react-markdown', () => {
  return function MockReactMarkdown({ children }) {
    return <div data-testid="markdown-content">{children}</div>
  }
})

jest.mock('remark-gfm', () => () => ({}))
jest.mock('rehype-raw', () => () => ({}))

describe('MarkdownRenderer', () => {
  it('should render plain text', () => {
    render(<MarkdownRenderer content="Простой текст" />)
    expect(screen.getByTestId('markdown-content')).toBeInTheDocument()
    expect(screen.getByText('Простой текст')).toBeInTheDocument()
  })

  it('should render heading 1', () => {
    render(<MarkdownRenderer content="# Заголовок 1" />)
    expect(screen.getByText('# Заголовок 1')).toBeInTheDocument()
  })

  it('should render heading 2', () => {
    render(<MarkdownRenderer content="## Заголовок 2" />)
    expect(screen.getByText('## Заголовок 2')).toBeInTheDocument()
  })

  it('should render heading 3', () => {
    render(<MarkdownRenderer content="### Заголовок 3" />)
    expect(screen.getByText('### Заголовок 3')).toBeInTheDocument()
  })

  it('should render bold text', () => {
    render(<MarkdownRenderer content="Это **жирный** текст" />)
    expect(screen.getByText('Это **жирный** текст')).toBeInTheDocument()
  })

  it('should render italic text', () => {
    render(<MarkdownRenderer content="Это *курсив* текст" />)
    expect(screen.getByText('Это *курсив* текст')).toBeInTheDocument()
  })

  it('should render inline code', () => {
    render(<MarkdownRenderer content="Вот `const x = 5` код" />)
    expect(screen.getByText('Вот `const x = 5` код')).toBeInTheDocument()
  })

  it('should render unordered list', () => {
    const { container } = render(<MarkdownRenderer content="- Первый пункт\n- Второй пункт" />)
    const markdownDiv = container.querySelector('[data-testid="markdown-content"]')
    expect(markdownDiv.innerHTML).toContain('Первый пункт')
    expect(markdownDiv.innerHTML).toContain('Второй пункт')
  })

  it('should render blockquote', () => {
    const content = '> Это цитата'
    render(<MarkdownRenderer content={content} />)
    expect(screen.getByText(content)).toBeInTheDocument()
  })

  it('should render table', () => {
    const content = '| Header 1 | Header 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |'
    render(<MarkdownRenderer content={content} />)
    const markdownContent = screen.getByTestId('markdown-content')
    expect(markdownContent.textContent).toContain('Header 1')
    expect(markdownContent.textContent).toContain('Header 2')
    expect(markdownContent.textContent).toContain('Cell 1')
    expect(markdownContent.textContent).toContain('Cell 2')
  })

  it('should handle empty content', () => {
    render(<MarkdownRenderer content="" />)
    expect(screen.getByTestId('markdown-content')).toBeInTheDocument()
  })

  it('should handle complex markdown', () => {
    const content = `
# Main Title

## Subtitle

This is a **paragraph** with *formatting*.

- Item 1
- Item 2

> A beautiful quote

\`inline code\`
    `
    render(<MarkdownRenderer content={content} />)
    expect(screen.getByTestId('markdown-content')).toBeInTheDocument()
    expect(screen.getByText(/Main Title/)).toBeInTheDocument()
    expect(screen.getByText(/Subtitle/)).toBeInTheDocument()
    expect(screen.getByText(/Item 1/)).toBeInTheDocument()
  })
})