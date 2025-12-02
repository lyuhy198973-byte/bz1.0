import { GoogleGenAI, Type, Schema } from "@google/genai";
// @ts-ignore
import { Solar, Lunar } from 'lunar-javascript';

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// --- Helpers ---

const calculateTenGod = (dayMasterGan: string, otherGan: string): string => {
    if (!otherGan) return '';
    const stems = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
    const elements = ['木', '木', '火', '火', '土', '土', '金', '金', '水', '水'];
    
    const dmIndex = stems.indexOf(dayMasterGan);
    const otherIndex = stems.indexOf(otherGan);
    
    if (dmIndex === -1 || otherIndex === -1) return '';

    const dmElement = elements[dmIndex];
    const otherElement = elements[otherIndex];
    
    // 0: Wood, 1: Fire, 2: Earth, 3: Metal, 4: Water
    const elMap: any = { '木': 0, '火': 1, '土': 2, '金': 3, '水': 4 };
    const dmVal = elMap[dmElement];
    const otherVal = elMap[otherElement];
    
    const samePolarity = (dmIndex % 2) === (otherIndex % 2);
    
    // Relationship: 0=Same, 1=Output, 2=Wealth, 3=Power, 4=Resource
    const diff = (otherVal - dmVal + 5) % 5;
    
    if (diff === 0) return samePolarity ? '比肩' : '劫财';
    if (diff === 1) return samePolarity ? '食神' : '伤官';
    if (diff === 2) return samePolarity ? '偏财' : '正财';
    if (diff === 3) return samePolarity ? '七杀' : '正官';
    if (diff === 4) return samePolarity ? '偏印' : '正印';
    
    return '';
};

const getElement = (char: string) => {
    const map: any = {
        '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土', '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水',
        '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火', '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水'
    };
    return map[char] || '';
};

const getElementCounts = (ganZhiList: (string | null)[]) => {
    const counts: Record<string, number> = { '金': 0, '木': 0, '水': 0, '火': 0, '土': 0 };
    ganZhiList.forEach(gz => {
        if (!gz) return;
        const gan = gz[0];
        const zhi = gz[1];
        counts[getElement(gan)]++;
        counts[getElement(zhi)]++;
    });
    return counts;
};

