'use client';

import { useEffect, useState } from 'react';
import { Package, AlertCircle, TrendingDown, Loader } from 'lucide-react';
import Link from 'next/link';

interface PartStock {
  id: number;
  partName: string;
  sku: string;
  quantity: number;
  minStock: number;
  price: number;
  status: string;
}

export default function InventoryPage() {
  const [parts, setParts] = useState<PartStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [newQuantity, setNewQuantity] = useState<{ [key: number]: string }>({});

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const response = await fetch('/api/admin/inventory');
      if (!response.ok) throw new Error('Failed to fetch inventory');
      const data = await response.json();
      setParts(data.parts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (partId: number) => {
    const qty = newQuantity[partId];
    if (!qty || isNaN(parseInt(qty))) {
      alert('Please enter a valid quantity');
      return;
    }

    setUpdatingId(partId);
    try {
      const response = await fetch('/api/admin/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partId, quantity: parseInt(qty) }),
      });

      if (!response.ok) throw new Error('Failed to update quantity');
      await fetchInventory();
      setNewQuantity({ ...newQuantity, [partId]: '' });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setUpdatingId(null);
    }
  };

  const lowStockParts = parts.filter((p) => p.quantity <= p.minStock);
  const outOfStockParts = parts.filter((p) => p.quantity === 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader className="h-12 w-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Inventory Management</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Track and manage part stock levels</p>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Total Parts</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{parts.length}</p>
            </div>
            <Package className="h-10 w-10 text-blue-600 dark:text-blue-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Low Stock</p>
              <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-2">{lowStockParts.length}</p>
            </div>
            <TrendingDown className="h-10 w-10 text-yellow-600 dark:text-yellow-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Out of Stock</p>
              <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-2">{outOfStockParts.length}</p>
            </div>
            <AlertCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Part Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">SKU</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Current Stock</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Min Stock</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Price</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Update Quantity</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {parts.map((part) => {
                const isLow = part.quantity <= part.minStock;
                const isOutOfStock = part.quantity === 0;

                return (
                  <tr key={part.id} className={isOutOfStock ? 'bg-red-50 dark:bg-red-900/10' : isLow ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''}>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-medium">{part.partName}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{part.sku}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        isOutOfStock
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                          : isLow
                          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                          : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      }`}>
                        {part.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{part.minStock}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-medium">₹{part.price.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={newQuantity[part.id] || ''}
                          onChange={(e) => setNewQuantity({ ...newQuantity, [part.id]: e.target.value })}
                          placeholder="New qty"
                          className="w-24 px-2 py-1 border border-gray-300 dark:border-gray-700 rounded dark:bg-gray-800 dark:text-white text-sm"
                        />
                        <button
                          onClick={() => handleUpdateQuantity(part.id)}
                          disabled={updatingId === part.id}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                          {updatingId === part.id ? '...' : 'Update'}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/parts/${part.id}`}
                        className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
