import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  UploadCloud, 
  Trash2, 
  Leaf, 
  AlertTriangle, 
  ThermometerSun, 
  CheckCircle2, 
  Clock, 
  ScanLine,
  ExternalLink,
  Check,
  ArrowLeft,
  Info,
  Stethoscope,
  Activity
} from 'lucide-react';
import HeroSection from './components/HeroSection';

const API_BASE = "https://netra-vision-crop-disease-management.onrender.com";

const getValidImageUrl = (url) => {
  if (!url) return "";
  // If it's already a full cloud URL, use it directly
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  // Otherwise, fallback to the local API base for older local uploads
  return `${API_BASE}${url}`;
};

export default function App() {
  const [historyData, setHistoryData] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [diagnosis, setDiagnosis] = useState(null);
  const [selectedRecordId, setSelectedRecordId] = useState(null);
  
  // UX states
  const [isDragging, setIsDragging] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [showFullReport, setShowFullReport] = useState(false); 
  
  const workspaceRef = useRef(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const showToast = (text, type = "info") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${API_BASE}/analyse/`);
      // Removed undefined setActiveScan and safely handled array responses
      setHistoryData(Array.isArray(res.data) ? res.data : (res.data.history || []));
    } catch (err) {
      console.error("History fetch error:", err);
    }
  };

  // const processFile = async (file) => {
  //   if (!file || !file.type.startsWith("image/")) {
  //     showToast("Please upload a valid image file", "error");
  //     return;
  //   }

  //   setSelectedRecordId(null);
  //   setSelectedImage(URL.createObjectURL(file));
  //   setIsAnalyzing(true);
  //   setDiagnosis(null);

  //   const formData = new FormData();
  //   formData.append("file", file);

  //   try {
  //     const res = await axios.post(`${API_BASE}/analyse`, formData, {
  //       headers: { "Content-Type": "multipart/form-data" }
  //     });
  //     setDiagnosis(res.data.diagnosis ? res.data.diagnosis : res.data);
  //     showToast("Specimen synthesized successfully", "success");
  //     fetchHistory();
  //   } catch (error) {
  //     console.error("Analysis failed", error);
  //     showToast("Analysis engine failed to process image", "error");
  //   } finally {
  //     setIsAnalyzing(false);
  //   }
  // };

  const processFile = async (file) => {
    if (!file || !file.type.startsWith("image/")) {
      showToast("Please upload a valid image file", "error");
      return;
    }

    setSelectedRecordId(null);
    setSelectedImage(URL.createObjectURL(file));
    setIsAnalyzing(true);
    setDiagnosis(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      // Added a trailing slash to prevent FastAPI 307 Redirects
      const res = await axios.post(`${API_BASE}/analyse/`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      let responseData = res.data;
      let extractedDiagnosis = null;

      // Parse stringified JSON if the backend double-encoded it
      if (typeof responseData === 'string') {
        try { responseData = JSON.parse(responseData); } catch(e) {}
      }

      // Scenario A: Backend returned the full database record
      if (responseData && responseData.diagnosis) {
        extractedDiagnosis = responseData.diagnosis;
        if (responseData.image_url) {
          setSelectedImage(getValidImageUrl(responseData.image_url));
          if (responseData._id) setSelectedRecordId(responseData._id);
        }
      } 
      // Scenario B: Backend returned just the raw LLM output
      else if (responseData && (responseData["crop detected"] || responseData.crop_detected)) {
        extractedDiagnosis = responseData;
      }

      // SAFETY FALLBACK: If the POST response was empty/unexpected, 
      // fetch the newest record from the database since we know GET works.
      if (!extractedDiagnosis) {
        const historyRes = await axios.get(`${API_BASE}/analyse/`);
        const latestHistory = Array.isArray(historyRes.data) ? historyRes.data : (historyRes.data.history || []);
        
        if (latestHistory.length > 0) {
          extractedDiagnosis = latestHistory[0].diagnosis;
          setSelectedImage(getValidImageUrl(latestHistory[0].image_url));
          setSelectedRecordId(latestHistory[0]._id);
        }
      }

      setDiagnosis(extractedDiagnosis);
      showToast("Specimen synthesized successfully", "success");
      fetchHistory(); // Refresh the bottom timeline

    } catch (error) {
      console.error("Analysis failed", error);
      showToast("Analysis engine failed to process image", "error");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleInspectHistory = (record) => {
    setSelectedRecordId(record._id);
    setSelectedImage(getValidImageUrl(record.image_url));
    setDiagnosis(record.diagnosis);
    workspaceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const deleteRecord = async (e, id) => {
    e.stopPropagation(); 
    try {
      await axios.delete(`${API_BASE}/delete/${id}`);
      if (selectedRecordId === id) {
        setSelectedRecordId(null);
        setSelectedImage(null);
        setDiagnosis(null);
      }
      showToast("Record purged from vault", "info");
      fetchHistory(); 
    } catch (error) {
      showToast("Failed to delete record", "error");
    }
  };

  const handleResetWorkspace = () => {
    setSelectedImage(null);
    setDiagnosis(null);
    setSelectedRecordId(null);
  };

  const getSeverityColor = (severity) => {
    const s = severity?.toLowerCase();
    if (s === 'healthy') return 'text-emerald-400';
    if (s === 'mild') return 'text-amber-400';
    if (s === 'moderate') return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#1c2e20] via-[#354f33] to-[#8c7343] selection:bg-amber-500/30 selection:text-amber-100 overflow-x-hidden font-sans text-white/90 pb-20">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl bg-black/40 border border-white/20 backdrop-blur-xl shadow-2xl animate-in fade-in slide-in-from-top-3">
          {toastMessage.type === 'success' && <Check size={16} className="text-emerald-400" />}
          {toastMessage.type === 'error' && <AlertTriangle size={16} className="text-red-400" />}
          {toastMessage.type === 'info' && <Leaf size={16} className="text-amber-300" />}
          <span className="text-sm font-light tracking-wide text-white/90">{toastMessage.text}</span>
        </div>
      )}

      {/* Atmospheric Background Glows */}
      <div className="fixed top-[20%] right-[-10%] w-[800px] h-[800px] rounded-full bg-amber-500/15 blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-0 left-[-10%] w-[600px] h-[600px] rounded-full bg-green-900/40 blur-[150px] pointer-events-none z-0" />

      {/* Foreground Container */}
      <div className="relative z-10 flex flex-col min-h-screen max-w-7xl mx-auto">
        <HeroSection totalScans={historyData.length} isAnalyzing={isAnalyzing} />

        {/* Workspace */}
        <div ref={workspaceRef} className="flex flex-col lg:flex-row gap-8 px-6 md:px-12 py-8 min-h-[520px]">
          
          {/* Left Canvas: Upload/View */}
          <div className="w-full lg:w-1/2 flex flex-col gap-4">
            {!selectedImage ? (
              <label 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`flex-1 flex flex-col items-center justify-center border rounded-3xl p-12 cursor-pointer transition-all backdrop-blur-md shadow-xl min-h-[440px] ${
                  isDragging ? 'border-amber-400 bg-amber-400/10 scale-[1.01]' : 'border-dashed border-white/30 bg-white/5 hover:bg-white/10 hover:border-amber-400/50'
                }`}
              >
                <UploadCloud className={`mb-6 transition-transform duration-300 ${isDragging ? 'text-amber-300 scale-110' : 'text-amber-400/80'}`} size={56} strokeWidth={1.5} />
                <span className="text-xl font-light tracking-wide text-white/90">{isDragging ? "Drop Specimen Here" : "Upload or Capture Leaf"}</span>
                <span className="text-sm text-white/50 mt-2 font-light">Drag & drop raw capture or tap to browse</span>
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileUpload} />
              </label>
            ) : (
              <div className="relative flex-1 rounded-3xl overflow-hidden bg-black/20 border border-white/10 backdrop-blur-md shadow-2xl flex items-center justify-center min-h-[440px]">
                <img src={selectedImage} alt="Crop Specimen" className={`w-full h-full object-cover transition-opacity duration-700 ${isAnalyzing ? 'opacity-40 scale-105' : 'opacity-100 scale-100'}`} />
                {isAnalyzing && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm">
                    <ScanLine className="text-amber-400 animate-bounce mb-4" size={56} strokeWidth={1.5} />
                    <span className="text-amber-400/90 tracking-widest uppercase text-sm font-medium animate-pulse">Analyzing Image...</span>
                  </div>
                )}
                {!isAnalyzing && (
                  <button onClick={handleResetWorkspace} className="absolute top-4 left-4 flex items-center gap-2 px-4 py-2 rounded-full bg-black/50 hover:bg-black/70 border border-white/20 text-white font-medium shadow-lg transition-all backdrop-blur-md">
                    <ArrowLeft size={16} /> New Scan
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right Canvas: 5-Point Summary + Details Button */}
          <div className="w-full lg:w-1/2 flex flex-col">
            {!diagnosis ? (
              <div className="flex-1 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md flex flex-col items-center justify-center text-white/40 border-dashed p-10 text-center min-h-[440px]">
                <Leaf size={48} className="mb-4 opacity-50" strokeWidth={1} />
                <p className="text-lg font-light text-white/70">Awaiting specimen feed.</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-3 duration-500">
                <div className="p-6 rounded-3xl bg-white/10 border border-white/20 backdrop-blur-md shadow-xl flex justify-between items-center">
                  <div>
                    <span className="text-xs font-medium uppercase tracking-wider text-white/50 block mb-1">Identified Specimen</span>
                    {/* FIXED: Checks for both key structures */}
                    <h2 className="text-2xl font-semibold text-white drop-shadow-sm">{diagnosis["crop detected"] || diagnosis.crop_detected || "Unknown Species"}</h2>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-medium uppercase tracking-wider text-white/50 block mb-1">Severity Rating</span>
                    <span className={`text-xl font-semibold drop-shadow-sm capitalize ${getSeverityColor(diagnosis.severity)}`}>
                      {diagnosis.severity || "Indeterminate"}
                    </span>
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md shadow-lg">
                  <span className="text-xs font-medium uppercase tracking-wider text-white/50 block mb-3 flex items-center gap-2">
                    <AlertTriangle size={14} className="text-amber-400" /> Primary Pathogen
                  </span>
                  {diagnosis.diseases && diagnosis.diseases.length > 0 ? (
                    <>
                      <h3 className="text-xl font-medium text-amber-200/95 mb-2">{diagnosis.diseases[0].name}</h3>
                      <p className="text-sm text-white/75 font-light leading-relaxed line-clamp-2">{diagnosis.diseases[0].description}</p>
                    </>
                  ) : (
                    <p className="text-sm text-emerald-300/80 font-light">Zero pathogen signatures identified.</p>
                  )}
                </div>

                <div className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md shadow-lg flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-medium uppercase tracking-wider text-white/50 block mb-3 flex items-center gap-2">
                      <ThermometerSun size={14} className="text-amber-400" /> Top Recommended Action
                    </span>
                    {diagnosis.treatments && diagnosis.treatments.length > 0 ? (
                      <>
                        <h3 className="text-lg font-medium text-white/95 mb-2">{diagnosis.treatments[0].treatment_name}</h3>
                        <p className="text-sm text-white/70 font-light leading-relaxed line-clamp-2">{diagnosis.treatments[0].instructions}</p>
                      </>
                    ) : (
                      <p className="text-sm text-white/50 font-light">No action required.</p>
                    )}
                  </div>
                  
                  <button 
                    onClick={() => setShowFullReport(true)}
                    className="mt-6 w-full py-3 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-400/30 text-amber-300 font-medium tracking-wide transition-all backdrop-blur-md flex items-center justify-center gap-2"
                  >
                    <Info size={18} /> View Comprehensive Report
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Archive Timeline */}
        {historyData.length > 0 && (
          <div className="px-6 md:px-12 py-8 mt-6 border-t border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-medium uppercase tracking-wider text-white/50 flex items-center gap-2">
                <Clock size={14} className="text-amber-400" /> Chronological Telemetry Archive
              </h3>
            </div>
            <div className="flex gap-6 overflow-x-auto pb-6 snap-x hide-scrollbar">
              {historyData.map((record) => {
                const isSelected = selectedRecordId === record._id;
                return (
                  <div key={record._id} onClick={() => handleInspectHistory(record)} className={`relative min-w-[280px] w-[280px] flex-shrink-0 snap-start group rounded-3xl border backdrop-blur-sm overflow-hidden shadow-lg transition-all duration-300 cursor-pointer ${isSelected ? 'bg-white/15 border-amber-400/60 shadow-amber-500/10 scale-[1.02]' : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'}`}>
                    <div className="h-40 w-full overflow-hidden bg-black/30 relative">
                      {/* FIXED: Changed item.image_url to record.image_url */}
                      <img src={getValidImageUrl(record.image_url)} alt="Scan Thumbnail" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition duration-500" />
                    </div>
                    <div className="p-4">
                      {/* FIXED: Added support for spaced key */}
                      <span className="block text-sm font-medium text-amber-200/90 mb-1 truncate">{record.diagnosis?.["crop detected"] || record.diagnosis?.crop_detected || 'Unidentified Crop'}</span>
                      <div className="flex justify-between items-center text-xs text-white/50 font-light">
                        <span className="capitalize flex items-center gap-1.5"><CheckCircle2 size={12} className={getSeverityColor(record.diagnosis?.severity)} />{record.diagnosis?.severity || 'Normal'}</span>
                        <span>{new Date(record.analyzed_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <button onClick={(e) => deleteRecord(e, record._id)} className="absolute top-3 right-3 text-white/60 opacity-0 group-hover:opacity-100 transition p-2 bg-black/50 backdrop-blur-md rounded-full hover:text-red-400 hover:bg-black/80 border border-white/15"><Trash2 size={14} /></button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Structured Comprehensive Report Modal */}
      {showFullReport && diagnosis && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-[#1c2e20]/95 border border-white/20 rounded-3xl shadow-2xl hide-scrollbar flex flex-col">
            
            {/* Modal Header */}
            <div className="sticky top-0 bg-[#1c2e20]/90 backdrop-blur-md p-6 sm:p-8 border-b border-white/10 flex justify-between items-start z-10">
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-amber-400/80 mb-1 block">Detailed Agronomic Report</span>
                {/* FIXED: Checks for both key structures */}
                <h2 className="text-3xl font-semibold text-white">{diagnosis["crop detected"] || diagnosis.crop_detected || "Unknown Specimen"}</h2>
                <div className="flex items-center gap-3 mt-3">
                  <span className={`px-3 py-1 rounded-full border bg-black/20 text-xs font-medium uppercase tracking-wider ${getSeverityColor(diagnosis.severity).replace('text-', 'border-').replace('400', '500/30')} ${getSeverityColor(diagnosis.severity)}`}>
                    Severity: {diagnosis.severity || "N/A"}
                  </span>
                </div>
              </div>
              <button onClick={() => setShowFullReport(false)} className="text-white/50 hover:text-white bg-white/5 hover:bg-white/10 p-2.5 rounded-full transition border border-white/10">✕</button>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 flex flex-col gap-8">
              
              {/* Pathologies Section */}
              <section>
                <h3 className="text-sm font-medium uppercase tracking-widest text-white/50 mb-4 flex items-center gap-2">
                  <Stethoscope size={16} className="text-amber-400" /> Identified Pathologies
                </h3>
                {diagnosis.diseases && diagnosis.diseases.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {diagnosis.diseases.map((disease, idx) => (
                      <div key={idx} className="bg-black/20 border border-white/10 rounded-2xl p-5">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="text-lg font-medium text-amber-200">{disease.name}</h4>
                          <span className="text-xs font-mono bg-white/10 px-2 py-1 rounded-md text-white/70">{Math.round(disease.confidence * 100)}% Match</span>
                        </div>
                        <p className="text-sm text-white/70 font-light leading-relaxed">{disease.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-white/60 font-light bg-black/20 p-5 rounded-2xl border border-white/10">No specific diseases identified.</p>
                )}
              </section>

              {/* Treatments Section */}
              <section>
                <h3 className="text-sm font-medium uppercase tracking-widest text-white/50 mb-4 flex items-center gap-2">
                  <ThermometerSun size={16} className="text-amber-400" /> Prescribed Treatments
                </h3>
                {diagnosis.treatments && diagnosis.treatments.length > 0 ? (
                  <div className="space-y-4">
                    {diagnosis.treatments.map((treatment, idx) => (
                      <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col sm:flex-row gap-4">
                        <div className="sm:w-1/4 flex flex-col gap-2">
                          <span className="text-base font-medium text-white/90">{treatment.treatment_name}</span>
                          <div className="flex flex-wrap gap-2">
                            <span className="text-[10px] uppercase tracking-widest text-white/50 px-2 py-1 border border-white/10 rounded bg-black/30">{treatment.treatment_type}</span>
                            <span className={`text-[10px] uppercase tracking-widest px-2 py-1 border rounded bg-black/30 ${treatment.urgency === 'immediate' ? 'border-red-500/30 text-red-400' : 'border-amber-500/30 text-amber-400'}`}>
                              {treatment.urgency.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                        <div className="sm:w-3/4 border-t sm:border-t-0 sm:border-l border-white/10 pt-3 sm:pt-0 sm:pl-5">
                          <p className="text-sm text-white/80 font-light leading-relaxed">{treatment.instructions}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-white/60 font-light bg-black/20 p-5 rounded-2xl border border-white/10">No treatments required.</p>
                )}
              </section>

              {/* Overall Health & Notes */}
              <section className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/10">
                <div>
                  <h3 className="text-sm font-medium uppercase tracking-widest text-white/50 mb-3 flex items-center gap-2">
                    <Activity size={16} className="text-amber-400" /> Overall Health
                  </h3>
                  <p className="text-sm text-white/80 font-light leading-relaxed">{diagnosis.overall_health || "No general health summary provided."}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium uppercase tracking-widest text-white/50 mb-3 flex items-center gap-2">
                    <Info size={16} className="text-amber-400" /> Additional Notes
                  </h3>
                  <p className="text-sm text-white/80 font-light leading-relaxed">{diagnosis.additional_notes || "No supplementary notes provided."}</p>
                </div>
              </section>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}