export const generateBaZiAnalysis = async (
  birthDate: string, 
  birthTime: string, 
  timeUnknown: boolean,
  location: { province: string; city: string; district: string }, 
  calendarType: 'Solar' | 'Lunar', 
  gender: 'Male' | 'Female'
): Promise<any> => {
  if (!apiKey) throw new Error("API Key missing");

  // --- Step 1: Deterministic Calculation using Lunar-Javascript ---
  const [year, month, day] = birthDate.split('-').map(Number);
  
  // Handle Time
  let hour = 12, minute = 0;
  if (!timeUnknown && birthTime) {
      [hour, minute] = birthTime.split(':').map(Number);
  }

  // Calculate True Solar Time (Basic Longitude Adjustment)
  let longitude = 120; 
  if (location.province === '四川' || location.city === '成都') longitude = 104.06;
  else if (location.province === '陕西' || location.city === '西安') longitude = 108.93;
  else if (location.city === '北京') longitude = 116.40;
  else if (location.city === '上海') longitude = 121.47;
  else if (location.province === '广东' || location.city === '广州') longitude = 113.26;
  else if (location.city === '深圳') longitude = 114.05;
  else if (location.province === '新疆') longitude = 87.62;
  else if (location.province === '辽宁') longitude = 123.43;
  else if (location.province === '台湾') longitude = 121.50;
  else if (location.province === '香港') longitude = 114.16;
  else if (location.province === '澳门') longitude = 113.54;

  const solarObj = Solar.fromYmdHms(year, month, day, hour, minute, 0);
  const lunarObj = solarObj.getLunar();
  const baZi = lunarObj.getEightChar();
  
  const yearGanZhi = baZi.getYear();
  const monthGanZhi = baZi.getMonth();
  const dayGanZhi = baZi.getDay();
  const timeGanZhi = timeUnknown ? null : baZi.getTime();

  const dayMasterChar = dayGanZhi[0];

  // Calculate Element Counts for Prompt Context
  const counts = getElementCounts([yearGanZhi, monthGanZhi, dayGanZhi, timeGanZhi]);
  const countsStr = Object.entries(counts).map(([k, v]) => `${k}:${v}`).join(', ');

  // Da Yun Calculation
  const genderVal = gender === 'Male' ? 1 : 0;
  const yun = baZi.getYun(genderVal);
  const daYunArr = yun.getDaYun(); 
  
  const daYunList = daYunArr.slice(1, 9).map((dy: any, idx: number) => {
     const ganZhi = dy.getGanZhi();
     const startYear = dy.getStartYear();
     const startAge = dy.getStartAge();
     const endYear = dy.getEndYear();
     const gan = ganZhi[0];
     const zhi = ganZhi[1];
     
     const liuNianRaw = dy.getLiuNian();
     const liuNianList = liuNianRaw.map((ln: any, lnIdx: number) => {
         const lnGanZhi = ln.getGanZhi();
         const lnGan = lnGanZhi[0];
         const lnZhi = lnGanZhi[1];
         return {
             index: lnIdx,
             year: ln.getYear(),
             age: ln.getAge(),
             ganZhi: lnGanZhi,
             gan: { char: lnGan, element: getElement(lnGan), tenGod: calculateTenGod(dayMasterChar, lnGan) },
             zhi: { char: lnZhi, element: getElement(lnZhi) }
         };
     });

     return {
         index: idx,
         startAge: startAge,
         startYear: startYear,
         endYear: endYear,
         ganZhi: ganZhi,
         gan: { char: gan, element: getElement(gan), tenGod: calculateTenGod(dayMasterChar, gan) },
         zhi: { char: zhi, element: getElement(zhi) },
         liuNian: liuNianList
     };
  });

  // Builder for Pillars
  const buildPillarData = (ganZhi: string | null, naYin: string) => {
    if (!ganZhi) return null;
    const ganChar = ganZhi[0];
    const zhiChar = ganZhi[1];
    
    const getHiddenStems = (zhi: string) => {
         const map: any = {
            '子': ['癸'], '丑': ['己','癸','辛'], '寅': ['甲','丙','戊'], '卯': ['乙'], 
            '辰': ['戊','乙','癸'], '巳': ['丙','庚','戊'], '午': ['丁','己'], '未': ['己','丁','乙'], 
            '申': ['庚','壬','戊'], '酉': ['辛'], '戌': ['戊','辛','丁'], '亥': ['壬','甲']
        };
        const stems = map[zhi] || [];
        return stems.map((s: string) => ({
            char: s,
            element: getElement(s),
            tenGod: calculateTenGod(dayMasterChar, s)
        }));
    };

    return {
        gan: { char: ganChar, element: getElement(ganChar), tenGod: calculateTenGod(dayMasterChar, ganChar) },
        zhi: { char: zhiChar, element: getElement(zhiChar), hidden: getHiddenStems(zhiChar) },
        naYin: naYin, 
        lifeStage: '', // Placeholder for AI
        shenSha: [],   // Placeholder for AI
        kongWang: false
    };
  };

  const pillarsData: any = {
      year: buildPillarData(yearGanZhi, baZi.getYearNaYin()),
      month: buildPillarData(monthGanZhi, baZi.getMonthNaYin()),
      day: buildPillarData(dayGanZhi, baZi.getDayNaYin()),
      time: timeUnknown ? null : buildPillarData(timeGanZhi, baZi.getTimeNaYin()),
  };

  // --- Step 2: Interpretation using Gemini ---
  
  const prompt = `
    你是一位精通子平八字的命理大师。
    
    **排盘信息:**
    - 年柱: ${yearGanZhi}
    - 月柱: ${monthGanZhi}
    - 日柱: ${dayGanZhi}
    - 时柱: ${timeUnknown ? '不详 (Unknown)' : timeGanZhi}
    - 五行统计: ${countsStr}
    - 性别: ${gender === 'Male' ? '男' : '女'}
    
    **任务:**
    1. 标注各柱相对于日主(${dayMasterChar})的"十二长生"状态。
    2. 识别关键神煞（如天乙贵人、桃花、驿马、空亡等）。
    3. 判定日主身强身弱，计算得分(0-100)，判定格局。
    4. 给出喜用神。
    5. **生成五行性格和健康分析**：
       - 根据五行统计找出最强（数量最多）和最弱（数量最少）的五行。
       - 基于以下规则生成分析文案，并适当扩展使其通顺自然，**请直接显示对应的问题，并根据提示词进行专业扩展**:
       
       **性格规则参考**:
       - 木最强：不会主动表露自己的心声，重实干，性格敏感，内敛
       - 木最弱：外表看起来有些弱，但内在有韧性，认死理，容易钻牛角尖
       - 火最强：有才华，有情调，有冲劲，有爆发力，性格容易急躁
       - 火最弱：思维敏捷，性格偏冷，偏消极
       - 土最强：内在有原则，形式灵活多变，群策群力，如有冲突内在原则会转变成为固执己见
       - 土最弱：会审时度势，自我调节能力强，但往往容易受环境影响，缺乏主见，稳定性不高
       - 金最强：敢于创新，忠诚义气，执行力强，有戾气，喜欢硬碰硬
       - 金最弱：不善拐弯，容易在无意中得罪人
       - 水最强：聪明，灵活，点子多，人缘好
       - 水最弱：乖巧，胆小，有耐心
       
       **健康规则参考**:
       - 金关联：肺部、呼吸道 (强: 肺部呼吸道本身问题; 弱: 容易发炎)
       - 木关联：肝胆 (强: 肝胆本身问题; 弱: 肝胆引发的间接症状)
       - 水关联：肾脏、泌尿系统 (强: 脏器本身问题; 弱: 精神方面问题)
       - 火关联：心脏、血液 (强: 心血管机能较弱; 弱: 心气不稳、血压不稳、贫血、易疲累)
       - 土关联：肠胃和皮肤 (强: 胃肠机能本身问题; 弱: 胃肠方面的炎症和病变问题)
  `;

  const schema: Schema = {
      type: Type.OBJECT,
      properties: {
          pillarAnalysis: {
            type: Type.OBJECT,
            properties: {
              year: { type: Type.OBJECT, properties: { lifeStage: {type: Type.STRING}, shenSha: {type: Type.ARRAY, items: {type: Type.STRING}} } },
              month: { type: Type.OBJECT, properties: { lifeStage: {type: Type.STRING}, shenSha: {type: Type.ARRAY, items: {type: Type.STRING}} } },
              day: { type: Type.OBJECT, properties: { lifeStage: {type: Type.STRING}, shenSha: {type: Type.ARRAY, items: {type: Type.STRING}} } },
              time: { type: Type.OBJECT, properties: { lifeStage: {type: Type.STRING}, shenSha: {type: Type.ARRAY, items: {type: Type.STRING}} } },
            }
          },
          strengthAnalysis: {
            type: Type.OBJECT,
            properties: {
              score: {type: Type.NUMBER},
              level: {type: Type.STRING},
              details: {type: Type.STRING}
            }
          },
          favorableElements: { type: Type.ARRAY, items: { type: Type.STRING } },
          fiveElementsAnalysis: {
            type: Type.OBJECT,
            properties: {
              personality: { type: Type.STRING },
              health: { type: Type.STRING }
            }
          }
      },
      required: ["strengthAnalysis", "fiveElementsAnalysis"]
  };

  const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
          responseMimeType: 'application/json',
          responseSchema: schema,
      }
  });

  const analysis = JSON.parse(result.text || '{}');

  // Merge AI analysis with deterministic pillar data
  if (analysis.pillarAnalysis) {
      if (pillarsData.year) {
          pillarsData.year.lifeStage = analysis.pillarAnalysis.year?.lifeStage || '';
          pillarsData.year.shenSha = analysis.pillarAnalysis.year?.shenSha || [];
      }
      if (pillarsData.month) {
          pillarsData.month.lifeStage = analysis.pillarAnalysis.month?.lifeStage || '';
          pillarsData.month.shenSha = analysis.pillarAnalysis.month?.shenSha || [];
      }
      if (pillarsData.day) {
          pillarsData.day.lifeStage = analysis.pillarAnalysis.day?.lifeStage || '';
          pillarsData.day.shenSha = analysis.pillarAnalysis.day?.shenSha || [];
      }
      if (pillarsData.time) {
          pillarsData.time.lifeStage = analysis.pillarAnalysis.time?.lifeStage || '';
          pillarsData.time.shenSha = analysis.pillarAnalysis.time?.shenSha || [];
      }
  }

  return {
      gender,
      calendarType,
      solarDate: solarObj.toYmd(),
      lunarDateString: lunarObj.toString(),
      solarTime: timeUnknown ? 'Unknown' : `${hour}:${minute}`,
      location,
      pillars: pillarsData,
      dayMaster: { char: dayMasterChar, element: getElement(dayMasterChar), strength: analysis.strengthAnalysis?.level || '' },
      daYun: daYunList,
      strengthAnalysis: analysis.strengthAnalysis,
      favorableElements: analysis.favorableElements || [],
      fiveElementsAnalysis: analysis.fiveElementsAnalysis
  };
};

