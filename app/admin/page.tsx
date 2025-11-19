'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Product, Order } from '@/lib/supabase'
import { Plus, Trash2, Edit2, Save, X, Loader2, ShoppingBag, Upload, Package, User, Mail, Phone, MapPin, Wallet, Github, Tag } from 'lucide-react'
import Link from 'next/link'
import { HARDCODED_PRICES, formatTokenAmount } from '@/lib/pricing'
import { ThemeToggle } from '@/components/theme-toggle'

const SIZES = ['S', 'M', 'L', 'XL', 'XXL']
const PRODUCT_TYPES = ['t-shirt', 'hoodie', 'pen', 'cap', 'diary', 'bottle', 'funky-bag'] as const
const PRODUCTS_WITH_SIZES = ['t-shirt', 'hoodie', 'cap'] as const

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
  const [formData, setFormData] = useState<{
    name: string
    description: string
    price: string
    image_url: string
    product_type: typeof PRODUCT_TYPES[number] | ''
    stock: Record<string, number>
  }>({
    name: '',
    description: '',
    price: HARDCODED_PRICES[0].amount.toString(),
    image_url: '/1.avif',
    product_type: '',
    stock: {},
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
      
      const needsFixing = data.orders?.filter((o: OrderWithProduct) => 
        o.payment_status === 'paid' && o.status === 'pending'
      )
      if (needsFixing && needsFixing.length > 0) {
        fetch('/api/orders/fix-payment-status', { method: 'POST' }).catch(() => {})
      }
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

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

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

      if (!formData.product_type) {
        alert('Please select a product type')
        setLoading(false)
        return
      }

      const hasSizes = PRODUCTS_WITH_SIZES.includes(formData.product_type as any)
      const sizes = hasSizes ? SIZES : ['One Size']
      const stock = hasSizes ? formData.stock : formData.stock

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          price: HARDCODED_PRICES[0].amount,
          image_url: formData.image_url,
          product_type: formData.product_type,
          sizes,
          stock,
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
    const productType = product.product_type || 't-shirt'
    const hasSizes = PRODUCTS_WITH_SIZES.includes(productType as any)
    
    setFormData({
      name: product.name,
      description: product.description,
      price: HARDCODED_PRICES[0].amount.toString(),
      image_url: product.image_url,
      product_type: productType,
      stock: hasSizes
        ? {
            S: product.stock.S ?? 0,
            M: product.stock.M ?? 0,
            L: product.stock.L ?? 0,
            XL: product.stock.XL ?? 0,
            XXL: product.stock.XXL ?? 0,
          }
        : {
            'One Size': product.stock['One Size'] ?? Object.values(product.stock)[0] ?? 0,
          },
    })
    setShowForm(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: HARDCODED_PRICES[0].amount.toString(),
      image_url: '/1.avif',
      product_type: '',
      stock: {},
    })
    setEditingId(null)
    setShowForm(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center py-4 gap-4">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                  Fetch.ai Merchandise Admin
                </h1>
                <p className="text-sm text-muted-foreground">Manage your merch products</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto">
              <ThemeToggle />
              <Link href="/" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto">
                  <span className="font-medium">View Store</span>
                </Button>
              </Link>
              <Button 
                onClick={() => setActiveTab('orders')}
                variant="secondary"
                className="w-full sm:w-auto"
              >
                <ShoppingBag className="h-5 w-5 flex-shrink-0 mr-2" />
                <span className="font-medium">Total Orders {orderCount}</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-2 mb-6 border-b border-border">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-6 py-3 font-medium text-sm transition-colors relative ${
              activeTab === 'products'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Package className="inline mr-2 h-4 w-4" />
            Products
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-6 py-3 font-medium text-sm transition-colors relative ${
              activeTab === 'orders'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <ShoppingBag className="inline mr-2 h-4 w-4" />
            Orders ({orderCount})
          </button>
        </div>

        {activeTab === 'products' && (
          <>
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
              <h2 className="text-2xl font-bold text-foreground">Products</h2>
              <Button
                onClick={() => {
                  resetForm()
                  setShowForm(true)
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </div>

            {showForm && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>
                    {editingId ? 'Edit Product' : 'Add New Product'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Product Type <span className="text-destructive">*</span>
                      </label>
                      <select
                        value={formData.product_type}
                        onChange={(e) => {
                          const newType = e.target.value as typeof PRODUCT_TYPES[number]
                          const hasSizes = PRODUCTS_WITH_SIZES.includes(newType as any)
                          setFormData({
                            ...formData,
                            product_type: newType,
                            stock: hasSizes
                              ? { S: 0, M: 0, L: 0, XL: 0, XXL: 0 }
                              : { 'One Size': 0 },
                          })
                        }}
                        className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground focus:ring-2 focus:ring-ring focus:border-ring"
                        required
                      >
                        <option value="">-- Select Product Type --</option>
                        {PRODUCT_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type === 't-shirt' ? 'T-Shirt' : 
                             type === 'hoodie' ? 'Hoodie' :
                             type === 'pen' ? 'Pen' :
                             type === 'cap' ? 'Cap' :
                             type === 'diary' ? 'Diary' :
                             type === 'bottle' ? 'Bottle' :
                             type === 'funky-bag' ? 'Funky Bag' : type}
                          </option>
                        ))}
                      </select>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Choose: T-Shirt, Hoodie, Pen, Cap, Diary, Bottle, or Funky Bag
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Product Name
                      </label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Description
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground focus:ring-2 focus:ring-ring"
                        rows={3}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Price (fixed)
                      </label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {HARDCODED_PRICES.map(({ currency, amount }) => (
                          <span
                            key={currency}
                            className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-foreground"
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
                        className="bg-muted cursor-not-allowed"
                      />
                      <p className="mt-1 text-xs text-muted-foreground">
                        Pricing is currently fixed to {formatTokenAmount(HARDCODED_PRICES[0].amount)}{' '}
                        {HARDCODED_PRICES[0].currency}.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
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
                          className="w-full"
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
                          <div className="relative w-full h-48 border border-input rounded-md overflow-hidden">
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
                      <label className="block text-sm font-medium text-foreground mb-2">
                        {formData.product_type ? (
                          PRODUCTS_WITH_SIZES.includes(formData.product_type as any) ? 'Stock by Size' : 'Stock'
                        ) : 'Stock (Select product type first)'}
                      </label>
                      {formData.product_type && PRODUCTS_WITH_SIZES.includes(formData.product_type as any) ? (
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                          {SIZES.map((size) => (
                            <div key={size}>
                              <label className="block text-xs text-muted-foreground mb-1">{size}</label>
                              <Input
                                type="number"
                                min="0"
                                value={formData.stock[size as keyof typeof formData.stock] || 0}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    stock: {
                                      ...formData.stock,
                                      [size]: parseInt(e.target.value) || 0,
                                    },
                                  })
                                }
                              />
                            </div>
                          ))}
                        </div>
                      ) : formData.product_type ? (
                        <div>
                          <Input
                            type="number"
                            min="0"
                            value={formData.stock['One Size' as keyof typeof formData.stock] || 0}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                stock: {
                                  'One Size': parseInt(e.target.value) || 0,
                                },
                              })
                            }
                            placeholder="Enter stock quantity"
                          />
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground italic">
                          Please select a product type above to enter stock
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        disabled={loading}
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
                        variant="outline"
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
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
                  <Card key={product.id} className="shadow-sm hover:shadow-md transition-shadow flex flex-col">
                    <div className="relative aspect-square">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover rounded-t-lg"
                      />
                      {!product.active && (
                        <div className="absolute top-2 right-2 bg-destructive text-destructive-foreground px-2 py-1 rounded text-xs">
                          Inactive
                        </div>
                      )}
                    </div>
                    <CardHeader className="flex-grow">
                      <CardTitle>{product.name}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {product.description}
                      </CardDescription>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {HARDCODED_PRICES.map(({ currency, amount }) => (
                          <span key={currency} className="text-xl font-semibold text-foreground">
                            {formatTokenAmount(amount)} {currency}
                          </span>
                        ))}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 mb-4">
                        <div className="text-sm font-medium text-foreground">
                          Type: <span className="capitalize">{product.product_type || 't-shirt'}</span>
                        </div>
                        <div className="text-sm font-medium text-foreground">Stock:</div>
                        <div className="flex gap-2 flex-wrap">
                          {PRODUCTS_WITH_SIZES.includes((product.product_type || 't-shirt') as any) ? (
                            SIZES.map((size) => {
                              const stockValue = (product.stock as Record<string, number>)[size] || 0
                              return (
                                <span
                                  key={size}
                                  className={`px-2 py-1 rounded text-xs ${
                                    stockValue > 0
                                      ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                                      : 'bg-destructive/20 text-destructive'
                                  }`}
                                >
                                  {size}: {stockValue}
                                </span>
                              )
                            })
                          ) : (
                            <span
                              className={`px-2 py-1 rounded text-xs ${
                                (product.stock as Record<string, number>)['One Size'] > 0 ||
                                Object.values(product.stock)[0] > 0
                                  ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                                  : 'bg-destructive/20 text-destructive'
                              }`}
                            >
                              One Size: {(product.stock as Record<string, number>)['One Size'] || Object.values(product.stock)[0] || 0}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleEdit(product)}
                          size="sm"
                          variant="outline"
                          className="flex-1"
                        >
                          <Edit2 className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          onClick={() => handleDelete(product.id)}
                          size="sm"
                          variant="destructive"
                          className="flex-1"
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

        {activeTab === 'orders' && (
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">Orders</h2>
              <p className="text-muted-foreground">View all customer orders and details</p>
            </div>

            {ordersLoading ? (
              <div className="text-center py-20">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-20">
                <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-xl text-foreground">No orders yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <Card key={order.id} className="shadow-sm">
                    <CardHeader>
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <CardTitle>
                              {order.products?.name || 'Product'}
                            </CardTitle>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              order.status === 'confirmed' 
                                ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                                : order.status === 'pending'
                                ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400'
                                : 'bg-muted text-muted-foreground'
                            }`}>
                              {order.status}
                            </span>
                          </div>
                          <CardDescription>
                            Order ID: {order.id.substring(0, 8)}... | Size: {order.size} | Qty: {order.quantity}
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          <div className="flex flex-col items-end gap-1">
                            {order.github_verified && order.final_amount !== undefined && order.original_amount !== undefined ? (
                              <div className="text-right">
                                <div className="flex items-center gap-2 mb-1">
                                  <Github className="h-4 w-4 text-primary" />
                                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">
                                    GitHub Discount Applied
                                  </span>
                                </div>
                                <div className="space-y-0.5">
                                  <p className="text-sm text-muted-foreground line-through">
                                    {HARDCODED_PRICES.map(({ currency }) => (
                                      <span key={currency}>
                                        {formatTokenAmount(order.original_amount || 0)} {currency}
                                      </span>
                                    ))}
                                  </p>
                                  {HARDCODED_PRICES.map(({ currency }) => (
                                    <p key={currency} className="text-2xl font-bold text-primary leading-tight">
                                      {formatTokenAmount(order.final_amount || 0)} {currency}
                                    </p>
                                  ))}
                                  {order.discount_percentage !== null && order.discount_percentage !== undefined && order.discount_percentage > 0 && (
                                    <p className="text-xs text-green-600 dark:text-green-400 font-semibold">
                                      -{order.discount_percentage}% ({formatTokenAmount(order.discount_amount || 0)} off)
                                    </p>
                                  )}
                                </div>
                              </div>
                            ) : (
                              HARDCODED_PRICES.map(({ currency, amount }) => (
                                <p key={currency} className="text-2xl font-bold text-foreground leading-tight">
                                  {formatTokenAmount(amount * order.quantity)} {currency}
                                </p>
                              ))
                            )}
                            <div className="space-y-1">
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Wallet className="h-3 w-3" />
                                Payment: <span className={
                                  order.payment_status === 'paid'
                                    ? 'text-green-600 dark:text-green-400 font-semibold'
                                    : order.payment_status === 'pending'
                                    ? 'text-yellow-600 dark:text-yellow-400 font-semibold'
                                    : 'text-destructive font-semibold'
                                }>
                                  {order.payment_status || 'pending'}
                                </span>
                                {order.payment_currency && (
                                  <span className="ml-1 text-xs font-medium">({order.payment_currency})</span>
                                )}
                              </p>
                              {order.payment_reference && (
                                <div className="bg-muted/50 rounded px-2 py-1 border border-border">
                                  <p className="text-xs font-medium text-foreground mb-0.5">Transaction ID:</p>
                                  <p className="text-xs font-mono text-primary break-all">
                                    {order.payment_reference}
                                  </p>
                                </div>
                              )}
                              {!order.payment_reference && order.payment_status === 'paid' && (
                                <p className="text-xs text-yellow-600 dark:text-yellow-400 italic">
                                  ⚠️ Payment reference missing
                                </p>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {new Date(order.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border">
                        <div className="space-y-3">
                          <h3 className="font-semibold text-foreground flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Customer Details
                          </h3>
                          {order.user_name && (
                            <div className="text-sm">
                              <p className="text-muted-foreground">Name</p>
                              <p className="text-foreground font-medium">{order.user_name}</p>
                            </div>
                          )}
                          {order.user_email && (
                            <div className="text-sm flex items-center gap-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-muted-foreground">Email</p>
                                <p className="text-foreground font-medium">{order.user_email}</p>
                              </div>
                            </div>
                          )}
                          {order.user_phone && (
                            <div className="text-sm flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-muted-foreground">Phone</p>
                                <p className="text-foreground font-medium">{order.user_phone}</p>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="space-y-3">
                          <h3 className="font-semibold text-foreground flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Shipping Address
                          </h3>
                          {order.shipping_address && (
                            <div className="text-sm">
                              <p className="text-muted-foreground">Address</p>
                              <p className="text-foreground font-medium">{order.shipping_address}</p>
                            </div>
                          )}
                          {order.payment_reference && (
                            <div className="text-sm bg-primary/10 border border-primary/20 rounded p-2">
                              <p className="text-muted-foreground flex items-center gap-1 mb-1">
                                <Wallet className="h-3 w-3" />
                                Payment Transaction ID
                              </p>
                              <p className="text-foreground font-medium font-mono text-xs break-all">
                                {order.payment_reference}
                              </p>
                              {order.payment_currency && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Currency: <span className="font-semibold">{order.payment_currency}</span>
                                </p>
                              )}
                            </div>
                          )}
                          {order.github_verified && (
                            <div className="text-sm bg-green-500/10 border border-green-500/20 rounded p-2">
                              <div className="flex items-center gap-2 mb-2">
                                <Github className="h-4 w-4 text-green-600 dark:text-green-400" />
                                <p className="text-foreground font-semibold text-xs">
                                  GitHub Star Discount Applied
                                </p>
                              </div>
                              {order.github_username && (
                                <p className="text-xs text-muted-foreground mb-1">
                                  GitHub: <span className="font-mono font-semibold text-foreground">@{order.github_username}</span>
                                </p>
                              )}
                              {order.discount_percentage !== null && order.discount_percentage !== undefined && order.discount_percentage > 0 && (
                                <div className="space-y-0.5 text-xs">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Original:</span>
                                    <span className="text-foreground line-through">
                                      {HARDCODED_PRICES.map(({ currency }) => (
                                        <span key={currency}>
                                          {formatTokenAmount(order.original_amount || 0)} {currency}
                                        </span>
                                      ))}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Discount:</span>
                                    <span className="text-green-600 dark:text-green-400 font-semibold">
                                      -{order.discount_percentage}% ({formatTokenAmount(order.discount_amount || 0)})
                                    </span>
                                  </div>
                                  <div className="flex justify-between pt-1 border-t border-green-500/20">
                                    <span className="text-muted-foreground font-semibold">Final:</span>
                                    <span className="text-green-600 dark:text-green-400 font-bold">
                                      {HARDCODED_PRICES.map(({ currency }) => (
                                        <span key={currency}>
                                          {formatTokenAmount(order.final_amount || 0)} {currency}
                                        </span>
                                      ))}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          {order.tracking_number && (
                            <div className="text-sm">
                              <p className="text-muted-foreground">Tracking Number</p>
                              <p className="text-foreground font-medium font-mono">{order.tracking_number}</p>
                            </div>
                          )}
                          {order.awb_number && (
                            <div className="text-sm">
                              <p className="text-muted-foreground">Shiprocket AWB</p>
                              <p className="text-foreground font-medium font-mono">{order.awb_number}</p>
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
