import { render, screen, fireEvent } from '@testing-library/react'
import { AreaSelector } from '../area-selector'
import { AreaProvider } from '@/contexts/area-context'

describe('AreaSelector', () => {
  it('should not render when canSwitchArea is false', () => {
    const { container } = render(
      <AreaProvider userRole="ESTUDIANTE">
        <AreaSelector />
      </AreaProvider>
    )
    
    expect(container.firstChild).toBeNull()
  })

  it('should render when canSwitchArea is true (SUPER_ADMIN)', () => {
    render(
      <AreaProvider userRole="SUPER_ADMIN">
        <AreaSelector />
      </AreaProvider>
    )
    
    expect(screen.getByText('Área:')).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('should display current area value', () => {
    render(
      <AreaProvider userRole="SUPER_ADMIN" initialArea="cultura">
        <AreaSelector />
      </AreaProvider>
    )
    
    const select = screen.getByRole('combobox') as HTMLSelectElement
    expect(select.value).toBe('cultura')
  })

  it('should have both cultura and deporte options', () => {
    render(
      <AreaProvider userRole="SUPER_ADMIN">
        <AreaSelector />
      </AreaProvider>
    )
    
    expect(screen.getByText('Cultura')).toBeInTheDocument()
    expect(screen.getByText('Deporte')).toBeInTheDocument()
  })

  it('should call setArea when selection changes', () => {
    render(
      <AreaProvider userRole="SUPER_ADMIN" initialArea="cultura">
        <AreaSelector />
      </AreaProvider>
    )
    
    const select = screen.getByRole('combobox') as HTMLSelectElement
    
    // Change to deporte
    fireEvent.change(select, { target: { value: 'deporte' } })
    
    expect(select.value).toBe('deporte')
  })

  it('should not render for ADMIN_CULTURA', () => {
    const { container } = render(
      <AreaProvider userRole="ADMIN_CULTURA">
        <AreaSelector />
      </AreaProvider>
    )
    
    expect(container.firstChild).toBeNull()
  })

  it('should not render for DIRECTOR', () => {
    const { container } = render(
      <AreaProvider userRole="DIRECTOR">
        <AreaSelector />
      </AreaProvider>
    )
    
    expect(container.firstChild).toBeNull()
  })

  it('should not render for MONITOR', () => {
    const { container } = render(
      <AreaProvider userRole="MONITOR">
        <AreaSelector />
      </AreaProvider>
    )
    
    expect(container.firstChild).toBeNull()
  })

  it('should not render for ENTRENADOR', () => {
    const { container } = render(
      <AreaProvider userRole="ENTRENADOR">
        <AreaSelector />
      </AreaProvider>
    )
    
    expect(container.firstChild).toBeNull()
  })
})
