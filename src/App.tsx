import { useState } from 'react';
import { Upload, Activity, AlertCircle, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface ProcessingStep {
  step: string;
  completed: boolean;
  duration: number;
}

interface DetectionResult {
  status: string;
  title: string;
  message: string;
  confidence: number;
  color: string;
  processingSteps?: ProcessingStep[];
}

interface ApiResponse {
  success: boolean;
  data?: {
    id: number;
    images: string[];
    result: DetectionResult;
    timestamp: string;
  };
  error?: string;
}

function App() {
  const [image1, setImage1] = useState<File | null>(null);
  const [image2, setImage2] = useState<File | null>(null);
  const [preview1, setPreview1] = useState<string>('');
  const [preview2, setPreview2] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [error, setError] = useState<string>('');
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const handleImageChange = (
    file: File | null,
    setImage: (file: File | null) => void,
    setPreview: (preview: string) => void
  ) => {
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImage(null);
      setPreview('');
    }
  };

  const handleSubmit = async () => {
    if (!image1 || !image2) {
      setError('Please upload both images before detecting');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);
    setProcessingSteps([]);
    setCurrentStepIndex(0);

    const defaultSteps: ProcessingStep[] = [
      { step: 'Initializing Analysis Engine', completed: false, duration: 0 },
      { step: 'Recognizing Crop Images', completed: false, duration: 0 },
      { step: 'Detecting Crop Features', completed: false, duration: 0 },
      { step: 'Analyzing for Disease Markers', completed: false, duration: 0 },
    ];

    setProcessingSteps(defaultSteps);

    const stepTimings = [2000, 3000, 4000, 6000];
    let cumulativeTime = 0;

    const stepIntervals = stepTimings.map((timing, index) => {
      cumulativeTime += timing;
      return setTimeout(() => {
        setCurrentStepIndex(index + 1);
      }, cumulativeTime);
    });

    const formData = new FormData();
    formData.append('images', image1);
    formData.append('images', image2);

    try {
      const response = await fetch('http://localhost:3001/api/detect', {
        method: 'POST',
        body: formData,
      });

      const data: ApiResponse = await response.json();

      if (data.success && data.data) {
        const backendSteps = data.data.result.processingSteps || defaultSteps;
        setProcessingSteps(
          backendSteps.map(s => ({
            ...s,
            completed: true,
          }))
        );
        setCurrentStepIndex(backendSteps.length);
        setResult(data.data.result);
      } else {
        setError(data.error || 'Detection failed');
      }
    } catch (err) {
      setError('Failed to connect to server. Please ensure backend is running.');
    } finally {
      setLoading(false);
      stepIntervals.forEach(interval => clearTimeout(interval));
    }
  };

  const resetForm = () => {
    setImage1(null);
    setImage2(null);
    setPreview1('');
    setPreview2('');
    setResult(null);
    setError('');
    setProcessingSteps([]);
    setCurrentStepIndex(0);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-16 h-16 text-green-500" />;
      case 'critical':
        return <XCircle className="w-16 h-16 text-red-500" />;
      case 'invalid':
        return <AlertCircle className="w-16 h-16 text-red-500" />;
      default:
        return <AlertCircle className="w-16 h-16 text-yellow-500" />;
    }
  };

  const getStatusColor = (color: string) => {
    const colors: Record<string, string> = {
      green: 'bg-green-50 border-green-200',
      red: 'bg-red-50 border-red-200',
      yellow: 'bg-yellow-50 border-yellow-200',
      orange: 'bg-orange-50 border-orange-200',
      blue: 'bg-blue-50 border-blue-200',
    };
    return colors[color] || 'bg-gray-50 border-gray-200';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <Activity className="w-12 h-12 text-blue-600 mr-3" />
              <h1 className="text-5xl font-bold text-gray-800">
                Disease Detection System
              </h1>
            </div>
            <p className="text-gray-600 text-lg">
              Upload two medical images for AI-powered disease analysis
            </p>
            <div className="mt-4 inline-block bg-yellow-100 border border-yellow-300 rounded-lg px-4 py-2">
              <p className="text-sm text-yellow-800">
                ⚠️ Demo Only - Simulated AI Responses (Not Real Medical Diagnosis)
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Sample Image 1
                </label>
                <div
                  className={`relative border-2 border-dashed rounded-xl p-6 transition-all ${
                    preview1
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
                  }`}
                >
                  {preview1 ? (
                    <div className="relative">
                      <img
                        src={preview1}
                        alt="Preview 1"
                        className="w-full h-64 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => handleImageChange(null, setImage1, setPreview1)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer block text-center">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <span className="text-gray-600 text-sm font-medium">
                        Click to upload or drag and drop
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          handleImageChange(
                            e.target.files?.[0] || null,
                            setImage1,
                            setPreview1
                          )
                        }
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Sample Image 2
                </label>
                <div
                  className={`relative border-2 border-dashed rounded-xl p-6 transition-all ${
                    preview2
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
                  }`}
                >
                  {preview2 ? (
                    <div className="relative">
                      <img
                        src={preview2}
                        alt="Preview 2"
                        className="w-full h-64 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => handleImageChange(null, setImage2, setPreview2)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer block text-center">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <span className="text-gray-600 text-sm font-medium">
                        Click to upload or drag and drop
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          handleImageChange(
                            e.target.files?.[0] || null,
                            setImage2,
                            setPreview2
                          )
                        }
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            )}

            {loading && processingSteps.length > 0 && (
              <div className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-center mb-4">
                  <Loader2 className="w-5 h-5 text-blue-600 mr-2 animate-spin" />
                  <h3 className="text-lg font-semibold text-gray-800">
                    Analysis in Progress
                  </h3>
                </div>
                <div className="space-y-3">
                  {processingSteps.map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center bg-gray-200">
                        {index < currentStepIndex ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : index === currentStepIndex ? (
                          <div className="w-3 h-3 rounded-full bg-blue-600 animate-pulse" />
                        ) : (
                          <div className="w-3 h-3 rounded-full bg-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p
                          className={`text-sm font-medium ${
                            index < currentStepIndex
                              ? 'text-gray-600'
                              : index === currentStepIndex
                                ? 'text-blue-600'
                                : 'text-gray-400'
                          }`}
                        >
                          {item.step}
                        </p>
                      </div>
                      {index < currentStepIndex && (
                        <span className="text-xs text-green-600 font-semibold">
                          Complete
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(currentStepIndex / processingSteps.length) * 100}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={handleSubmit}
                disabled={loading || !image1 || !image2}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95 shadow-lg"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Analyzing...
                  </span>
                ) : (
                  'Detect Disease'
                )}
              </button>
              {(image1 || image2 || result) && (
                <button
                  onClick={resetForm}
                  className="px-6 py-4 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {result && (
            <div
              className={`${getStatusColor(
                result.color
              )} border-2 rounded-2xl p-8 shadow-xl animate-fadeIn`}
            >
              <div className="text-center">
                <div className="flex justify-center mb-6">
                  {getStatusIcon(result.status)}
                </div>
                <h2 className="text-3xl font-bold text-gray-800 mb-3">
                  {result.title}
                </h2>
                <p className="text-gray-700 text-lg mb-6">{result.message}</p>

                {result.processingSteps && (
                  <div className="mb-8 bg-white rounded-lg p-4 border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">
                      Analysis Steps Performed
                    </h3>
                    <div className="space-y-2 text-left">
                      {result.processingSteps.map((step, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 text-sm text-gray-600"
                        >
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span>{step.step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <div className="bg-white rounded-lg px-6 py-3 shadow-md w-full sm:w-auto">
                    <p className="text-sm text-gray-600 mb-1">Confidence Level</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {result.confidence}%
                    </p>
                  </div>
                  <div className="bg-white rounded-lg px-6 py-3 shadow-md w-full sm:w-auto">
                    <p className="text-sm text-gray-600 mb-1">Analysis Status</p>
                    <p className="text-2xl font-bold text-gray-800 capitalize">
                      {result.status === 'invalid' ? 'Invalid' : result.status}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}

export default App;
