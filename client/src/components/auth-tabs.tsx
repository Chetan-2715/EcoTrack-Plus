export function AuthTabs({ activeTab, onTabChange }: { activeTab: 'login' | 'register', onTabChange: (tab: 'login' | 'register') => void }) {
  return (
    <div className="relative flex justify-around p-1 bg-gray-100 dark:bg-gray-800 rounded-t-xl">
      <div
        className={`absolute top-1 left-1 w-1/2 h-[calc(100%-0.5rem)] bg-eco-primary rounded-lg transition-transform duration-300 ease-in-out ${
          activeTab === 'login' ? 'translate-x-[95%]' : ''
        }`}
      />
      <div onClick={() => onTabChange('register')} className="w-full text-center py-2 z-10 cursor-pointer">
        <span className={`relative z-20 ${activeTab === 'register' ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>Register</span>
      </div>
      <div onClick={() => onTabChange('login')} className="w-full text-center py-2 z-10 cursor-pointer">
        <span className={`relative z-20 ${activeTab === 'login' ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>Login</span>
      </div>
    </div>
  );
}