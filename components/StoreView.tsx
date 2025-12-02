import React from 'react';

const products = [
  { id: 1, name: "和田玉貔貅手链", price: 688.00, desc: "招财进宝，辟邪护身，选用上等和田玉。", image: "https://picsum.photos/300/300?random=1" },
  { id: 2, name: "纯铜八卦镜", price: 168.00, desc: "化煞挡灾，镇宅之宝，传统工艺制作。", image: "https://picsum.photos/300/300?random=2" },
  { id: 3, name: "水晶莲花摆件", price: 288.00, desc: "净化磁场，提升智慧，带来内心宁静。", image: "https://picsum.photos/300/300?random=3" },
  { id: 4, name: "六管铜风铃", price: 128.00, desc: "化解五黄二黑煞气，声音清脆悦耳。", image: "https://picsum.photos/300/300?random=4" },
  { id: 5, name: "真品五帝钱", price: 88.00, desc: "招财化煞，防小人，提升运势。", image: "https://picsum.photos/300/300?random=5" },
  { id: 6, name: "弥勒佛摆件", price: 398.00, desc: "笑口常开，和气生财，家庭和睦。", image: "https://picsum.photos/300/300?random=6" },
];

const StoreView: React.FC = () => {
  return (
    <div className="p-4 pb-24">
      <header className="text-center mb-6">
        <h2 className="text-3xl font-serif-sc font-bold text-amber-900">灵宝阁</h2>
        <p className="text-amber-600 text-sm mt-1">开光法物 助运臻品</p>
      </header>

      <div className="grid grid-cols-2 gap-4">
        {products.map(product => (
          <div key={product.id} className="bg-white rounded-xl shadow-sm overflow-hidden border border-amber-50 group hover:shadow-md transition-shadow">
            <div className="aspect-square bg-stone-100 relative overflow-hidden">
                <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="p-3">
              <h3 className="font-bold text-stone-800 text-sm truncate">{product.name}</h3>
              <p className="text-xs text-stone-500 mt-1 line-clamp-2 h-8">{product.desc}</p>
              <div className="flex items-center justify-between mt-3">
                <span className="text-amber-700 font-bold">¥{product.price}</span>
                <button className="bg-amber-100 text-amber-800 p-1.5 rounded-full hover:bg-amber-200">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StoreView;
