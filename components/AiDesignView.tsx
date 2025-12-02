import React, { useState, useRef } from 'react';
import { editRoomImage } from '../services/geminiService';

const AiDesignView: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setResultImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!selectedImage || !prompt) return;
    setLoading(true);
    
    // Extract base64 raw data
    const base64Data = selectedImage.split(',')[1];
    
    try {
      const newImage = await editRoomImage(base64Data, prompt);
      setResultImage(newImage);
    } catch (e) {
      alert("图片生成失败，请更换提示词或图片重试。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-6 pb-24">
      <header className="text-center mb-6">
        <h2 className="text-3xl font-serif-sc font-bold text-teal-900">AI 风水师</h2>
        <p className="text-teal-600 text-sm mt-1">智能家居风水布局调整</p>
      </header>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-teal-50">
        <div className="space-y-4">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-teal-200 rounded-xl bg-teal-50 aspect-video flex flex-col items-center justify-center cursor-pointer hover:bg-teal-100 transition-colors overflow-hidden relative"
          >
             {selectedImage ? (
                <img src={selectedImage} alt="Original" className="w-full h-full object-cover" />
             ) : (
               <>
                 <svg className="w-10 h-10 text-teal-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                 <span className="text-sm text-teal-600">上传房间照片</span>
               </>
             )}
             <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
          </div>

          <div>
            <label className="block text-sm font-medium text-teal-900 mb-2">风水调整意图</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="例如：'在角落放一盆富贵竹'，'清理桌面杂物'，'让光线更温暖以聚财'..."
              className="w-full p-3 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none text-sm h-24 resize-none"
            />
          </div>

          <button 
            onClick={handleGenerate}
            disabled={loading || !selectedImage || !prompt}
            className="w-full py-3 bg-gradient-to-r from-teal-600 to-teal-800 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
                <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                正在进行风水调整...
                </>
            ) : "开始调整"}
          </button>
        </div>
      </div>

      {resultImage && (
        <div className="bg-white p-4 rounded-2xl shadow-lg border border-teal-100 animate-fade-in">
          <h3 className="text-teal-900 font-bold mb-3 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            调整效果预览
          </h3>
          <div className="rounded-xl overflow-hidden shadow-sm">
            <img src={resultImage} alt="Result" className="w-full h-auto" />
          </div>
          <p className="text-xs text-center text-stone-400 mt-2">由 Gemini 2.5 Flash Image 提供技术支持</p>
        </div>
      )}
    </div>
  );
};

export default AiDesignView;
