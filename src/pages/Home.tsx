import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Play, Settings } from 'lucide-react';
import Footer from '../components/Footer';

export default function Home() {
  const [teamName, setTeamName] = useState('');
  const navigate = useNavigate();
  const setGameState = useStore((state) => state.setGameState);
  const resetGameState = useStore((state) => state.resetGameState);

  const handleStart = () => {
    if (!teamName.trim()) {
      alert('Vui lòng nhập tên nhóm!');
      return;
    }
    resetGameState();
    setGameState({ teamName });
    navigate('/game');
  };

  return (
    <div className="min-h-screen bg-emerald-400 flex flex-col items-center justify-center p-4 relative">
      <div className="absolute top-4 right-4 z-50">
        <button
          onClick={() => navigate('/admin')}
          className="p-3 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
        >
          <Settings size={24} />
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center border-4 border-emerald-500">
        <h1 className="text-4xl font-black text-emerald-600 mb-2 uppercase tracking-tight">
          Thử thách nghiêng đầu
        </h1>
        <p className="text-gray-500 mb-8 font-medium">Trò chơi tương tác bằng cử động đầu</p>

        <div className="space-y-6">
          <div>
            <label className="block text-left text-lg font-bold text-gray-700 mb-2">
              Tên Nhóm / Tên Bé:
            </label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Nhập tên ở đây..."
              className="w-full text-2xl p-4 rounded-2xl border-4 border-emerald-200 focus:border-emerald-500 focus:outline-none text-center font-bold text-gray-800 placeholder-gray-300 transition-colors"
              onKeyDown={(e) => e.key === 'Enter' && handleStart()}
            />
          </div>

          <button
            onClick={handleStart}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white text-2xl font-black py-4 px-8 rounded-2xl shadow-[0_8px_0_rgb(194,65,12)] hover:shadow-[0_4px_0_rgb(194,65,12)] hover:translate-y-1 transition-all flex items-center justify-center gap-3"
          >
            <Play fill="currentColor" size={32} />
            BẮT ĐẦU CHƠI
          </button>
        </div>

        <div className="mt-8 pt-6 border-t-2 border-dashed border-gray-200 text-left">
          <h3 className="font-bold text-gray-800 mb-3 text-lg">Hướng dẫn chơi:</h3>
          <ul className="space-y-2 text-gray-600 font-medium">
            <li className="flex items-center gap-2">
              <span className="text-2xl">⬅️</span> Nghiêng đầu TRÁI để chọn A
            </li>
            <li className="flex items-center gap-2">
              <span className="text-2xl">➡️</span> Nghiêng đầu PHẢI để chọn B
            </li>
            <li className="flex items-center gap-2">
              <span className="text-2xl">☝️</span> Giơ 1 NGÓN TAY để qua câu
            </li>
          </ul>
        </div>
      </div>
      <Footer />
    </div>
  );
}
