export const HARDCODED_PRICES = [
  { currency: 'USDC', amount: 0.001 },
  { currency: 'FET', amount: 0.1 },
] as const

export const formatTokenAmount = (value: number) => {
  if (Number.isNaN(value)) return '0'
  if (Number.isInteger(value)) return value.toString()

  return value.toFixed(6).replace(/\.?0+$/, '')
}


