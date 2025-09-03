'use client'

import { createContext, useContext } from 'react'

const ServiceTableContext = createContext<boolean>(false)

export const useServiceTable = () => useContext(ServiceTableContext)

export const ServiceTableProvider = ({
  value,
  children,
}: {
  value: boolean
  children: React.ReactNode
}) => (
  <ServiceTableContext.Provider value={value}>
    {children}
  </ServiceTableContext.Provider>
)

export function useTableService() {
    return useContext(ServiceTableContext);
}