'use client'

import { useState, useEffect } from 'react'
import Footer from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { AdminUserDto } from '@/lib/adminUsers'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserDto[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<AdminUserDto | null>(null)

  const fetchUsers = async () => {
    const res = await fetch('/api/admin/users')
    setUsers(res.ok ? await res.json() : [])
    setLoading(false)
  }

  useEffect(() => { fetchUsers() }, [])

  const filtered = users.filter((u) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return u.username?.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.phoneNumber ?? '').includes(search)
  })

  const handleRoleChange = async (id: string, role: string) => {
    const res = await fetch(`/api/admin/users/${id}/role`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role }) })
    if (res.ok) { const updated = await res.json(); setUsers((prev) => prev.map((u) => (u.id === id ? updated : u))) }
  }

  const handleEnabledChange = async (id: string, enabled: boolean) => {
    const res = await fetch(`/api/admin/users/${id}/enable`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled }) })
    if (res.ok) { const updated = await res.json(); setUsers((prev) => prev.map((u) => (u.id === id ? updated : u))) }
  }

  if (loading) return <div className="py-24 text-center text-zinc-500">Loading...</div>

  return (
    <>
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-zinc-900 mb-8">User Management</h1>
          <Input placeholder="Search by username or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm mb-6" />

          <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
            <Table>
              <TableHeader><TableRow><TableHead>Username</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead><TableHead>Role</TableHead><TableHead>Enabled</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {filtered.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.phoneNumber || '-'}</TableCell>
                    <TableCell>
                      <select value={user.role} onChange={(e) => handleRoleChange(user.id, e.target.value)} className="h-9 px-3 border border-zinc-200 rounded-lg text-sm">
                        <option value="ADMIN">ADMIN</option><option value="CLIENT">CLIENT</option>
                      </select>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.enabled ? 'default' : 'destructive'}>{user.enabled ? 'Yes' : 'No'}</Badge>
                      <Button variant="ghost" size="sm" className="ml-2" onClick={() => handleEnabledChange(user.id, !user.enabled)}>{user.enabled ? 'Disable' : 'Enable'}</Button>
                    </TableCell>
                    <TableCell><Button variant="outline" size="sm" onClick={() => setSelectedUser(user)}>View</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>User Details</DialogTitle></DialogHeader>
          {selectedUser && (
            <div className="space-y-2">
              <p><strong>Username:</strong> {selectedUser.username}</p>
              <p><strong>Email:</strong> {selectedUser.email}</p>
              <p><strong>Phone:</strong> {selectedUser.phoneNumber || '-'}</p>
              <p><strong>Role:</strong> {selectedUser.role}</p>
              <p><strong>Enabled:</strong> {selectedUser.enabled ? 'Yes' : 'No'}</p>
              <p><strong>Created:</strong> {new Date(selectedUser.createdAt).toLocaleString()}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </>
  )
}
