import { useState, useRef } from 'react';
import { potholeAPI } from '../api';
import { motion } from 'framer-motion';
import {
  Upload,
  Image as ImageIcon,
  Video,
  MapPin,
  Navigation,
  Search,
  RotateCcw,
  Loader2,
  AlertCircle,
  CheckCircle2,
  FileImage,
  X,
  Layers,
  Scan,
  Globe
} from 'lucide-react';

const Detect = () => {
  const [mode, setMode] = useState('single');
  const [file, setFile] = useState(null);
  const [files, setFiles] = useState([]);
  const [preview, setPreview] = useState(null);
  const [previews, setPreviews] = useState([]);
  const [fileType, setFileType] = useState('image');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [batchResults, setBatchResults] = useState([]);
  const [error, setError] = useState('');
  const [location, setLocation] = useState({ latitude: '', longitude: '' });
  const [roadName, setRoadName] = useState('');
  const fileInputRef = useRef(null);
  const batchFileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;

    if (mode === 'single') {
      const selectedFile = selectedFiles[0];
      const type = selectedFile.type.startsWith('video/') ? 'video' : 'image';
      setFileType(type);
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    } else {
      const imageFiles = selectedFiles.filter(f => f.type.startsWith('image/'));
      if (imageFiles.length === 0) {
        setError('Please select image files for batch detection');
        return;
      }
      if (imageFiles.length > 20) {
        setError('Maximum 20 images per batch');
        return;
      }
      setFiles(imageFiles);
      setPreviews(imageFiles.map(f => URL.createObjectURL(f)));
    }
    setResult(null);
    setBatchResults([]);
    setError('');
  };

  const handleBatchFileChange = (e) => {
    handleFileChange(e);
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          setError('Could not get your location. Please enter manually.');
        }
      );
    } else {
      setError('Geolocation is not supported by your browser.');
    }
  };

  const handleDetect = async (e) => {
    e.preventDefault();
    
    if (mode === 'single') {
      if (!file) {
        setError('Please select an image or video first');
        return;
      }
    } else {
      if (files.length === 0) {
        setError('Please select images for batch detection');
        return;
      }
    }

    if (!location.latitude || !location.longitude) {
      setError('Add the pothole location first. Reports without GPS coordinates cannot appear on the shared road map.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);
    setBatchResults([]);

    try {
      if (mode === 'single') {
        const formData = new FormData();
        formData.append('file', file);
        if (location.latitude) formData.append('latitude', location.latitude);
        if (location.longitude) formData.append('longitude', location.longitude);
        if (roadName) formData.append('road_name', roadName);

        const endpoint = fileType === 'video' ? 'detectVideo' : 'detect';
        const response = await potholeAPI[endpoint](formData);
        setResult(response.data);
      } else {
        const formData = new FormData();
        files.forEach(f => formData.append('files', f));
        if (location.latitude) formData.append('latitude', location.latitude);
        if (location.longitude) formData.append('longitude', location.longitude);
        if (roadName) formData.append('road_name', roadName);

        const response = await potholeAPI.detectBatch(formData);
        setBatchResults(response.data.results || []);
        setResult({
          potholes_detected: response.data.results?.reduce((sum, r) => sum + r.potholes_detected, 0) || 0,
          message: `Batch processed: ${response.data.total_processed} images`
        });
      }
    } catch (error) {
      setError(error.response?.data?.detail || 'Detection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setFiles([]);
    setPreview(null);
    setPreviews([]);
    setResult(null);
    setBatchResults([]);
    setError('');
    setLocation({ latitude: '', longitude: '' });
    setRoadName('');
    setFileType('image');
    setMode('single');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (batchFileInputRef.current) {
      batchFileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            AI Pothole Detection
          </h1>
          <p className="text-gray-600">Upload a road image or video to detect potholes using our AI model</p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Upload className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Upload Image or Video</h2>
            </div>

            {/* Mode Selector */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">Detection Mode</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setMode('single')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
                    mode === 'single'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <ImageIcon className="w-5 h-5" />
                  <span className="font-medium">Single File</span>
                </button>
                <button
                  onClick={() => setMode('batch')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
                    mode === 'batch'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <Layers className="w-5 h-5" />
                  <span className="font-medium">Batch (Multiple)</span>
                </button>
              </div>
            </div>

            {/* File Upload */}
            {mode === 'single' && (
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">Select File</label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,video/mp4,video/avi,video/mov"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer"
                  >
                    <div className="flex flex-col items-center">
                      <Upload className="w-12 h-12 text-gray-400 mb-3" />
                      <p className="text-gray-600 font-medium mb-1">
                        {file ? file.name : 'Click to upload or drag and drop'}
                      </p>
                      <p className="text-sm text-gray-400">
                        JPEG, PNG (max 10MB) | MP4, AVI, MOV (max 50MB)
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {mode === 'single' && preview && (
              <div className="mb-6">
                {fileType === 'video' ? (
                  <video src={preview} controls className="w-full h-64 object-cover rounded-xl" />
                ) : (
                  <img src={preview} alt="Preview" className="w-full h-64 object-cover rounded-xl" />
                )}
              </div>
            )}

            {mode === 'batch' && (
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">Select Images (Max 20)</label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
                  <input
                    ref={batchFileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={handleBatchFileChange}
                    multiple
                    className="hidden"
                    id="batch-upload"
                  />
                  <label
                    htmlFor="batch-upload"
                    className="cursor-pointer"
                  >
                    <div className="flex flex-col items-center">
                      <Layers className="w-12 h-12 text-gray-400 mb-3" />
                      <p className="text-gray-600 font-medium mb-1">
                        {files.length > 0 ? `${files.length} files selected` : 'Click to upload multiple images'}
                      </p>
                      <p className="text-sm text-gray-400">
                        JPEG, PNG (max 10MB each, max 20 files)
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {mode === 'batch' && previews.length > 0 && (
              <div className="mb-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-64 overflow-y-auto">
                  {previews.map((previewUrl, index) => (
                    <div key={index} className="relative group">
                      <img src={previewUrl} alt={`Preview ${index + 1}`} className="w-full h-32 object-cover rounded-xl" />
                      <button
                        type="button"
                        onClick={() => {
                          const newFiles = [...files];
                          newFiles.splice(index, 1);
                          setFiles(newFiles);
                          const newPreviews = [...previews];
                          newPreviews.splice(index, 1);
                          setPreviews(newPreviews);
                        }}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Location Details */}
            <div className="border-t border-gray-200 pt-6 mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                GPS Coordinates
              </label>
              <p className="mb-3 text-xs text-gray-500">Add the road location where this image or video was recorded. Only GPS-tagged reports can be shown to nearby users on the map.</p>
              <div className="flex gap-3">
                <div className="flex-1">
                  <input
                    type="number"
                    step="any"
                    placeholder="Latitude"
                    value={location.latitude}
                    onChange={(e) => setLocation({ ...location, latitude: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="number"
                    step="any"
                    placeholder="Longitude"
                    value={location.longitude}
                    onChange={(e) => setLocation({ ...location, longitude: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  className="px-4 py-3 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-200 transition-colors"
                  title="Get current location"
                >
                  <Navigation className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">Road Name (Optional)</label>
              <input
                type="text"
                placeholder="e.g., Main Street"
                value={roadName}
                onChange={(e) => setRoadName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={handleDetect}
                disabled={loading || (mode === 'single' && !file) || (mode === 'batch' && files.length === 0)}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{mode === 'batch' ? 'Processing Batch...' : 'Detecting...'}</span>
                  </>
                ) : (
                  <>
                    <Scan className="w-5 h-5" />
                    <span>{mode === 'batch' ? 'Detect Potholes (Batch)' : 'Detect Potholes'}</span>
                  </>
                )}
              </button>
              <button
                onClick={resetForm}
                className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
              >
                <RotateCcw className="w-5 h-5" />
                <span>Reset</span>
              </button>
            </div>
          </motion.div>

          {/* Results Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <Search className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Detection Results</h2>
            </div>

            {loading && (
              <div className="text-center py-12">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">
                  {mode === 'batch' ? 'Processing batch with AI model...' : 
                   fileType === 'video' ? 'Analyzing video with AI model...' : 
                   'Analyzing image with AI model...'}
                </p>
              </div>
            )}

            {!result && !loading && (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500">Upload an image to see detection results</p>
              </div>
            )}

            {result && !loading && (
              <div className="space-y-6">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <span className="text-sm text-blue-700">{result.message}</span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <div className="text-sm text-gray-500 mb-1">{result.detection_method === 'ai_video' ? 'Most in one frame' : 'Potholes Detected'}</div>
                    <div className="text-3xl font-bold text-gray-900">{result.potholes_detected}</div>
                    {result.detection_method === 'ai_video' && <div className="mt-1 text-xs text-gray-500">{result.detections_across_frames || 0} detections across {result.frames_processed || 0} sampled frames</div>}
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <div className="text-sm text-gray-500 mb-1">Confidence</div>
                    <div className="text-3xl font-bold text-gray-900">{(result.confidence * 100).toFixed(1)}%</div>
                  </div>
                </div>
                {result.severity_basis && <p className="text-xs leading-5 text-gray-500">Severity is a visual estimate from visible pothole area and how many appear together. Video is sampled at about one frame per second. {result.severity_basis}</p>}

                {/* Severity */}
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="text-sm text-gray-500 mb-2">Severity Level</div>
                  <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
                    result.severity === 'high' ? 'bg-red-100 text-red-700' :
                    result.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {result.severity?.toUpperCase()}
                  </span>
                </div>

                {/* Batch Results Table */}
                {mode === 'batch' && batchResults.length > 0 && (
                  <div className="overflow-hidden border border-gray-200 rounded-xl">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">#</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Image</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Potholes</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Severity</th>
                          <th className="px-4 py-3 text-left font-semibold text-gray-700">Confidence</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {batchResults.map((batchResult, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-gray-900">{index + 1}</td>
                            <td className="px-4 py-3 text-gray-600 font-mono text-xs">
                              {batchResult.image_path?.split('/').pop() || 'N/A'}
                            </td>
                            <td className="px-4 py-3 text-gray-900">{batchResult.potholes_detected}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                                batchResult.severity === 'high' ? 'bg-red-100 text-red-700' :
                                batchResult.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                {batchResult.severity?.toUpperCase() || 'N/A'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-900">
                              {batchResult.confidence ? (batchResult.confidence * 100).toFixed(1) + '%' : 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Detected Image */}
                {result.annotated_image_path && (
                  <div>
                    <div className="text-sm font-semibold text-gray-700 mb-3">Detected Image (with Bounding Boxes)</div>
                    <img
                      src={`${import.meta.env.VITE_API_URL || 'http://localhost:8005'}${result.annotated_image_path}`}
                      alt="Detected with Bounding Boxes"
                      className="w-full h-64 object-cover rounded-xl"
                    />
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Detect;
