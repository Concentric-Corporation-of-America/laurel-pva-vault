import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { render } from '@/test/test-utils'
import BucketGrid from './BucketGrid'

// These must be hoisted - no variables allowed
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } }
      }))
    }
  },
  getUserRole: vi.fn(),
}))

// Import the mocked module
import { supabase, getUserRole } from '@/integrations/supabase/client'

const mockBuckets = [
  {
    id: '1',
    name: 'laurel_real_property',
    display_name: 'Real Property Records',
    description: 'Property deeds and assessments',
    retention_period: 'Permanent'
  },
  {
    id: '2',
    name: 'laurel_motor_vehicles',
    display_name: 'Motor Vehicle Records',
    description: 'Vehicle valuations',
    retention_period: '7 years'
  },
  {
    id: '3',
    name: 'laurel_public_records',
    display_name: 'Public Records',
    description: 'Tax rolls and notices',
    retention_period: 'Permanent'
  }
]

const mockPermissions = [
  { bucket_id: '1', permission: 'admin' },
  { bucket_id: '2', permission: 'write' },
  { bucket_id: '3', permission: 'read' }
]

describe('BucketGrid', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const setupMocks = (role: 'public' | 'pva_admin' | 'deputy_pva' | 'senior_appraiser' | 'appraiser' | 'clerical_staff' | 'it_staff' | 'board_member' | 'taxpayer' | null = 'pva_admin', buckets = mockBuckets, permissions = mockPermissions) => {
    vi.mocked(getUserRole).mockResolvedValue({ data: role, error: null })

    const mockFrom = vi.mocked(supabase.from)
    mockFrom.mockImplementation((table: string) => {
      if (table === 'storage_buckets') {
        return {
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: buckets, error: null })
        } as any
      }
      if (table === 'bucket_permissions') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ data: permissions, error: null })
        } as any
      }
      return {} as any
    })
  }

  describe('Loading State', () => {
    it('shows loading skeleton while fetching data', () => {
      setupMocks()
      render(<BucketGrid userId="test-user-id" searchQuery="" />)

      // Should show 12 skeleton cards
      const skeletons = document.querySelectorAll('.animate-pulse')
      expect(skeletons.length).toBe(12)
    })
  })

  describe('Bucket Display', () => {
    it('renders all buckets after loading', async () => {
      setupMocks()
      render(<BucketGrid userId="test-user-id" searchQuery="" />)

      await waitFor(() => {
        expect(screen.getByText('Real Property Records')).toBeInTheDocument()
        expect(screen.getByText('Motor Vehicle Records')).toBeInTheDocument()
        expect(screen.getByText('Public Records')).toBeInTheDocument()
      })
    })

    it('displays bucket descriptions', async () => {
      setupMocks()
      render(<BucketGrid userId="test-user-id" searchQuery="" />)

      await waitFor(() => {
        expect(screen.getByText('Property deeds and assessments')).toBeInTheDocument()
        expect(screen.getByText('Vehicle valuations')).toBeInTheDocument()
      })
    })

    it('displays retention periods', async () => {
      setupMocks()
      render(<BucketGrid userId="test-user-id" searchQuery="" />)

      await waitFor(() => {
        // Two buckets have Permanent retention, one has 7 years
        const permanentRetentions = screen.getAllByText('Retention: Permanent')
        expect(permanentRetentions.length).toBe(2)
        expect(screen.getByText('Retention: 7 years')).toBeInTheDocument()
      })
    })
  })

  describe('Permission Badges', () => {
    it('displays correct permission badges for each bucket', async () => {
      setupMocks()
      render(<BucketGrid userId="test-user-id" searchQuery="" />)

      await waitFor(() => {
        expect(screen.getByText('admin')).toBeInTheDocument()
        expect(screen.getByText('write')).toBeInTheDocument()
        expect(screen.getByText('read')).toBeInTheDocument()
      })
    })

    it('shows "none" permission for buckets without explicit permission', async () => {
      setupMocks('taxpayer', mockBuckets, [{ bucket_id: '3', permission: 'read' }])
      render(<BucketGrid userId="test-user-id" searchQuery="" />)

      await waitFor(() => {
        // Should show 'none' for buckets 1 and 2, 'read' for bucket 3
        const noneBadges = screen.getAllByText('none')
        expect(noneBadges.length).toBe(2)
      })
    })
  })

  describe('Search Filtering', () => {
    it('filters buckets by display name', async () => {
      setupMocks()
      render(<BucketGrid userId="test-user-id" searchQuery="motor" />)

      await waitFor(() => {
        expect(screen.getByText('Motor Vehicle Records')).toBeInTheDocument()
        expect(screen.queryByText('Real Property Records')).not.toBeInTheDocument()
        expect(screen.queryByText('Public Records')).not.toBeInTheDocument()
      })
    })

    it('filters buckets by description', async () => {
      setupMocks()
      render(<BucketGrid userId="test-user-id" searchQuery="deeds" />)

      await waitFor(() => {
        expect(screen.getByText('Real Property Records')).toBeInTheDocument()
        expect(screen.queryByText('Motor Vehicle Records')).not.toBeInTheDocument()
      })
    })

    it('is case-insensitive', async () => {
      setupMocks()
      render(<BucketGrid userId="test-user-id" searchQuery="PROPERTY" />)

      await waitFor(() => {
        expect(screen.getByText('Real Property Records')).toBeInTheDocument()
      })
    })

    it('shows all buckets with empty search query', async () => {
      setupMocks()
      render(<BucketGrid userId="test-user-id" searchQuery="" />)

      await waitFor(() => {
        expect(screen.getByText('Real Property Records')).toBeInTheDocument()
        expect(screen.getByText('Motor Vehicle Records')).toBeInTheDocument()
        expect(screen.getByText('Public Records')).toBeInTheDocument()
      })
    })
  })

  describe('Role-Based Permissions', () => {
    it('fetches permissions for pva_admin role', async () => {
      setupMocks('pva_admin')
      render(<BucketGrid userId="admin-user" searchQuery="" />)

      await waitFor(() => {
        expect(getUserRole).toHaveBeenCalledWith('admin-user')
      })
    })

    it('fetches permissions for taxpayer role', async () => {
      setupMocks('taxpayer')
      render(<BucketGrid userId="taxpayer-user" searchQuery="" />)

      await waitFor(() => {
        expect(getUserRole).toHaveBeenCalledWith('taxpayer-user')
      })
    })
  })

  describe('Error Handling', () => {
    it('handles getUserRole error gracefully', async () => {
      vi.mocked(getUserRole).mockResolvedValue({ data: null, error: new Error('Role error') })
      vi.mocked(supabase.from).mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockBuckets, error: null }),
        eq: vi.fn().mockResolvedValue({ data: [], error: null })
      } as any))

      render(<BucketGrid userId="test-user" searchQuery="" />)

      await waitFor(() => {
        // Should still render buckets even with role error
        expect(screen.getByText('Real Property Records')).toBeInTheDocument()
      })
    })

    it('handles bucket fetch error gracefully', async () => {
      vi.mocked(getUserRole).mockResolvedValue({ data: 'pva_admin', error: null })
      vi.mocked(supabase.from).mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: new Error('Bucket error') }),
        eq: vi.fn().mockResolvedValue({ data: [], error: null })
      } as any))

      render(<BucketGrid userId="test-user" searchQuery="" />)

      await waitFor(() => {
        // Should complete loading even with error
        const skeletons = document.querySelectorAll('.animate-pulse')
        expect(skeletons.length).toBe(0)
      })
    })
  })
})
