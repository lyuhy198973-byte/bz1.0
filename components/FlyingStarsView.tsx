
import React, { useState, useEffect, useRef } from 'react';
import { generateFlyingStarAnalysis, analyzeFloorPlan } from '../services/geminiService';
import { FlyingStarData } from '../types';

const STAR_DETAILS: Record<number, { name: string; type: string; desc: string; color: string; bg: string }> = {
  1: { 
    name: '一白贪狼星', 
    type: '桃花/人缘', 
    desc: '在家居风水中指代与水有关的物品，主人事、缘桃花，所有人与人之间的缘份，贵人等。', 
    color: 'text-blue-600',
    bg: 'bg-blue-50'
  },
  2: { 
    name: '二黑巨门星', 
    type: '疾病/晦气', 
    desc: '主宰小疾病、身体不适等。需注意身心健康，宜静不宜动。', 
    color: 'text-stone-600',
    bg: 'bg-stone-100'
  },
  3: { 
    name: '三碧禄存星', 
    type: '是非/争吵', 
    desc: '与破败的木制品、干枯的植物有关，主事是非口舌、小人、争吵、官讼、盗窃破财等。', 
    color: 'text-green-600',
    bg: 'bg-green-50'
  },
  4: { 
    name: '四绿文曲星', 
    type: '文昌/学业', 
    desc: '在家居风水中和图书、旺盛的植物有关，主宰读书、考试、文职等工作。', 
    color: 'text-emerald-600',
    bg: 'bg-emerald-50'
  },
  5: { 
    name: '五黄廉贞星', 
    type: '灾祸/重病', 
    desc: '代表潮湿阴寒的物品或地方，主事一切大灾祸，严重的疾病。需特别小心化解。', 
    color: 'text-amber-700',
    bg: 'bg-amber-100'
  },
  6: { 
    name: '六白武曲星', 
    type: '偏财/权力', 
    desc: '在家居风水中和金属、电器有关，主宰权力、偏财运等。', 
    color: 'text-gray-600',
    bg: 'bg-gray-100'
  },
  7: { 
    name: '七赤破军星', 
    type: '升官/变动', 
    desc: '在家居风水中和金属刀具有关，主宰升职、运气提升，但也伴随变动与竞争。', 
    color: 'text-red-600',
    bg: 'bg-red-50'
  },
  8: { 
    name: '八白左辅星', 
    type: '正财/大财', 
    desc: '在家居风水中和陶瓷制品有关，主宰一切钱财、正财运等。为当旺财星。', 
    color: 'text-orange-600',
    bg: 'bg-orange-50'
  },
  9: { 
    name: '九紫右弼星', 
    type: '喜庆/姻缘', 
    desc: '在家居风水中和炉灶、厨房有关，主宰喜庆吉事，如搬家、开市、添丁、结婚等喜庆事。', 
    color: 'text-purple-600',
    bg: 'bg-purple-50'
  },
};

// Grid Order: South Top, East Left (Lo Shu representation)
// Row 1: SE, S, SW
// Row 2: E, Center, W
// Row 3: NE, N, NW
const GRID_KEYS = [
  { key: 'southeast', label: '东南', abbr: 'SE' },
  { key: 'south', label: '正南', abbr: 'S' },
  { key: 'southwest', label: '西南', abbr: 'SW' },
  { key: 'east', label: '正东', abbr: 'E' },
  { key: 'center', label: '中宫', abbr: 'C' },
  { key: 'west', label: '正西', abbr: 'W' },
  { key: 'northeast', label: '东北', abbr: 'NE' },
  { key: 'north', label: '正北', abbr: 'N' },
  { key: 'northwest', label: '西北', abbr: 'NW' },
];

