export const HARDCODED_PRICES = [
  { currency: 'USD', amount: 0.01 },
] as const

export const formatTokenAmount = (value: number) => {
  if (Number.isNaN(value)) return '0'
  if (Number.isInteger(value)) return value.toString()

  return value.toFixed(6).replace(/\.?0+$/, '')
}


