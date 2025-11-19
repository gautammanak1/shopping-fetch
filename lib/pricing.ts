export const HARDCODED_PRICES = [
  { currency: 'FET', amount: 0.1000 },
  { currency: 'USDC', amount: 0.01 },
] as const

export const formatTokenAmount = (value: number) => {
  if (Number.isNaN(value)) return '0'
  if (Number.isInteger(value)) return value.toString()

  return value.toFixed(6).replace(/\.?0+$/, '')
}

export const getPriceByCurrency = (currency: string): number => {
  const price = HARDCODED_PRICES.find(p => p.currency === currency)
  return price?.amount || 0
}


