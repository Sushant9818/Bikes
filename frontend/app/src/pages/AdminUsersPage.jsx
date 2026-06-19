import { useEffect, useState } from 'react'
import { getUsers, updateUserRole, updateUserEnabled } from '@/api/adminUsers'
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

export default function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterEnabled, setFilterEnabled] = useState('all') // all | enabled | disabled
  const [selectedUser, setSelectedUser] = useState(null)

  useEffect(() => {
    getUsers()
      .then(setUsers)
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = users.filter((u) => {
    const matchSearch = !search.trim() ||
      u.username?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.phoneNumber?.includes(search)
    const matchEnabled =
      filterEnabled === 'all' ||
      (filterEnabled === 'enabled' && u.enabled) ||
      (filterEnabled === 'disabled' && !u.enabled)
    return matchSearch && matchEnabled
  })

  const handleRoleChange = async (userId, role) => {
    try {
      const updated = await updateUserRole(userId, role)
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)))
      if (selectedUser?.id === userId) setSelectedUser(updated)
      toast.success('Role updated')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed')
    }
  }

  const handleEnabledChange = async (userId, enabled) => {
    try {
      const updated = await updateUserEnabled(userId, enabled)
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)))
      if (selectedUser?.id === userId) setSelectedUser(updated)
      toast.success(enabled ? 'User enabled' : 'User disabled')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed')
    }
  }

  if (loading) {
    return (
      <>
        <div className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <Skeleton className="h-8 w-48 mb-8" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-zinc-900 mb-8">User Management</h1>

          <div className="flex flex-wrap gap-4 mb-6">
            <Input
              placeholder="Search by username or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
            <select
              value={filterEnabled}
              onChange={(e) => setFilterEnabled(e.target.value)}
              className="h-10 px-4 border border-zinc-200 rounded-xl text-sm"
            >
              <option value="all">All</option>
              <option value="enabled">Enabled</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>

          <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Enabled</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.phoneNumber || '-'}</TableCell>
                    <TableCell>
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        className="h-9 px-3 border border-zinc-200 rounded-lg text-sm"
                      >
                        <option value="ADMIN">ADMIN</option>
                        <option value="CLIENT">CLIENT</option>
                      </select>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.enabled ? 'default' : 'destructive'}>
                        {user.enabled ? 'Yes' : 'No'}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-2"
                        onClick={() => handleEnabledChange(user.id, !user.enabled)}
                      >
                        {user.enabled ? 'Disable' : 'Enable'}
                      </Button>
                    </TableCell>
                    <TableCell className="text-zinc-500 text-sm">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => setSelectedUser(user)}>
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filtered.length === 0 && (
            <p className="text-zinc-500 text-center py-8">No users found.</p>
          )}
        </div>
      </div>

      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-2">
              <p><strong>ID:</strong> {selectedUser.id}</p>
              <p><strong>Username:</strong> {selectedUser.username}</p>
              <p><strong>Email:</strong> {selectedUser.email}</p>
              <p><strong>Phone:</strong> {selectedUser.phoneNumber || '-'}</p>
              <p><strong>Role:</strong> {selectedUser.role}</p>
              <p><strong>Enabled:</strong> {selectedUser.enabled ? 'Yes' : 'No'}</p>
              <p><strong>Verified:</strong> {selectedUser.emailVerifiedAt ? 'Yes' : 'No'}</p>
              <p><strong>Created:</strong> {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleString() : '-'}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </>
  )
}
