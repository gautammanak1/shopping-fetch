'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Product } from '@/lib/supabase'
import { HARDCODED_PRICES, formatTokenAmount } from '@/lib/pricing'
import { ShoppingCart, Loader2, Package } from 'lucide-react'
import Link from 'next/link'
import { ThemeToggle } from '@/components/theme-toggle'

const SIZES = ['S', 'M', 'L', 'XL', 'XXL']
const PRODUCTS_WITH_SIZES = ['t-shirt', 'hoodie', 'cap'] as const

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
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center py-4 gap-4">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                  Fetch.ai Merchandise
                </h1>
                <p className="text-sm text-muted-foreground hidden sm:block">
                  Official Fetch.ai Merchandise
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link href="/admin">
                <Button variant="default">
                  <Package className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Admin Panel</span>
                  <span className="sm:hidden">Admin</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-20">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-foreground">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-xl text-foreground mb-4">No products available</p>
            <Link href="/admin">
              <Button>
                Add Products
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => {
              const selection = selectedProducts[product.id]
              const productType = product.product_type || 't-shirt'
              const hasSizes = PRODUCTS_WITH_SIZES.includes(productType as any)
              
              const availableSizes = hasSizes
                ? SIZES.filter((size) => (product.stock as Record<string, number>)[size] > 0)
                : (product.stock as Record<string, number>)['One Size'] > 0 || Object.values(product.stock)[0] > 0
                  ? ['One Size']
                  : []

              const isOutOfStock = availableSizes.length === 0

              return (
                <Card key={product.id} className={`transition-all flex flex-col relative group ${
                  isOutOfStock 
                    ? 'border-destructive/50 opacity-75' 
                    : 'border-border hover:shadow-lg hover:border-primary/50'
                }`}>
                  {isOutOfStock && (
                    <div className="absolute top-3 right-3 z-10 bg-destructive text-destructive-foreground px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                      OUT OF STOCK
                    </div>
                  )}
                  <div className="relative overflow-hidden aspect-square rounded-t-lg">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className={`w-full h-full object-cover transition-all ${
                        isOutOfStock ? 'grayscale opacity-50' : 'group-hover:scale-105'
                      }`}
                    />
                  </div>
                  <CardHeader className="flex-grow">
                    <CardTitle className="text-lg sm:text-xl">{product.name}</CardTitle>
                    <CardDescription className="mt-2 text-sm line-clamp-2">
                      {product.description}
                    </CardDescription>
                    <div className="flex flex-wrap items-baseline gap-3 mt-4">
                      {HARDCODED_PRICES.map(({ currency, amount }, index) => (
                        <span
                          key={currency}
                          className={`font-bold text-foreground ${
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
                      <div className="text-sm font-medium text-foreground mb-2">
                        {hasSizes ? 'Available Sizes:' : 'Availability:'}
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {availableSizes.length > 0 ? (
                          availableSizes.map((size) => {
                            const stock = hasSizes
                              ? (product.stock as Record<string, number>)[size]
                              : (product.stock as Record<string, number>)['One Size'] || Object.values(product.stock)[0] || 0
                            return (
                              <button
                                key={size}
                                onClick={() => handleAddToCart(product.id, size)}
                                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-md font-medium transition-all text-sm ${
                                  selection?.size === size
                                    ? 'bg-primary text-primary-foreground ring-2 ring-ring'
                                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
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
                          <div className="w-full bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                            <span className="text-destructive text-sm font-semibold flex items-center gap-2">
                              <span className="w-2 h-2 bg-destructive rounded-full animate-pulse"></span>
                              Out of Stock
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {selection && !isOutOfStock && (
                      <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
                        <div className="text-sm text-foreground mb-2">
                          Selected: <span className="font-bold">{selection.size}</span>
                        </div>
                        <Button
                          onClick={() => handleOrder(product.id)}
                          disabled={ordering === product.id}
                          className="w-full"
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

        <footer className="mt-16 border-t border-border pt-8 pb-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <p className="text-muted-foreground text-sm">Powered by Fetch.ai | Made with ❤️</p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}
