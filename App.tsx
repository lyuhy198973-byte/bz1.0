
import React, { useState } from 'react';
import Navigation from './components/Navigation';
import BaZiView from './components/BaZiView';
import FlyingStarsView from './components/FlyingStarsView';
import HoroscopeView from './components/HoroscopeView';
import StoreView from './components/StoreView';
import { Tab } from './types';

const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<Tab>(Tab.BAZI);

  const renderContent = () => {
    switch (currentTab) {
      case Tab.BAZI:
        return <BaZiView />;
      case Tab.STARS:
        return <FlyingStarsView />;
      case Tab.HOROSCOPE:
        return <HoroscopeView />;
      case Tab.STORE:
        return <StoreView />;
      default:
        return <BaZiView />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F7F2] font-sans text-stone-800 antialiased mx-auto max-w-lg shadow-2xl relative">
      {/* Status Bar Spacer for PWA feel */}
      <div className="h-safe-top bg-transparent"></div>
      
      <main className="min-h-screen relative">
         {renderContent()}
      </main>

      <Navigation currentTab={currentTab} onTabChange={setCurrentTab} />
    </div>
  );
};

export default App;
