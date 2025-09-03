export function Home() {
  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        Welcome to Luck3 Lottery
      </h1>
      <p className="text-lg text-gray-600 mb-8">
        Participate in daily lottery draws and win amazing prizes!
      </p>
      
      <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-3xl font-bold text-blue-600 mb-2">100%</div>
          <p className="text-gray-600">Daily Draws</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-3xl font-bold text-green-600 mb-2">Fair</div>
          <p className="text-gray-600">Transparent System</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-3xl font-bold text-purple-600 mb-2">Secure</div>
          <p className="text-gray-600">Blockchain Based</p>
        </div>
      </div>
    </div>
  )
}