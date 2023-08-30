import {
  getUnitAmount,
  formatNumber,
} from '@/libs/utils'
import {
  getLocalChains,
} from '@/libs/local'

jest.mock('@/libs/local')

describe('formatNumber', () => {
  it('formats correctly', () => {
    expect(formatNumber(0)).toBe(0)
    expect(formatNumber(0, true, 3)).toBe(0)
    expect(formatNumber(12.345, true)).toBe(12.35)
    expect(formatNumber(9876.5432, true, 3)).toBe('9.877K')
  })
})

describe('getUnitAmount', () => {
  it('converts correctly', () => {
    getLocalChains.mockReturnValue({
      chainName: { assets: [{ base: 'cony', exponent: 6 }] },
      anotherChainName: { assets: [{ base: 'foo', exponent: 5 }] },
    })

    expect(getUnitAmount('10', 'cony')).toBe('10000000')
    expect(getUnitAmount('12,345,678.9', 'cony')).toBe('12345678900000')
    expect(getUnitAmount('12,345,678.9', 'foo')).toBe('1234567890000')
    expect(getUnitAmount('12,345,678.9', 'bar')).toBe('12345678900000')
  })
})
