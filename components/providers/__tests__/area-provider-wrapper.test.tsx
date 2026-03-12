import { render, screen, waitFor } from '@testing-library/react'
import { AreaProviderWrapper } from '../area-provider-wrapper'
import { useArea } from '@/contexts/area-context'

// Mock component to test the context
function TestComponent() {
  const { area, isSuperAdmin, canSwitchArea } = useArea()
  return (
    <div>
      <div data-testid="area">{area}</div>
      <div data-testid="isSuperAdmin">{isSuperAdmin.toString()}</div>
      <div data-testid="canSwitchArea">{canSwitchArea.toString()}</div>
    </div>
  )
}

describe('AreaProviderWrapper', () => {
  beforeEach(() => {
    // Clear sessionStorage and localStorage before each test
    sessionStorage.clear()
    localStorage.clear()
  })

  it('should provide default area as cultura for non-authenticated users', async () => {
    render(
      <AreaProviderWrapper>
        <TestComponent />
      </AreaProviderWrapper>
    )

    await waitFor(() => {
      expect(screen.getByTestId('area')).toHaveTextContent('cultura')
      expect(screen.getByTestId('isSuperAdmin')).toHaveTextContent('false')
      expect(screen.getByTestId('canSwitchArea')).toHaveTextContent('false')
    })
  })

  it('should detect super admin from sessionStorage', async () => {
    sessionStorage.setItem('userType', 'superadmin')
    sessionStorage.setItem('isSuperAdmin', 'true')

    render(
      <AreaProviderWrapper>
        <TestComponent />
      </AreaProviderWrapper>
    )

    await waitFor(() => {
      expect(screen.getByTestId('isSuperAdmin')).toHaveTextContent('true')
      expect(screen.getByTestId('canSwitchArea')).toHaveTextContent('true')
    })
  })

  it('should restore saved area for super admin from localStorage', async () => {
    sessionStorage.setItem('userType', 'superadmin')
    sessionStorage.setItem('isSuperAdmin', 'true')
    localStorage.setItem('selectedArea', 'deporte')

    render(
      <AreaProviderWrapper>
        <TestComponent />
      </AreaProviderWrapper>
    )

    await waitFor(() => {
      expect(screen.getByTestId('area')).toHaveTextContent('deporte')
      expect(screen.getByTestId('isSuperAdmin')).toHaveTextContent('true')
    })
  })

  it('should set area to cultura for regular admin', async () => {
    sessionStorage.setItem('userType', 'admin')
    sessionStorage.setItem('isSuperAdmin', 'false')

    render(
      <AreaProviderWrapper>
        <TestComponent />
      </AreaProviderWrapper>
    )

    await waitFor(() => {
      expect(screen.getByTestId('area')).toHaveTextContent('cultura')
      expect(screen.getByTestId('isSuperAdmin')).toHaveTextContent('false')
      expect(screen.getByTestId('canSwitchArea')).toHaveTextContent('false')
    })
  })

  it('should handle manager role correctly', async () => {
    sessionStorage.setItem('userType', 'manager')
    sessionStorage.setItem('userRole', 'DIRECTOR')

    render(
      <AreaProviderWrapper>
        <TestComponent />
      </AreaProviderWrapper>
    )

    await waitFor(() => {
      expect(screen.getByTestId('area')).toHaveTextContent('cultura')
      expect(screen.getByTestId('isSuperAdmin')).toHaveTextContent('false')
    })
  })
})
