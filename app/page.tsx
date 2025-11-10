'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Product } from '@/lib/supabase'
import { HARDCODED_PRICES, formatTokenAmount } from '@/lib/pricing'
import { ShoppingCart, Loader2, Package } from 'lucide-react'
import Link from 'next/link'
// Logo will be loaded as regular img for external SVG

const SIZES = ['S', 'M', 'L', 'XL', 'XXL']

export default function Home() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProducts, setSelectedProducts] = useState<Record<string, { size: string; quantity: number }>>({})
  const [ordering, setOrdering] = useState<string | null>(null)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products')
      const data = await response.json()
      setProducts(data.products || [])
    } catch (error) {
      console.error('Failed to fetch products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = (productId: string, size: string) => {
    setSelectedProducts((prev) => ({
      ...prev,
      [productId]: { size, quantity: 1 },
    }))
  }

  const handleOrder = async (productId: string) => {
    const selection = selectedProducts[productId]
    if (!selection) return

    setOrdering(productId)
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId,
          size: selection.size,
          quantity: selection.quantity,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        alert('Order placed successfully!')
        setSelectedProducts((prev) => {
          const newState = { ...prev }
          delete newState[productId]
          return newState
        })
        await fetchProducts()
      } else {
        alert(data.error || 'Failed to place order')
      }
    } catch (error) {
      alert('An error occurred. Please try again.')
    } finally {
      setOrdering(null)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center py-4 gap-4">
            <div className="flex items-center gap-3">
              {/* <img
                src="https://innovationlab.fetch.ai/fetch.svg"
                alt="Fetch.ai Logo"
                className="w-16 h-16 sm:w-20 sm:h-20"
              /> */}
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-[#000D3D]">
                  Fetch.ai T-Shirt Store
                </h1>
                <p className="text-sm text-gray-600 hidden sm:block">
                  Premium Organic Cotton T-Shirts
                </p>
              </div>
            </div>
            <Link href="/admin">
              <Button className="bg-[#5F38FB] hover:bg-[#4d2dd9] text-white">
                <Package className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Admin Panel</span>
                <span className="sm:hidden">Admin</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-20">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-[#5F38FB]" />
            <p className="text-[#000D3D]">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-xl text-[#000D3D] mb-4">No products available</p>
            <Link href="/admin">
              <Button className="bg-[#5F38FB] hover:bg-[#4d2dd9] text-white">
                Add Products
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => {
              const selection = selectedProducts[product.id]
              const availableSizes = SIZES.filter(
                (size) => (product.stock as Record<string, number>)[size] > 0
              )

              return (
                <Card key={product.id} className="bg-white border border-gray-200 hover:shadow-lg transition-shadow flex flex-col">
                  <div className="relative overflow-hidden aspect-square">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardHeader className="flex-grow">
                    <CardTitle className="text-[#000D3D] text-lg sm:text-xl">{product.name}</CardTitle>
                    <CardDescription className="text-gray-600 mt-2 text-sm line-clamp-2">
                      {product.description}
                    </CardDescription>
                    <div className="flex flex-wrap items-baseline gap-3 mt-4">
                      {HARDCODED_PRICES.map(({ currency, amount }, index) => (
                        <span
                          key={currency}
                          className={`font-bold text-[#000D3D] ${
                            index === 0 ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'
                          }`}
                        >
                          {formatTokenAmount(amount)} {currency}
                        </span>
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="text-sm font-medium text-[#000D3D] mb-2">
                        Available Sizes:
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {availableSizes.length > 0 ? (
                          availableSizes.map((size) => {
                            const stock = (product.stock as Record<string, number>)[size]
                            return (
                              <button
                                key={size}
                                onClick={() => handleAddToCart(product.id, size)}
                                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg font-medium transition-all text-sm ${
                                  selection?.size === size
                                    ? 'bg-[#5F38FB] text-white ring-2 ring-[#5F38FB]'
                                    : 'bg-gray-100 text-[#000D3D] hover:bg-gray-200'
                                }`}
                              >
                                {size}
                                <span className="text-xs ml-1 opacity-75">
                                  ({stock})
                                </span>
                              </button>
                            )
                          })
                        ) : (
                          <span className="text-red-500 text-sm">Out of stock</span>
                        )}
                      </div>
                    </div>

                    {selection && (
                      <div className="bg-[#5F38FB]/10 border border-[#5F38FB]/30 rounded-lg p-4">
                        <div className="text-sm text-[#000D3D] mb-2">
                          Selected: <span className="font-bold">{selection.size}</span>
                        </div>
                        <Button
                          onClick={() => handleOrder(product.id)}
                          disabled={ordering === product.id}
                          className="w-full bg-[#5F38FB] hover:bg-[#4d2dd9] text-white"
                        >
                          {ordering === product.id ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Placing Order...
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="mr-2 h-4 w-4" />
                              Buy Now
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <img
              src="https://innovationlab.fetch.ai/fetch.svg"
              alt="Fetch.ai"
              className="w-6 h-6"
            />
            <p className="text-gray-600 text-sm">Powered by Fetch.ai | Made with ❤️</p>
          </div>
        </footer>
      </main>
    </div>
  )
}