export const generateFlyingStarAnalysis = async (year: number) => {
  if (!apiKey) throw new Error("API Key missing");
  const prompt = `Generate a Flying Star Feng Shui analysis for the year ${year}. 
  Return JSON with:
  - stars: A dictionary mapping directions to star numbers (1-9). Keys MUST be: 'center', 'north', 'south', 'east', 'west', 'northeast', 'northwest', 'southeast', 'southwest'.
  - advice: general advice string in Simplified Chinese
  - cures: string describing cures in Simplified Chinese
  - wealthDirection: string direction (e.g. Southwest) in Simplified Chinese`;
  
  const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
  });
  
  return JSON.parse(result.text || '{}');
};

export const analyzeFloorPlan = async (base64Image: string) => {
  if (!apiKey) throw new Error("API Key missing");
  const prompt = `Analyze this floor plan image. Identify the bounding box of the **indoor living space** (walls). 
  Exclude outdoor areas, gardens, large whitespace margins, and text legends. 
  Focus ONLY on the main architectural interior.
  Return a JSON object with keys: ymin, xmin, ymax, xmax.
  These values should be integers from 0 to 100, representing the percentage of the image height/width.
  Example: {"ymin": 10, "xmin": 15, "ymax": 90, "xmax": 85}`;

  const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/png', data: base64Image } },
          { text: prompt }
        ]
      },
      config: { 
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            ymin: { type: Type.INTEGER },
            xmin: { type: Type.INTEGER },
            ymax: { type: Type.INTEGER },
            xmax: { type: Type.INTEGER }
          }
        }
      }
  });

  return JSON.parse(result.text || '{"ymin": 0, "xmin": 0, "ymax": 100, "xmax": 100}');
};

export const generateHoroscopeForecast = async (sign: string, period: string) => {
  if (!apiKey) throw new Error("API Key missing");
  const prompt = `Generate a ${period} horoscope forecast for ${sign} in Simplified Chinese. Return JSON:
  - sign: string
  - forecast: string (approx 50 words, encouraging)
  - luckyColor: string
  - luckyNumber: string`;
  
  const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
  });
  
  return JSON.parse(result.text || '{}');
};

export const editRoomImage = async (base64Image: string, prompt: string) => {
  if (!apiKey) throw new Error("API Key missing");
  
  // Gemini 2.5 Flash Image uses generateContent for editing
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: 'image/png', // Assuming PNG or similar compatible type
            data: base64Image
          }
        },
        { text: `Edit this image based on the following instruction: ${prompt}` }
      ]
    },
  });

  const candidates = response.candidates;
  if (candidates && candidates.length > 0) {
     const parts = candidates[0].content.parts;
     for (const part of parts) {
         if (part.inlineData && part.inlineData.data) {
             return `data:image/png;base64,${part.inlineData.data}`;
         }
     }
  }
  throw new Error("No image generated");
};