import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const FINANCIAL_YEARS = [
  { label: '2026-27', start: '2026-04-01', end: '2027-03-31', value: '2026-27' },
  { label: '2025-26', start: '2025-04-01', end: '2026-03-31', value: '2025-26' },
  { label: '2024-25', start: '2024-04-01', end: '2025-03-31', value: '2024-25' },
  { label: '2023-24', start: '2023-04-01', end: '2024-03-31', value: '2023-24' },
  { label: '2022-23', start: '2022-04-01', end: '2023-03-31', value: '2022-23' },
]

// Get current financial year based on today's date
const getCurrentFinancialYear = () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth() + 1 // 1-12
  
  // If month is Apr-Mar (4-12), FY is current-next
  // If month is Jan-Mar (1-3), FY is previous-current
  if (month >= 4) {
    const nextYear = String(year + 1).slice(-2)
    return `${year}-${nextYear}`
  } else {
    const currentYear = String(year).slice(-2)
    return `${year - 1}-${currentYear}`
  }
}

export const useFinancialYearStore = create(
  persist(
    (set) => ({
      financialYear: getCurrentFinancialYear(),
      financialYears: FINANCIAL_YEARS,
      
      setFinancialYear: (year) => set({ financialYear: year }),
      
      getFinancialYearDates: (year) => {
        const fy = FINANCIAL_YEARS.find(f => f.value === year)
        return fy ? { start: fy.start, end: fy.end } : null
      },
      
      getCurrentFYDates: () => {
        const currentFY = useFinancialYearStore.getState().financialYear
        const fy = FINANCIAL_YEARS.find(f => f.value === currentFY)
        return fy ? { start: fy.start, end: fy.end } : null
      }
    }),
    {
      name: 'financial-year-storage',
    }
  )
)

// Helper function to get FY dates
export const getFinancialYearDates = (year) => {
  const fy = FINANCIAL_YEARS.find(f => f.value === year)
  return fy ? { start: fy.start, end: fy.end } : null
}

// Helper to get all FYs
export const getAllFinancialYears = () => FINANCIAL_YEARS

// Helper to get current FY
export const getCurrentFY = () => getCurrentFinancialYear()
