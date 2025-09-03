import { useState } from 'react'
import { CurrencyDollarIcon, ClockIcon, TrophyIcon } from '@heroicons/react/24/outline'

export function Lottery() {
  const [betAmount, setBetAmount] = useState('')
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([])

  const handleNumberSelect = (num: number) => {
    if (selectedNumbers.includes(num)) {
      setSelectedNumbers(selectedNumbers.filter(n => n !== num))
    } else if (selectedNumbers.length < 3) {
      setSelectedNumbers([...selectedNumbers, num])
    }
  }

  const handlePlaceBet = () => {
    // TODO: Implement contract interaction
    console.log('Placing bet:', { amount: betAmount, numbers: selectedNumbers })
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Daily Lottery</h1>
        
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <CurrencyDollarIcon className="w-8 h-8 text-blue-600 mr-2" />
              <div>
                <p className="text-sm text-gray-600">Current Prize</p>
                <p className="text-xl font-bold text-blue-600">0.5 ETH</p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <ClockIcon className="w-8 h-8 text-green-600 mr-2" />
              <div>
                <p className="text-sm text-gray-600">Time Left</p>
                <p className="text-xl font-bold text-green-600">12:34:56</p>
              </div>
            </div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center">
              <TrophyIcon className="w-8 h-8 text-purple-600 mr-2" />
              <div>
                <p className="text-sm text-gray-600">Total Players</p>
                <p className="text-xl font-bold text-purple-600">42</p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
          <h2 className="text-lg font-semibold mb-4">Select 3 Numbers (1-10)</h2>
          
          <div className="grid grid-cols-5 gap-2 mb-4">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
              <button
                key={num}
                onClick={() => handleNumberSelect(num)}
                className={`w-12 h-12 rounded-lg font-semibold transition-colors ${
                  selectedNumbers.includes(num)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {num}
              </button>
            ))}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bet Amount (ETH)
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0.01"
            />
          </div>

          <button
            onClick={handlePlaceBet}
            disabled={selectedNumbers.length !== 3 || !betAmount}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Place Bet
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Winners</h2>
        <div className="space-y-2">
          <div className="flex justify-between items-center py-2 border-b">
            <span className="font-mono text-sm">0x1234...5678</span>
            <span className="text-green-600">+0.25 ETH</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="font-mono text-sm">0xabcd...efgh</span>
            <span className="text-green-600">+0.15 ETH</span>
          </div>
        </div>
      </div>
    </div>
  )
}