import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Printer, ArrowLeft, Award, Download, Home } from 'lucide-react';
import Footer from '../components/Footer';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export default function Certificate() {
  const navigate = useNavigate();
  const { gameState, setGameState, resetGameState } = useStore();
  const certRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!certRef.current) return;
    
    setIsGenerating(true);
    try {
      const canvas = await html2canvas(certRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`giay-khen-${gameState.teamName || 'doi-choi'}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Có lỗi xảy ra khi tạo file PDF. Vui lòng thử lại.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGoHome = () => {
    resetGameState();
    setGameState({ teamName: '' });
    navigate('/');
  };

  if (!gameState.teamName) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-4xl flex flex-wrap justify-between items-center gap-4 mb-8 print:hidden">
        <div className="flex gap-2">
          <button 
            onClick={() => navigate('/game')}
            className="bg-white px-4 py-2 rounded-xl shadow-sm hover:bg-gray-50 flex items-center gap-2 font-bold text-gray-700 transition-all active:scale-95"
          >
            <ArrowLeft size={20} /> Quay lại
          </button>
          <button 
            onClick={handleGoHome}
            className="bg-indigo-500 text-white px-4 py-2 rounded-xl shadow-sm hover:bg-indigo-600 flex items-center gap-2 font-bold transition-all active:scale-95"
          >
            <Home size={20} /> Trang chủ
          </button>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={handleDownloadPDF}
            disabled={isGenerating}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-xl shadow-md flex items-center gap-2 font-bold transition-all active:scale-95"
          >
            <Download size={20} /> {isGenerating ? 'Đang tạo...' : 'Tải PDF'}
          </button>
          <button 
            onClick={handlePrint}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-md flex items-center gap-2 font-bold transition-all active:scale-95"
          >
            <Printer size={24} /> IN GIẤY KHEN
          </button>
        </div>
      </div>

      {/* Certificate Container */}
      <div 
        ref={certRef}
        className="bg-white w-full max-w-4xl aspect-[1.414/1] relative shadow-2xl overflow-hidden print:shadow-none print:w-[297mm] print:h-[210mm]"
        style={{
          backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"><rect width="100%" height="100%" fill="%23fff" /><path d="M0 0h100v100H0z" fill="%23f0fdf4" opacity="0.5"/><circle cx="10%" cy="10%" r="5%" fill="%23fcd34d" opacity="0.3"/><circle cx="90%" cy="80%" r="8%" fill="%236ee7b7" opacity="0.3"/><circle cx="80%" cy="20%" r="4%" fill="%2393c5fd" opacity="0.3"/><circle cx="20%" cy="85%" r="6%" fill="%23fca5a5" opacity="0.3"/></svg>')`,
          backgroundSize: 'cover'
        }}
      >
        {/* Border */}
        <div className="absolute inset-4 border-[12px] border-double border-emerald-400 rounded-2xl"></div>
        <div className="absolute inset-8 border-2 border-emerald-200 rounded-xl"></div>

        {/* Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 sm:p-8 md:p-16">
          <Award className="text-yellow-400 w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 mb-2 sm:mb-6" strokeWidth={1.5} />
          
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-emerald-600 mb-2 sm:mb-4 tracking-widest uppercase" style={{ fontFamily: 'serif' }}>
            GIẤY KHEN
          </h1>
          
          <p className="text-sm sm:text-lg md:text-2xl text-gray-600 mb-2 sm:mb-8 font-medium">
            Chứng nhận và chúc mừng đội/bé:
          </p>
          
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-orange-500 mb-4 sm:mb-8 border-b-2 sm:border-b-4 border-orange-200 pb-1 sm:pb-2 px-4 sm:px-12 inline-block">
            {gameState.teamName}
          </h2>
          
          <p className="text-sm sm:text-xl md:text-2xl text-gray-700 mb-2 sm:mb-4">
            Đã xuất sắc hoàn thành trò chơi
          </p>
          <p className="text-lg sm:text-2xl md:text-3xl font-bold text-emerald-600 mb-6 sm:mb-12">
            "THỬ THÁCH NGHIÊNG ĐẦU"
          </p>

          <div className="flex justify-center gap-8 sm:gap-16 w-full px-4 sm:px-24">
            <div className="text-center">
              <p className="text-gray-500 text-xs sm:text-sm md:text-lg uppercase font-bold mb-1">Điểm số</p>
              <p className="text-2xl sm:text-3xl md:text-4xl font-black text-indigo-600">{gameState.score}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-500 text-xs sm:text-sm md:text-lg uppercase font-bold mb-1">Ngày cấp</p>
              <p className="text-sm sm:text-xl md:text-2xl font-bold text-gray-800 mt-1 sm:mt-2">
                {new Date().toLocaleDateString('vi-VN')}
              </p>
            </div>
          </div>
        </div>

        {/* Corner Decorations */}
        <div className="absolute top-4 left-4 w-16 h-16 border-t-8 border-l-8 border-emerald-500 rounded-tl-xl"></div>
        <div className="absolute top-4 right-4 w-16 h-16 border-t-8 border-r-8 border-emerald-500 rounded-tr-xl"></div>
        <div className="absolute bottom-4 left-4 w-16 h-16 border-b-8 border-l-8 border-emerald-500 rounded-bl-xl"></div>
        <div className="absolute bottom-4 right-4 w-16 h-16 border-b-8 border-r-8 border-emerald-500 rounded-br-xl"></div>
      </div>
      <Footer />

      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 0;
          }
          body {
            background: white;
          }
        }
      `}</style>
    </div>
  );
}
