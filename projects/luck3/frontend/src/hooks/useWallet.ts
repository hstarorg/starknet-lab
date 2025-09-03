import { useState, useEffect } from 'react'
import { connect, disconnect } from 'starknetkit'

interface WalletState {
  wallet: any
  account: any
  address: string
  isConnected: boolean
  isConnecting: boolean
}

export function useWallet() {
  const [walletState, setWalletState] = useState<WalletState>({
    wallet: null,
    account: null,
    address: '',
    isConnected: false,
    isConnecting: false
  })

  const connectWallet = async () => {
    setWalletState(prev => ({ ...prev, isConnecting: true }))
    
    try {
      const wallet = await connect({
        modalMode: 'alwaysAsk',
        modalTheme: 'dark'
      })

      if (wallet && wallet.isConnected) {
        setWalletState({
          wallet,
          account: wallet.account,
          address: wallet.selectedAddress,
          isConnected: true,
          isConnecting: false
        })
      } else {
        setWalletState(prev => ({ ...prev, isConnecting: false }))
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error)
      setWalletState(prev => ({ ...prev, isConnecting: false }))
    }
  }

  const disconnectWallet = async () => {
    try {
      await disconnect()
      setWalletState({
        wallet: null,
        account: null,
        address: '',
        isConnected: false,
        isConnecting: false
      })
    } catch (error) {
      console.error('Failed to disconnect wallet:', error)
    }
  }

  useEffect(() => {
    // Check if wallet is already connected
    const checkConnection = async () => {
      try {
        const wallet = await connect({
          modalMode: 'neverAsk'
        })
        
        if (wallet && wallet.isConnected) {
          setWalletState({
            wallet,
            account: wallet.account,
            address: wallet.selectedAddress,
            isConnected: true,
            isConnecting: false
          })
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error)
      }
    }

    checkConnection()
  }, [])

  return {
    ...walletState,
    connectWallet,
    disconnectWallet
  }
}