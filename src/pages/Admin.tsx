import React, { useState, useRef, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore, Question, QuestionType } from '../store/useStore';
import { ArrowLeft, Plus, Trash2, Edit2, Save, Image as ImageIcon, Type, Download, Upload, Music, X, FileSpreadsheet } from 'lucide-react';
import Footer from '../components/Footer';
import * as XLSX from 'xlsx';

export default function Admin() {
  const navigate = useNavigate();
  const { questions, settings, addQuestion, updateQuestion, removeQuestion, updateSettings, loadInitialQuestions } = useStore();
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [newQ, setNewQ] = useState<Partial<Question>>({
    type: 'text',
    correct: 'A',
    question: '',
    A: '',
    A_type: 'text',
    B: '',
    B_type: 'text'
  });

  const fileInputARef = useRef<HTMLInputElement>(null);
  const fileInputBRef = useRef<HTMLInputElement>(null);
  const fileInputQRef = useRef<HTMLInputElement>(null);
  const fileInputAudioQRef = useRef<HTMLInputElement>(null);
  const importFileRef = useRef<HTMLInputElement>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'soangiangtv' && password === '2026') {
      setIsAuthenticated(true);
      setLoginError('');
    } else {
      setLoginError('Tên đăng nhập hoặc mật khẩu không đúng!');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl max-w-lg w-full border-t-[12px] border-emerald-500 relative">
          <button onClick={() => navigate('/')} className="absolute top-8 right-8 text-gray-400 hover:text-gray-600 transition-colors">
            <X size={32} />
          </button>

          <div className="mb-8">
            <h2 className="text-3xl font-black text-gray-900 mb-2">Quản Trị Viên</h2>
            <p className="text-gray-500 font-medium">Vui lòng đăng nhập để quản lý trò chơi</p>
          </div>

          {/* Quick Instruction */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-5 mb-8 rounded-r-2xl">
            <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
              <SettingsIcon /> Hướng dẫn nhập liệu
            </h3>
            <p className="text-sm text-blue-800/80 leading-relaxed">
              Hệ thống hỗ trợ tạo câu hỏi đa phương tiện (Chữ, Ảnh, Âm thanh). Bạn có thể tự soạn hoặc nhập nhanh từ file Excel (.xlsx).
            </p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-black text-gray-700 mb-2 uppercase tracking-wider">Tài khoản</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-4 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition-all text-lg"
                placeholder="Tên đăng nhập..."
                required
              />
            </div>
            <div>
              <label className="block text-sm font-black text-gray-700 mb-2 uppercase tracking-wider">Mật khẩu</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-4 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition-all text-lg"
                placeholder="••••••••"
                required
              />
            </div>
            
            {loginError && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold border border-red-100 animate-shake">
                {loginError}
              </div>
            )}
            
            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 px-6 rounded-2xl transition-all shadow-lg hover:shadow-emerald-200 text-lg uppercase tracking-widest active:scale-[0.98]"
            >
              Đăng nhập hệ thống
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-gray-100 text-center">
            <p className="text-gray-500 text-sm leading-relaxed">
              Hỗ trợ kỹ thuật: <span className="font-black text-emerald-600">Hoàng Hưởng</span><br/>
              Zalo: <span className="font-black text-emerald-600">0355936256</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>, target: 'question' | 'A' | 'B') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewQ(prev => ({ ...prev, [target]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAudioUpload = (e: ChangeEvent<HTMLInputElement>, target: 'bgm' | 'question') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File âm thanh quá lớn. Vui lòng chọn file dưới 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Audio = reader.result as string;
        if (target === 'bgm') {
          updateSettings({
            customSounds: {
              ...settings.customSounds,
              bgm: base64Audio
            }
          });
        } else {
          setNewQ(prev => ({ ...prev, question: base64Audio }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeCustomAudio = (type: 'bgm') => {
    const newSounds = { ...settings.customSounds };
    delete newSounds[type];
    updateSettings({ customSounds: newSounds });
  };

  const handleSaveNew = () => {
    if (!newQ.question || !newQ.A || !newQ.B) {
      alert('Vui lòng điền đầy đủ thông tin!');
      return;
    }
    addQuestion(newQ as Omit<Question, 'id'>);
    setNewQ({ 
      type: 'text', 
      correct: 'A', 
      question: '', 
      A: '', 
      A_type: 'text', 
      B: '', 
      B_type: 'text' 
    });
  };

  const handleExportExcel = () => {
    const MAX_EXCEL_LEN = 32760; // Slightly less than 32767 to be safe
    const data = questions.map(q => {
      const processValue = (val: string) => {
        if (val && val.length > MAX_EXCEL_LEN) {
          return `[DỮ LIỆU QUÁ LỚN (${(val.length / 1024).toFixed(1)}KB) - VUI LÒNG DÙNG XUẤT JSON ĐỂ SAO LƯU ĐẦY ĐỦ]`;
        }
        return val;
      };

      return {
        'Loại câu hỏi': q.type,
        'Nội dung câu hỏi': processValue(q.question),
        'Loại đáp án A': q.A_type,
        'Nội dung đáp án A': processValue(q.A),
        'Loại đáp án B': q.B_type,
        'Nội dung đáp án B': processValue(q.B),
        'Đáp án đúng': q.correct
      };
    });

    try {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Questions");
      XLSX.writeFile(workbook, "questions.xlsx");
    } catch (error) {
      console.error(error);
      alert('Lỗi khi xuất file Excel. Có thể do dữ liệu quá lớn. Vui lòng thử Xuất JSON.');
    }
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(questions, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "questions_backup.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImportJSON = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const importedQuestions = JSON.parse(event.target?.result as string);
          if (Array.isArray(importedQuestions)) {
            const valid = importedQuestions.every(q => q.question && q.A && q.B && q.correct);
            if (valid) {
              loadInitialQuestions(importedQuestions);
              alert('Nhập JSON thành công!');
            } else {
              alert('File JSON không đúng định dạng!');
            }
          }
        } catch (error) {
          alert('Lỗi đọc file JSON!');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleImportExcel = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          const importedQuestions: Omit<Question, 'id'>[] = jsonData.map((row: any) => ({
            type: row['Loại câu hỏi'] as QuestionType,
            question: String(row['Nội dung câu hỏi'] || ''),
            A_type: (row['Loại đáp án A'] || 'text') as 'text' | 'image',
            A: String(row['Nội dung đáp án A'] || ''),
            B_type: (row['Loại đáp án B'] || 'text') as 'text' | 'image',
            B: String(row['Nội dung đáp án B'] || ''),
            correct: (row['Đáp án đúng'] || 'A') as 'A' | 'B'
          }));

          if (importedQuestions.length > 0) {
            const valid = importedQuestions.every(q => q.question && q.A && q.B && q.correct);
            if (valid) {
              loadInitialQuestions(importedQuestions as Question[]);
              alert('Nhập dữ liệu thành công!');
            } else {
              alert('Dữ liệu trong file Excel không đúng định dạng!');
            }
          }
        } catch (error) {
          alert('Lỗi đọc file Excel!');
        }
      };
      reader.readAsArrayBuffer(file);
    }
    if (importFileRef.current) importFileRef.current.value = '';
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Loại câu hỏi': 'text',
        'Nội dung câu hỏi': 'Thủ đô của Việt Nam là gì?',
        'Loại đáp án A': 'text',
        'Nội dung đáp án A': 'Hà Nội',
        'Loại đáp án B': 'text',
        'Nội dung đáp án B': 'TP.HCM',
        'Đáp án đúng': 'A'
      },
      {
        'Loại câu hỏi': 'image_question',
        'Nội dung câu hỏi': 'data:image/png;base64,... (hoặc text nếu là câu hỏi chữ)',
        'Loại đáp án A': 'image',
        'Nội dung đáp án A': 'data:image/png;base64,...',
        'Loại đáp án B': 'image',
        'Nội dung đáp án B': 'data:image/png;base64,...',
        'Đáp án đúng': 'B'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
    XLSX.writeFile(workbook, "mau_cau_hoi.xlsx");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="bg-emerald-500 p-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="p-2 hover:bg-emerald-600 rounded-xl transition-all active:scale-90">
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-2xl font-black tracking-tight">Quản Trị Game</h1>
              <p className="text-emerald-100 text-xs font-medium">Thiết lập câu hỏi và cấu hình trò chơi</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input 
              type="file" 
              accept=".xlsx, .xls" 
              className="hidden" 
              ref={importFileRef}
              onChange={handleImportExcel}
            />
            <input 
              type="file" 
              accept=".json" 
              className="hidden" 
              id="import-json-input"
              onChange={handleImportJSON}
            />
            <button 
              onClick={handleDownloadTemplate}
              className="bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all backdrop-blur-sm"
              title="Tải file Excel mẫu"
            >
              <FileSpreadsheet size={14} /> File Mẫu
            </button>
            <button 
              onClick={() => importFileRef.current?.click()}
              className="bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all backdrop-blur-sm"
              title="Nhập file Excel"
            >
              <Upload size={14} /> Nhập Excel
            </button>
            <button 
              onClick={handleExportExcel}
              className="bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all backdrop-blur-sm"
              title="Xuất file Excel"
            >
              <Download size={14} /> Xuất Excel
            </button>
            <div className="h-6 w-[1px] bg-white/20 mx-1"></div>
            <button 
              onClick={() => document.getElementById('import-json-input')?.click()}
              className="bg-blue-500/40 hover:bg-blue-500/60 px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all backdrop-blur-sm border border-blue-400/30"
              title="Nhập file JSON (Dành cho dữ liệu lớn)"
            >
              <Upload size={14} /> Nhập JSON
            </button>
            <button 
              onClick={handleExportJSON}
              className="bg-blue-500/40 hover:bg-blue-500/60 px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all backdrop-blur-sm border border-blue-400/30"
              title="Xuất file JSON (Sao lưu đầy đủ)"
            >
              <Download size={14} /> Xuất JSON
            </button>
            <div className="bg-emerald-700/50 px-3 py-1.5 rounded-xl font-black border border-emerald-400/30 backdrop-blur-md text-base ml-2">
              {questions.length} <span className="text-[10px] font-bold opacity-70">CÂU HỎI</span>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6">
          {/* Instruction Section */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-r-2xl shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-blue-500 text-white p-1.5 rounded-lg">
                <SettingsIcon />
              </div>
              <h3 className="text-lg font-black text-blue-900 uppercase tracking-tight">Hướng dẫn nhập liệu</h3>
            </div>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-[13px] font-medium text-blue-800/80">
              <li className="flex items-start gap-2">
                <span className="bg-blue-200 text-blue-700 w-5 h-5 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0">1</span>
                <span>Chọn <span className="font-black text-blue-900">Loại câu hỏi</span>: Chữ, Ảnh, hoặc Âm.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-blue-200 text-blue-700 w-5 h-5 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0">2</span>
                <span>Nhập nội dung <span className="font-black text-blue-900">Câu hỏi</span> hoặc tải file.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-blue-200 text-blue-700 w-5 h-5 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0">3</span>
                <span>Thiết lập <span className="font-black text-blue-900">Đáp án A & B</span>: Chuyển đổi Chữ/Ảnh.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-blue-200 text-blue-700 w-5 h-5 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0">4</span>
                <span>Chọn <span className="font-black text-blue-900">Đáp án đúng</span> và nhấn <span className="font-black text-blue-900">Thêm</span>.</span>
              </li>
            </ul>
          </div>

          {/* Add Question Form - Structured Grid */}
          <div className="bg-emerald-50 p-6 rounded-[2rem] border-2 border-emerald-100 mb-8 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-200/20 rounded-full -mr-24 -mt-24 blur-3xl"></div>
            
            <h2 className="text-xl font-black text-emerald-800 mb-6 flex items-center gap-3 uppercase tracking-tighter">
              <div className="bg-emerald-500 text-white p-1.5 rounded-xl shadow-lg shadow-emerald-200">
                <Plus size={24} />
              </div>
              Thêm câu hỏi mới
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 relative z-10">
              {/* Row 1: Type and Content */}
              <div className="md:col-span-4">
                <label className="block text-[11px] font-black text-emerald-700 mb-2 uppercase tracking-widest opacity-80">1. Loại câu hỏi</label>
                <div className="flex gap-1.5 bg-white p-1.5 rounded-2xl border-2 border-emerald-100 shadow-sm h-12">
                  <button
                    className={`flex-1 rounded-lg text-[10px] font-black flex items-center justify-center gap-1.5 transition-all ${newQ.type === 'text' ? 'bg-emerald-500 text-white shadow-md scale-[1.02]' : 'text-gray-500 hover:bg-emerald-50'}`}
                    onClick={() => setNewQ({ ...newQ, type: 'text', question: '' })}
                  >
                    <Type size={14} /> CHỮ
                  </button>
                  <button
                    className={`flex-1 rounded-lg text-[10px] font-black flex items-center justify-center gap-1.5 transition-all ${newQ.type === 'image_question' ? 'bg-emerald-500 text-white shadow-md scale-[1.02]' : 'text-gray-500 hover:bg-emerald-50'}`}
                    onClick={() => setNewQ({ ...newQ, type: 'image_question', question: '' })}
                  >
                    <ImageIcon size={14} /> ẢNH
                  </button>
                  <button
                    className={`flex-1 rounded-lg text-[10px] font-black flex items-center justify-center gap-1.5 transition-all ${newQ.type === 'audio_question' ? 'bg-emerald-500 text-white shadow-md scale-[1.02]' : 'text-gray-500 hover:bg-emerald-50'}`}
                    onClick={() => setNewQ({ ...newQ, type: 'audio_question', question: '' })}
                  >
                    <Music size={14} /> ÂM
                  </button>
                </div>
              </div>

              <div className="md:col-span-8">
                <label className="block text-[11px] font-black text-emerald-700 mb-2 uppercase tracking-widest opacity-80">2. Nội dung câu hỏi</label>
                {newQ.type === 'image_question' ? (
                  <div className="flex gap-2 h-12">
                    <input type="file" accept="image/*" className="hidden" ref={fileInputQRef} onChange={(e) => handleImageUpload(e, 'question')} />
                    <button onClick={() => fileInputQRef.current?.click()} className="flex-1 border-2 border-dashed border-emerald-300 rounded-2xl bg-white text-emerald-600 hover:bg-emerald-50 flex items-center justify-center overflow-hidden transition-all hover:border-emerald-500 shadow-sm">
                      {newQ.question ? <img src={newQ.question} alt="Q" className="h-full object-contain" /> : <><Plus size={20} className="mr-2" /> Tải ảnh câu hỏi</>}
                    </button>
                  </div>
                ) : newQ.type === 'audio_question' ? (
                  <div className="flex gap-2 h-12">
                    <input type="file" accept="audio/*" className="hidden" ref={fileInputAudioQRef} onChange={(e) => handleAudioUpload(e, 'question')} />
                    <button onClick={() => fileInputAudioQRef.current?.click()} className="flex-1 border-2 border-dashed border-emerald-300 rounded-2xl bg-white text-emerald-600 hover:bg-emerald-50 flex items-center justify-center transition-all hover:border-emerald-500 shadow-sm">
                      {newQ.question ? <span className="text-sm font-black flex items-center gap-2"><Music size={16} /> ✓ Đã tải âm thanh</span> : <><Music size={20} className="mr-2" /> Tải file âm thanh</>}
                    </button>
                  </div>
                ) : (
                  <input 
                    type="text"
                    value={newQ.question}
                    onChange={(e) => setNewQ({ ...newQ, question: e.target.value })}
                    className="w-full h-12 px-4 border-2 border-emerald-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-base font-bold shadow-sm transition-all placeholder:text-gray-300"
                    placeholder="Nhập nội dung câu hỏi..."
                  />
                )}
              </div>

              {/* Row 2: Answers */}
              <div className="md:col-span-6">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-black text-emerald-700 uppercase tracking-widest opacity-80">3. Đáp án A</label>
                    <button 
                      onClick={() => setNewQ({ ...newQ, A_type: newQ.A_type === 'text' ? 'image' : 'text', A: '' })}
                      className={`text-[9px] font-black px-3 py-1.5 rounded-lg transition-all shadow-md border-2 flex items-center justify-center gap-1.5 ${
                        newQ.A_type === 'image' 
                          ? 'bg-orange-500 text-white border-orange-400 hover:bg-orange-600' 
                          : 'bg-blue-600 text-white border-blue-500 hover:bg-blue-700'
                      }`}
                    >
                      {newQ.A_type === 'image' ? (
                        <><Type size={12} /> CHUYỂN ĐÁP ÁN CHỮ</>
                      ) : (
                        <><ImageIcon size={12} /> CHUYỂN ĐÁP ÁN ẢNH</>
                      )}
                    </button>
                  </div>
                  {newQ.A_type === 'image' ? (
                    <div className="flex gap-2 h-16">
                      <input type="file" accept="image/*" className="hidden" ref={fileInputARef} onChange={(e) => handleImageUpload(e, 'A')} />
                      <button onClick={() => fileInputARef.current?.click()} className="flex-1 border-2 border-dashed border-emerald-300 rounded-2xl bg-white text-emerald-600 hover:bg-emerald-50 flex items-center justify-center overflow-hidden transition-all hover:border-emerald-500 shadow-sm">
                        {newQ.A ? <img src={newQ.A} alt="A" className="h-full object-contain" /> : <Plus size={24} />}
                      </button>
                    </div>
                  ) : (
                    <input 
                      type="text" 
                      value={newQ.A}
                      onChange={(e) => setNewQ({ ...newQ, A: e.target.value })}
                      className="w-full h-16 px-4 border-2 border-emerald-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-lg font-black shadow-sm transition-all text-center placeholder:text-gray-200"
                      placeholder="Nhập chữ..."
                    />
                  )}
                </div>
              </div>

              <div className="md:col-span-6">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-black text-emerald-700 uppercase tracking-widest opacity-80">4. Đáp án B</label>
                    <button 
                      onClick={() => setNewQ({ ...newQ, B_type: newQ.B_type === 'text' ? 'image' : 'text', B: '' })}
                      className={`text-[9px] font-black px-3 py-1.5 rounded-lg transition-all shadow-md border-2 flex items-center justify-center gap-1.5 ${
                        newQ.B_type === 'image' 
                          ? 'bg-orange-500 text-white border-orange-400 hover:bg-orange-600' 
                          : 'bg-blue-600 text-white border-blue-500 hover:bg-blue-700'
                      }`}
                    >
                      {newQ.B_type === 'image' ? (
                        <><Type size={12} /> CHUYỂN ĐÁP ÁN CHỮ</>
                      ) : (
                        <><ImageIcon size={12} /> CHUYỂN ĐÁP ÁN ẢNH</>
                      )}
                    </button>
                  </div>
                  {newQ.B_type === 'image' ? (
                    <div className="flex gap-2 h-16">
                      <input type="file" accept="image/*" className="hidden" ref={fileInputBRef} onChange={(e) => handleImageUpload(e, 'B')} />
                      <button onClick={() => fileInputBRef.current?.click()} className="flex-1 border-2 border-dashed border-emerald-300 rounded-2xl bg-white text-emerald-600 hover:bg-emerald-50 flex items-center justify-center overflow-hidden transition-all hover:border-emerald-500 shadow-sm">
                        {newQ.B ? <img src={newQ.B} alt="B" className="h-full object-contain" /> : <Plus size={24} />}
                      </button>
                    </div>
                  ) : (
                    <input 
                      type="text" 
                      value={newQ.B}
                      onChange={(e) => setNewQ({ ...newQ, B: e.target.value })}
                      className="w-full h-16 px-4 border-2 border-emerald-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-lg font-black shadow-sm transition-all text-center placeholder:text-gray-200"
                      placeholder="Nhập chữ..."
                    />
                  )}
                </div>
              </div>

              {/* Row 3: Correct Answer and Submit */}
              <div className="md:col-span-4">
                <label className="block text-[11px] font-black text-emerald-700 mb-2 uppercase tracking-widest opacity-80">5. Đáp án đúng</label>
                <div className="flex bg-white p-1.5 rounded-2xl border-2 border-emerald-100 h-14 shadow-sm">
                  <button
                    className={`flex-1 rounded-xl text-xl font-black transition-all ${newQ.correct === 'A' ? 'bg-emerald-500 text-white shadow-md scale-[1.05]' : 'text-gray-400 hover:bg-emerald-50'}`}
                    onClick={() => setNewQ({ ...newQ, correct: 'A' })}
                  >
                    A
                  </button>
                  <button
                    className={`flex-1 rounded-xl text-xl font-black transition-all ${newQ.correct === 'B' ? 'bg-emerald-500 text-white shadow-md scale-[1.05]' : 'text-gray-400 hover:bg-emerald-50'}`}
                    onClick={() => setNewQ({ ...newQ, correct: 'B' })}
                  >
                    B
                  </button>
                </div>
              </div>

              <div className="md:col-span-8 flex items-end">
                <button 
                  onClick={handleSaveNew}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black h-14 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl hover:shadow-emerald-200 text-xl uppercase tracking-tighter"
                >
                  <Plus size={24} /> THÊM CÂU HỎI
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Settings Panel */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <SettingsIcon /> Cài đặt vòng chơi
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Số câu mỗi vòng</label>
                    <input 
                      type="number" 
                      min="1"
                      value={settings.questionsPerRound}
                      onChange={(e) => updateSettings({ questionsPerRound: parseInt(e.target.value) || 5 })}
                      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl">
                    <span className="font-medium text-gray-700">Đảo ngẫu nhiên</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={settings.randomize}
                        onChange={(e) => updateSettings({ randomize: e.target.checked })}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Audio Settings Panel */}
              <div className="bg-sky-50 p-6 rounded-2xl border border-sky-200">
                <h2 className="text-xl font-bold text-sky-800 mb-4 flex items-center gap-2">
                  <Music size={24} /> Cài đặt Âm thanh
                </h2>
                
                <div className="space-y-4">
                  {/* BGM */}
                  <div className="bg-white p-3 rounded-xl border border-sky-100">
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-bold text-gray-700">Nhạc nền (BGM)</label>
                      {settings.customSounds?.bgm && (
                        <button onClick={() => removeCustomAudio('bgm')} className="text-red-500 hover:text-red-700 p-1" title="Xóa nhạc nền tùy chỉnh">
                          <X size={16} />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <input 
                        type="file" 
                        accept="audio/*" 
                        onChange={(e) => handleAudioUpload(e, 'bgm')}
                        className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 w-full"
                      />
                    </div>
                    {settings.customSounds?.bgm && <p className="text-xs text-green-600 mt-1">✓ Đã tải lên nhạc tùy chỉnh</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* Questions List */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Danh sách câu hỏi</h2>
                <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{questions.length} câu hỏi đã tạo</div>
              </div>
              
              <div className="space-y-3 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
                {questions.map((q, index) => (
                  <div key={q.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-lg hover:border-emerald-200 transition-all group relative overflow-hidden">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-4">
                        <span className="bg-emerald-500 text-white font-black text-lg w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-100 shrink-0">
                          {index + 1}
                        </span>
                        <div className="flex-1">
                          {q.type === 'image_question' ? (
                            <div className="flex items-center gap-4">
                              <span className="bg-blue-100 text-blue-700 text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest">ẢNH CÂU HỎI</span>
                              <img src={q.question} alt="Question" className="h-16 w-24 object-contain rounded-xl border border-gray-100 shadow-sm" />
                            </div>
                          ) : q.type === 'audio_question' ? (
                            <div className="flex items-center gap-4">
                              <span className="bg-purple-100 text-purple-700 text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest">ÂM THANH</span>
                              <audio src={q.question} controls className="h-8 scale-90 origin-left" />
                            </div>
                          ) : (
                            <h3 className="text-lg font-black text-gray-800 tracking-tight leading-tight">{q.question}</h3>
                          )}
                        </div>
                      </div>
                      <button 
                        onClick={() => removeQuestion(q.id)}
                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all active:scale-90"
                        title="Xóa câu hỏi"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-3 transition-all ${q.correct === 'A' ? 'border-emerald-500 bg-emerald-50/30' : 'border-gray-50 bg-gray-50/20'}`}>
                        <div className="flex items-center gap-2">
                          <span className={`font-black text-xs uppercase tracking-widest ${q.correct === 'A' ? 'text-emerald-600' : 'text-gray-400'}`}>ĐÁP ÁN A</span>
                          {q.correct === 'A' && <div className="bg-emerald-500 text-white p-1 rounded-full shadow-md"><Save size={10} /></div>}
                        </div>
                        {q.A_type === 'image' || (q.type === 'image' && !q.A_type) ? (
                          <img src={q.A} alt="A" className="h-24 object-contain rounded-xl shadow-sm border-2 border-white" />
                        ) : (
                          <span className={`text-base font-black text-center px-2 ${q.correct === 'A' ? 'text-emerald-900' : 'text-gray-600'}`}>{q.A}</span>
                        )}
                      </div>
                      <div className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-3 transition-all ${q.correct === 'B' ? 'border-emerald-500 bg-emerald-50/30' : 'border-gray-50 bg-gray-50/20'}`}>
                        <div className="flex items-center gap-2">
                          <span className={`font-black text-xs uppercase tracking-widest ${q.correct === 'B' ? 'text-emerald-600' : 'text-gray-400'}`}>ĐÁP ÁN B</span>
                          {q.correct === 'B' && <div className="bg-emerald-500 text-white p-1 rounded-full shadow-md"><Save size={10} /></div>}
                        </div>
                        {q.B_type === 'image' || (q.type === 'image' && !q.B_type) ? (
                          <img src={q.B} alt="B" className="h-24 object-contain rounded-xl shadow-sm border-2 border-white" />
                        ) : (
                          <span className={`text-base font-black text-center px-2 ${q.correct === 'B' ? 'text-emerald-900' : 'text-gray-600'}`}>{q.B}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {questions.length === 0 && (
                  <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <Plus size={40} className="mx-auto mb-3 opacity-20" />
                    <p className="text-lg font-black uppercase tracking-widest opacity-30">Chưa có câu hỏi nào</p>
                    <p className="text-xs font-medium mt-1">Hãy sử dụng thanh công cụ phía trên để thêm câu hỏi mới</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

function SettingsIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
  );
}
