import React, { useState } from 'react';
import { ZodiacSign } from '../types';
import { generateHoroscopeForecast } from '../services/geminiService';

const signsMap: Record<string, string> = {
  "Aries": "白羊座",
  "Taurus": "金牛座",
  "Gemini": "双子座",
  "Cancer": "巨蟹座",
  "Leo": "狮子座",
  "Virgo": "处女座",
  "Libra": "天秤座",
  "Scorpio": "天蝎座",
  "Sagittarius": "射手座",
  "Capricorn": "摩羯座",
  "Aquarius": "水瓶座",
  "Pisces": "双鱼座"
};

const signs = Object.values(ZodiacSign);

const HoroscopeView: React.FC = () => {
  const [selectedSign, setSelectedSign] = useState<ZodiacSign>(ZodiacSign.Aries);
  const [forecast, setForecast] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchForecast = async () => {
    setLoading(true);
    try {
      const data = await generateHoroscopeForecast(signsMap[selectedSign], 'daily');
      setForecast(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-6 pb-24">
      <header className="text-center mb-6">
        <h2 className="text-3xl font-serif-sc font-bold text-purple-900">星座运势</h2>
        <p className="text-purple-400 text-sm mt-1">每日星象指引</p>
      </header>

      <div className="grid grid-cols-4 gap-3">
        {signs.map((sign) => (
          <button
            key={sign}
            onClick={() => { setSelectedSign(sign); setForecast(null); }}
            className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${selectedSign === sign ? 'bg-purple-900 text-white shadow-lg scale-105' : 'bg-white text-slate-500 hover:bg-purple-50'}`}
          >
            <div className="w-8 h-8 rounded-full bg-current opacity-20 mb-1 flex items-center justify-center text-xs font-bold">
               {sign[0]}
            </div>
            <span className="text-[10px] font-medium">{signsMap[sign]}</span>
          </button>
        ))}
      </div>

      {!forecast && !loading && (
        <div className="text-center py-10">
          <button 
            onClick={fetchForecast}
            className="px-8 py-3 bg-purple-600 text-white rounded-full font-medium shadow-lg hover:bg-purple-700 transition-colors"
          >
            查看{signsMap[selectedSign]}今日运势
          </button>
        </div>
      )}

      {loading && (
        <div className="p-8 text-center text-purple-600 animate-pulse">
          正在链接星象能量...
        </div>
      )}

      {forecast && (
        <div className="bg-gradient-to-br from-purple-900 to-indigo-900 text-white p-6 rounded-2xl shadow-xl animate-fade-in">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-2xl font-bold">{signsMap[selectedSign]}</h3>
              <p className="text-purple-200 text-sm">今日指引</p>
            </div>
            <div className="text-4xl opacity-20">✨</div>
          </div>
          
          <p className="leading-relaxed text-purple-50 mb-6 font-light">
            {forecast.forecast}
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm">
              <span className="block text-xs text-purple-300 uppercase mb-1">幸运色</span>
              <span className="font-medium">{forecast.luckyColor}</span>
            </div>
            <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm">
              <span className="block text-xs text-purple-300 uppercase mb-1">幸运数字</span>
              <span className="font-medium">{forecast.luckyNumber}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HoroscopeView;