const FlyingStarsView: React.FC = () => {
  const [year, setYear] = useState(new Date().getFullYear());
  const [data, setData] = useState<FlyingStarData | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{key: string, star: number, label: string} | null>(null);
  const [floorPlanImage, setFloorPlanImage] = useState<string | null>(null);
  const [cropStyle, setCropStyle] = useState<React.CSSProperties>({});
  const [containerAspect, setContainerAspect] = useState<number>(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData(year);
  }, []);

  const loadData = async (y: number) => {
    setLoading(true);
    setSelectedCell(null);
    try {
      const result = await generateFlyingStarAnalysis(y);
      setData(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const incrementYear = () => {
    const newYear = year + 1;
    setYear(newYear);
    loadData(newYear);
  };

  const decrementYear = () => {
    const newYear = year - 1;
    setYear(newYear);
    loadData(newYear);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        setFloorPlanImage(base64);
        setCropStyle({}); // Reset crop
        setContainerAspect(1);
        
        // Analyze geometric bounds
        setAnalyzingImage(true);
        try {
            // Get original image dimensions first for aspect ratio calc
            const img = new Image();
            img.src = base64;
            await new Promise((resolve) => { img.onload = resolve; });
            const naturalW = img.naturalWidth;
            const naturalH = img.naturalHeight;

            const bounds = await analyzeFloorPlan(base64.split(',')[1]);
            const { ymin, xmin, ymax, xmax } = bounds;
            
            // Calculate Crop Logic:
            // We want the area (xmin, ymin) to (xmax, ymax) to FILL the container.
            // Width % of crop = (xmax - xmin)
            // Height % of crop = (ymax - ymin)
            // Scale needed = 100 / cropWidth%
            
            const wPct = (xmax - xmin);
            const hPct = (ymax - ymin);
            
            // Calculate Aspect Ratio of the CROPPED area
            const cropPixelW = naturalW * (wPct / 100);
            const cropPixelH = naturalH * (hPct / 100);
            const newAspect = cropPixelW / cropPixelH;
            
            setContainerAspect(newAspect);

            setCropStyle({
                width: `${(100 / wPct) * 100}%`,
                height: `${(100 / hPct) * 100}%`,
                // Translate the image so the top-left of the crop (xmin, ymin) is at (0,0)
                // Note: percentages in translate are relative to the element's width/height itself
                transform: `translate(${-xmin}%, ${-ymin}%)`
            });

        } catch (err) {
            console.error("Floor plan analysis failed", err);
        } finally {
            setAnalyzingImage(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCellClick = (key: string, star: number, label: string) => {
      setSelectedCell({ key, star, label });
  }

  const renderCell = (item: typeof GRID_KEYS[0], index: number, isOverlay: boolean) => {
    const star = data?.stars[item.key] || 0;
    const starInfo = STAR_DETAILS[star];
    const isSelected = selectedCell?.key === item.key;
    const isCenter = item.key === 'center';
    
    const showRightBorder = index % 3 !== 2;
    const showBottomBorder = index < 6;

    const overlayStyle = isOverlay ? {
        borderRightWidth: showRightBorder ? '2px' : '0px',
        borderBottomWidth: showBottomBorder ? '2px' : '0px',
        borderColor: 'black',
        backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
    } : {};

    const standardClasses = `
       rounded-lg border
       ${isCenter ? 'bg-amber-50 ring-1 ring-amber-200' : 'bg-white'} 
       ${isSelected ? 'ring-2 ring-indigo-500 scale-105 z-20 shadow-md' : 'border-indigo-50 shadow-sm'}
    `;

    const textShadowStyle = isOverlay ? { textShadow: '2px 0 #fff, -2px 0 #fff, 0 2px #fff, 0 -2px #fff, 1px 1px #fff, -1px -1px #fff, 1px -1px #fff, -1px 1px #fff' } : {};

    return (
      <button 
        key={item.key} 
        onClick={() => handleCellClick(item.key, star, item.label)}
        className={`flex flex-col items-center justify-between transition-all duration-200 p-2
          ${isOverlay ? 'hover:bg-white/10' : standardClasses}
        `}
        style={overlayStyle}
      >
        <div className="w-full flex justify-between items-start">
            <span 
                className={`text-[10px] font-bold uppercase tracking-tighter px-1 rounded ${isOverlay ? 'text-black' : 'text-slate-500 bg-white/50'}`}
                style={isOverlay ? { textShadow: '0 0 3px #fff' } : {}}
            >
            {item.label}
            </span>
            <div className="flex gap-0.5" style={isOverlay ? { textShadow: '0 0 3px #fff' } : {}}>
                {item.key === 'south' && <span className="text-[8px] text-red-600 font-bold">S</span>}
                {item.key === 'north' && <span className="text-[8px] text-blue-600 font-bold">N</span>}
                {item.key === 'east' && <span className="text-[8px] text-green-600 font-bold">E</span>}
                {item.key === 'west' && <span className="text-[8px] text-stone-600 font-bold">W</span>}
            </div>
        </div>
        
        {star > 0 && (
            <>
            <span 
                className={`text-3xl font-bold font-serif-sc leading-none ${isOverlay ? 'text-fuchsia-700' : starInfo?.color}`}
                style={isOverlay ? textShadowStyle : {}}
            >
            {star}
            </span>

            <span 
                className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold truncate w-full text-center 
                   ${isOverlay ? 'text-black' : `${starInfo?.bg} ${starInfo?.color} opacity-90 shadow-sm`}
                `}
                style={isOverlay ? { textShadow: '0 0 3px #fff' } : {}}
            >
            {starInfo?.type}
            </span>
            </>
        )}
      </button>
    );
  };

  return (
    <div className="p-4 space-y-6 pb-24 max-w-lg mx-auto">
      <header className="text-center mb-4">
        <h2 className="text-3xl font-serif-sc font-bold text-indigo-900">九宫飞星</h2>
        <p className="text-indigo-400 text-sm mt-1">玄空风水布局</p>
      </header>

      <div className="flex items-center justify-between bg-white p-3 rounded-full shadow-sm border border-indigo-50 max-w-xs mx-auto">
        <button onClick={decrementYear} className="p-2 text-indigo-900 hover:bg-indigo-50 rounded-full">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <span className="text-lg font-bold text-indigo-900 font-serif-sc">{year}年</span>
        <button onClick={incrementYear} className="p-2 text-indigo-900 hover:bg-indigo-50 rounded-full">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </button>
      </div>

      {loading ? (
        <div className="h-80 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-900"></div>
        </div>
      ) : data ? (
        <>
          <div className="relative max-w-sm mx-auto rounded-xl overflow-hidden shadow-lg bg-white transition-all">
             {floorPlanImage ? (
                 // Fusion Mode: Aspect ratio defined by detected crop
                 <div 
                    className="relative w-full overflow-hidden" 
                    style={{ aspectRatio: containerAspect }}
                 >
                     {/* The Image: transformed to zoom into the crop area */}
                     <img 
                        src={floorPlanImage} 
                        alt="Floor Plan" 
                        className="absolute top-0 left-0 max-w-none origin-top-left"
                        style={cropStyle.width ? cropStyle : { width: '100%', height: '100%' }}
                     />
                     
                     {/* Overlay Grid: Matches container exact dimensions (which represent the indoor area) */}
                     <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 z-10 border-2 border-black">
                        {GRID_KEYS.map((item, index) => renderCell(item, index, true))}
                     </div>

                     {/* Loading Overlay for Analysis */}
                     {analyzingImage && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center text-white">
                             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-2"></div>
                             <span className="text-xs font-bold">正在识别户型结构...</span>
                        </div>
                     )}
                 </div>
             ) : (
                 // Standard Mode: Fixed Square Aspect Ratio
                 <div className="aspect-square grid grid-cols-3 grid-rows-3 gap-1 p-2 bg-indigo-50">
                    {GRID_KEYS.map((item, index) => renderCell(item, index, false))}
                 </div>
             )}
          </div>
          
          <div className="flex justify-center">
             <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-800 rounded-full text-sm font-bold hover:bg-indigo-200 transition-colors"
             >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                {floorPlanImage ? "更换户型图" : "上传户型图融合"}
             </button>
             <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
          </div>

          {/* Selected Palace Info */}
          {selectedCell && STAR_DETAILS[selectedCell.star] && (
             <div className="bg-white p-6 rounded-2xl shadow-lg border border-indigo-100 animate-fade-in ring-1 ring-indigo-50">
                <div className="flex items-center justify-between mb-3 border-b border-indigo-50 pb-2">
                   <div className="flex items-center gap-2">
                      <span className="bg-indigo-900 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                        {selectedCell.star}
                      </span>
                      <h3 className="text-lg font-bold text-indigo-900 font-serif-sc">
                        {STAR_DETAILS[selectedCell.star].name}
                      </h3>
                   </div>
                   <span className="text-sm font-bold text-indigo-500">{selectedCell.label}方</span>
                </div>
                
                <div className="mb-4">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-bold mb-2 ${STAR_DETAILS[selectedCell.star].bg} ${STAR_DETAILS[selectedCell.star].color}`}>
                        {STAR_DETAILS[selectedCell.star].type}
                    </span>
                    <p className="text-stone-600 text-sm leading-relaxed text-justify">
                        {STAR_DETAILS[selectedCell.star].desc}
                    </p>
                </div>
                
                <div className="text-xs text-stone-400 text-right">
                   点击其他宫位查看详情
                </div>
             </div>
          )}

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-50">
            <h3 className="text-lg font-bold text-indigo-900 mb-2 font-serif-sc">大师建议</h3>
            <p className="text-stone-600 text-sm leading-relaxed mb-4 text-justify">{data.advice}</p>
            <div className="bg-indigo-50 p-4 rounded-lg flex items-start gap-3">
              <svg className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <div>
                <span className="block text-xs font-bold text-indigo-800 uppercase">年度财位</span>
                <span className="text-indigo-700 text-sm font-medium">{data.wealthDirection}</span>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default FlyingStarsView;
