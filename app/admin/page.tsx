'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Product, Order } from '@/lib/supabase'
import { Plus, Trash2, Edit2, Save, X, Loader2, ShoppingBag, Upload, Package, User, Mail, Phone, MapPin, Wallet } from 'lucide-react'
// Logo will be loaded as regular img for external SVG
import Link from 'next/link'
import { HARDCODED_PRICES, formatTokenAmount } from '@/lib/pricing'

const SIZES = ['S', 'M', 'L', 'XL', 'XXL']

interface OrderWithProduct extends Order {
  products?: {
    name: string
    price: number
    image_url: string
  }
}

export default function AdminPanel() {
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<OrderWithProduct[]>([])
  const [loading, setLoading] = useState(false)
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [orderCount, setOrderCount] = useState<number>(0)
  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: 'Made from 100% organic ring-spun cotton, this unisex t-shirt is a total must-have. It\'s high-quality, super comfy, and best of all—eco-friendly.',
    price: HARDCODED_PRICES[0].amount.toString(),
    image_url: '/1.avif',
    stock: {
      S: 0,
      M: 0,
      L: 0,
      XL: 0,
      XXL: 0,
    },
  })

  useEffect(() => {
    fetchProducts()
    fetchOrderCount()
    if (activeTab === 'orders') {
      fetchOrders()
    }
  }, [activeTab])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/products?active=false')
      const data = await response.json()
      setProducts(data.products || [])
    } catch (error) {
      console.error('Failed to fetch products:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchOrders = async () => {
    setOrdersLoading(true)
    try {
      const response = await fetch('/api/orders')
      const data = await response.json()
      setOrders(data.orders || [])
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setOrdersLoading(false)
    }
  }

  const fetchOrderCount = async () => {
    try {
      const response = await fetch('/api/orders/count')
      const data = await response.json()
      setOrderCount(data.count || 0)
    } catch (error) {
      console.error('Failed to fetch order count:', error)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB')
      return
    }

    setUploadingImage(true)
    try {
      const formDataUpload = new FormData()
      formDataUpload.append('file', file)
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.error || 'Upload failed')
      }
      setFormData({ ...formData, image_url: data.url })
      setUploadingImage(false)
    } catch (error) {
      console.error('Failed to upload image:', error)
      alert('Failed to upload image. Please try again.')
      setUploadingImage(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = editingId ? `/api/products/${editingId}` : '/api/products'
      const method = editingId ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          price: HARDCODED_PRICES[0].amount,
          image_url: formData.image_url,
          stock: formData.stock,
        }),
      })

      if (response.ok) {
        await fetchProducts()
        resetForm()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save product')
      }
    } catch (error) {
      alert('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return

    try {
      const response = await fetch(`/api/products/${id}`, { method: 'DELETE' })
      if (response.ok) {
        await fetchProducts()
      } else {
        alert('Failed to delete product')
      }
    } catch (error) {
      alert('An error occurred. Please try again.')
    }
  }

  const handleEdit = (product: Product) => {
    setEditingId(product.id)
    setFormData({
      name: product.name,
      description: product.description,
      price: HARDCODED_PRICES[0].amount.toString(),
      image_url: product.image_url,
      stock: {
        S: product.stock.S ?? 0,
        M: product.stock.M ?? 0,
        L: product.stock.L ?? 0,
        XL: product.stock.XL ?? 0,
        XXL: product.stock.XXL ?? 0,
      },
    })
    setShowForm(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: 'Made from 100% organic ring-spun cotton, this unisex t-shirt is a total must-have. It\'s high-quality, super comfy, and best of all—eco-friendly.',
      price: HARDCODED_PRICES[0].amount.toString(),
      image_url: '/1.avif',
      stock: {
        S: 0,
        M: 0,
        L: 0,
        XL: 0,
        XXL: 0,
      },
    })
    setEditingId(null)
    setShowForm(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center py-4 gap-4">
            <div className="flex items-center gap-4">
              {/* <img
                src="https://innovationlab.fetch.ai/fetch.svg"
                alt="Fetch.ai Logo"
                className="w-36 h-36 sm:w-20 sm:h-20" 
              /> */}
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-[#000D3D]">
                  Fetch.ai Merchandise Admin
                </h1>
                <p className="text-sm text-gray-600">Manage your merch products</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto">
              <Link href="/" className="w-full sm:w-auto">
                <div className="bg-[#5F38FB] hover:bg-[#4d2dd9] text-white rounded-lg px-6 py-3 flex items-center justify-center gap-2 transition-colors cursor-pointer">
                  <span className="font-medium">View Store</span>
                </div>
              </Link>
              <div 
                onClick={() => setActiveTab('orders')}
                className="bg-[#5F38FB] hover:bg-[#4d2dd9] text-white rounded-lg px-6 py-3 flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <ShoppingBag className="h-5 w-5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium"> Total Orders {orderCount}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-6 py-3 font-medium text-sm transition-colors ${
              activeTab === 'products'
                ? 'text-[#5F38FB] border-b-2 border-[#5F38FB]'
                : 'text-gray-600 hover:text-[#000D3D]'
            }`}
          >
            <Package className="inline mr-2 h-4 w-4" />
            Products
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-6 py-3 font-medium text-sm transition-colors ${
              activeTab === 'orders'
                ? 'text-[#5F38FB] border-b-2 border-[#5F38FB]'
                : 'text-gray-600 hover:text-[#000D3D]'
            }`}
          >
            <ShoppingBag className="inline mr-2 h-4 w-4" />
            Orders ({orderCount})
          </button>
        </div>

        {/* Products Tab */}
        {activeTab === 'products' && (
          <>
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
              <h2 className="text-2xl font-bold text-[#000D3D]">Products</h2>
              <Button
                onClick={() => {
                  resetForm()
                  setShowForm(true)
                }}
                className="bg-[#5F38FB] hover:bg-[#4d2dd9] text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </div>

            {showForm && (
              <Card className="bg-white border border-gray-200 mb-8 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-[#000D3D]">
                    {editingId ? 'Edit Product' : 'Add New Product'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#000D3D] mb-2">
                        Product Name
                      </label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="bg-white border-gray-300 text-[#000D3D]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#000D3D] mb-2">
                        Description
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-[#000D3D]"
                        rows={3}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#000D3D] mb-2">
                        Price (fixed)
                      </label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {HARDCODED_PRICES.map(({ currency, amount }) => (
                          <span
                            key={currency}
                            className="inline-flex items-center rounded-full bg-[#5F38FB]/10 px-3 py-1 text-sm font-semibold text-[#000D3D]"
                          >
                            {formatTokenAmount(amount)} {currency}
                          </span>
                        ))}
                      </div>
                      <Input
                        type="number"
                        step="0.000001"
                        value={formData.price}
                        readOnly
                        className="bg-gray-50 border-gray-200 text-[#000D3D] cursor-not-allowed"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Pricing is currently fixed to {formatTokenAmount(HARDCODED_PRICES[0].amount)}{' '}
                        {HARDCODED_PRICES[0].currency}.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#000D3D] mb-2">
                        Product Image
                      </label>
                      <div className="space-y-3">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          id="image-upload"
                        />
                        <Button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full bg-[#5F38FB] hover:bg-[#4d2dd9] text-white"
                          disabled={uploadingImage}
                        >
                          {uploadingImage ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="mr-2 h-4 w-4" />
                              Upload Image
                            </>
                          )}
                        </Button>
                        {formData.image_url && (
                          <div className="relative w-full h-48 border border-gray-300 rounded-md overflow-hidden">
                            <img
                              src={formData.image_url}
                              alt="Preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#000D3D] mb-2">
                        Stock by Size
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        {SIZES.map((size) => (
                          <div key={size}>
                            <label className="block text-xs text-gray-600 mb-1">{size}</label>
                            <Input
                              type="number"
                              min="0"
                              value={formData.stock[size as keyof typeof formData.stock]}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  stock: {
                                    ...formData.stock,
                                    [size]: parseInt(e.target.value) || 0,
                                  },
                                })
                              }
                              className="bg-white border-gray-300 text-[#000D3D]"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        disabled={loading}
                        className="bg-[#5F38FB] hover:bg-[#4d2dd9] text-white"
                      >
                        {loading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="mr-2 h-4 w-4" />
                        )}
                        {editingId ? 'Update' : 'Create'} Product
                      </Button>
                      <Button
                        type="button"
                        onClick={resetForm}
                        className="bg-[#5F38FB] hover:bg-[#4d2dd9] text-white"
                      >
                        <X className="mr-2 h-4 w-4" />
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {loading && !products.length ? (
              <div className="text-center py-20">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#5F38FB]" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
                  <Card key={product.id} className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                    <div className="relative aspect-square">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover rounded-t-lg"
                      />
                      {!product.active && (
                        <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs">
                          Inactive
                        </div>
                      )}
                    </div>
                    <CardHeader className="flex-grow">
                      <CardTitle className="text-[#000D3D]">{product.name}</CardTitle>
                      <CardDescription className="text-gray-600 line-clamp-2">
                        {product.description}
                      </CardDescription>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {HARDCODED_PRICES.map(({ currency, amount }) => (
                          <span key={currency} className="text-xl font-semibold text-[#000D3D]">
                            {formatTokenAmount(amount)} {currency}
                          </span>
                        ))}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 mb-4">
                        <div className="text-sm font-medium text-[#000D3D]">Stock:</div>
                        <div className="flex gap-2 flex-wrap">
                          {SIZES.map((size) => (
                            <span
                              key={size}
                              className={`px-2 py-1 rounded text-xs ${
                                (product.stock as Record<string, number>)[size] > 0
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {size}: {(product.stock as Record<string, number>)[size]}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleEdit(product)}
                          size="sm"
                          className="flex-1 bg-[#5F38FB] hover:bg-[#4d2dd9] text-white"
                        >
                          <Edit2 className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          onClick={() => handleDelete(product.id)}
                          size="sm"
                          className="flex-1 bg-[#5F38FB] hover:bg-[#4d2dd9] text-white"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-[#000D3D] mb-2">Orders</h2>
              <p className="text-gray-600">View all customer orders and details</p>
            </div>

            {ordersLoading ? (
              <div className="text-center py-20">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#5F38FB]" />
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-20">
                <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-xl text-[#000D3D]">No orders yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <Card key={order.id} className="bg-white border border-gray-200 shadow-sm">
                    <CardHeader>
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <CardTitle className="text-[#000D3D]">
                              {order.products?.name || 'Product'}
                            </CardTitle>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              order.status === 'confirmed' 
                                ? 'bg-green-100 text-green-700'
                                : order.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {order.status}
                            </span>
                          </div>
                          <CardDescription className="text-gray-600">
                            Order ID: {order.id.substring(0, 8)}... | Size: {order.size} | Qty: {order.quantity}
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          <div className="flex flex-col items-end gap-1">
                            {HARDCODED_PRICES.map(({ currency, amount }) => (
                              <p key={currency} className="text-2xl font-bold text-[#000D3D] leading-tight">
                                {formatTokenAmount(amount * order.quantity)} {currency}
                              </p>
                            ))}
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <Wallet className="h-3 w-3" />
                              Payment: <span className={
                                order.payment_status === 'paid'
                                  ? 'text-green-600'
                                  : order.payment_status === 'pending'
                                  ? 'text-yellow-600'
                                  : 'text-red-600'
                              }>
                                {order.payment_status || 'pending'}
                              </span>
                            </p>
                            <p className="text-xs text-gray-500">
                              Reference: {order.payment_reference || '—'}
                            </p>
                          </div>
                          <p className="text-sm text-gray-600">
                            {new Date(order.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                        <div className="space-y-3">
                          <h3 className="font-semibold text-[#000D3D] flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Customer Details
                          </h3>
                          {order.user_name && (
                            <div className="text-sm">
                              <p className="text-gray-600">Name</p>
                              <p className="text-[#000D3D] font-medium">{order.user_name}</p>
                            </div>
                          )}
                          {order.user_email && (
                            <div className="text-sm flex items-center gap-2">
                              <Mail className="h-4 w-4 text-gray-400" />
                              <div>
                                <p className="text-gray-600">Email</p>
                                <p className="text-[#000D3D] font-medium">{order.user_email}</p>
                              </div>
                            </div>
                          )}
                          {order.user_phone && (
                            <div className="text-sm flex items-center gap-2">
                              <Phone className="h-4 w-4 text-gray-400" />
                              <div>
                                <p className="text-gray-600">Phone</p>
                                <p className="text-[#000D3D] font-medium">{order.user_phone}</p>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="space-y-3">
                          <h3 className="font-semibold text-[#000D3D] flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Shipping Address
                          </h3>
                          {order.shipping_address && (
                            <div className="text-sm">
                              <p className="text-gray-600">Address</p>
                              <p className="text-[#000D3D] font-medium">{order.shipping_address}</p>
                            </div>
                          )}
                          {order.tracking_number && (
                            <div className="text-sm">
                              <p className="text-gray-600">Tracking Number</p>
                              <p className="text-[#000D3D] font-medium font-mono">{order.tracking_number}</p>
                            </div>
                          )}
                          {order.awb_number && (
                            <div className="text-sm">
                              <p className="text-gray-600">Shiprocket AWB</p>
                              <p className="text-[#000D3D] font-medium font-mono">{order.awb_number}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
