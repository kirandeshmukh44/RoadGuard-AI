import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowRight, Camera, CheckCircle2, Crosshair, ImagePlus, MapPin, Navigation, ShieldCheck, Upload, X } from 'lucide-react';
import { potholeAPI } from '../api';

const initialForm = { latitude: '', longitude: '', road_name: '', description: '', severity: 'medium' };

const Report = () => {
  const [formData, setFormData] = useState(initialForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => () => { if (imagePreview) URL.revokeObjectURL(imagePreview); }, [imagePreview]);

  const handleChange = (event) => setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));

  const getCurrentLocation = () => {
    if (!navigator.geolocation) { setError('Location is not available in this browser. Enter the coordinates manually.'); return; }
    setLocating(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => { setFormData((current) => ({ ...current, latitude: coords.latitude.toFixed(6), longitude: coords.longitude.toFixed(6) })); setLocating(false); },
      () => { setError('Could not get your location. Allow location access or enter the coordinates manually.'); setLocating(false); },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 },
    );
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;
    if (!['image/jpeg', 'image/png'].includes(selectedFile.type)) { setError('Choose a JPG or PNG image.'); event.target.value = ''; return; }
    if (selectedFile.size > 10 * 1024 * 1024) { setError('Image must be smaller than 10 MB.'); event.target.value = ''; return; }
    setError('');
    setImageFile(selectedFile);
    setImagePreview(URL.createObjectURL(selectedFile));
  };

  const clearImage = () => { setImageFile(null); setImagePreview(''); if (fileInputRef.current) fileInputRef.current.value = ''; };

  const openMyReports = () => navigate('/my-reports');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true); setError(''); setSuccess(false);
    const latitude = Number(formData.latitude);
    const longitude = Number(formData.longitude);
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      setError('Enter valid coordinates (latitude −90 to 90, longitude −180 to 180).'); setLoading(false); return;
    }
    try {
      const payload = new FormData();
      payload.append('latitude', String(latitude)); payload.append('longitude', String(longitude));
      payload.append('road_name', formData.road_name.trim()); payload.append('description', formData.description.trim());
      payload.append('severity', formData.severity); payload.append('confidence', '0.8');
      if (imageFile) payload.append('file', imageFile);
      await potholeAPI.create(payload);
      setSuccess(true); setFormData(initialForm); clearImage();
    } catch (requestError) {
      setError(requestError.response?.data?.detail || (requestError.code === 'ERR_NETWORK'
        ? 'Could not connect to the server. Check that the User app backend is running, then try again.'
        : 'Your report could not be submitted. Please try again.'));
    } finally { setLoading(false); }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-7 pb-10">
      <motion.header initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold tracking-wide text-blue-700"><MapPin className="h-4 w-4" /> COMMUNITY ROAD SAFETY</div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">Report a pothole</h1>
        <p className="mt-2 max-w-2xl text-slate-600">Share the location and condition so the road maintenance team can review it.</p>
      </motion.header>

      {success && <div role="status" className="flex flex-col gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 sm:flex-row sm:items-center"><CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-600" /><div className="flex-1"><p className="font-bold">Report submitted</p><p className="mt-0.5 text-sm text-emerald-800">Your report is saved and available in My Reports.</p></div><Link to="/my-reports" className="inline-flex items-center gap-2 text-sm font-bold text-emerald-800 hover:underline">View reports <ArrowRight className="h-4 w-4" /></Link></div>}
      {error && <div role="alert" className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />{error}</div>}

      {!success && <motion.form initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_0.78fr]">
        <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div><h2 className="text-lg font-bold text-slate-900">Location and details</h2><p className="mt-1 text-sm text-slate-500">Coordinates help the team locate the issue precisely.</p></div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3"><label className="text-sm font-semibold text-slate-700">GPS coordinates <span className="text-rose-500">*</span></label><button type="button" onClick={getCurrentLocation} disabled={locating} className="inline-flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 disabled:opacity-60"><Navigation className={`h-4 w-4 ${locating ? 'animate-pulse' : ''}`} />{locating ? 'Finding…' : 'Use my location'}</button></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block"><span className="sr-only">Latitude</span><input type="number" step="any" min="-90" max="90" name="latitude" placeholder="Latitude" value={formData.latitude} onChange={handleChange} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100" required /></label>
              <label className="block"><span className="sr-only">Longitude</span><input type="number" step="any" min="-180" max="180" name="longitude" placeholder="Longitude" value={formData.longitude} onChange={handleChange} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100" required /></label>
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500"><Crosshair className="h-3.5 w-3.5" />GPS access works on localhost or a secure connection.</p>
          </div>

          <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">Road or area name</span><input type="text" name="road_name" maxLength="200" placeholder="e.g. Station Road, near the bus stop" value={formData.road_name} onChange={handleChange} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100" /></label>

          <div><label htmlFor="severity" className="mb-2 block text-sm font-semibold text-slate-700">How severe is the damage?</label><select id="severity" name="severity" value={formData.severity} onChange={handleChange} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"><option value="low">Low — minor damage</option><option value="medium">Medium — needs attention</option><option value="high">High — urgent safety risk</option></select></div>

          <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-700">What should the team know?</span><textarea name="description" rows="4" maxLength="1000" placeholder="Describe the pothole, nearby landmarks, or any danger to traffic…" value={formData.description} onChange={handleChange} className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100" /><span className="mt-1 block text-right text-xs text-slate-400">{formData.description.length}/1000</span></label>
        </section>

        <aside className="space-y-5">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><h2 className="text-lg font-bold text-slate-900">Add a photo <span className="text-sm font-medium text-slate-400">(optional)</span></h2><p className="mt-1 text-sm text-slate-500">A clear photo helps confirm the road condition.</p>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png" onChange={handleFileChange} className="sr-only" id="report-image" />
            {imagePreview ? <div className="relative mt-4 overflow-hidden rounded-2xl border border-slate-200"><img src={imagePreview} alt="Pothole report preview" className="h-60 w-full object-cover" /><button type="button" onClick={clearImage} aria-label="Remove image" className="absolute right-3 top-3 rounded-full bg-slate-950/75 p-2 text-white hover:bg-slate-950"><X className="h-4 w-4" /></button><div className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-slate-950/80 to-transparent px-4 pb-3 pt-8 text-sm font-medium text-white">{imageFile?.name}</div></div> : <label htmlFor="report-image" className="mt-4 flex min-h-52 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center transition hover:border-blue-300 hover:bg-blue-50/60"><div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm"><ImagePlus className="h-6 w-6" /></div><span className="text-sm font-bold text-slate-800">Choose a photo</span><span className="mt-1 text-xs text-slate-500">JPG or PNG, up to 10 MB</span><span className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700"><Upload className="h-3.5 w-3.5" /> Browse files</span></label>}
          </section>

          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4"><div className="flex gap-3"><div className="rounded-lg bg-white p-2 text-blue-700"><ShieldCheck className="h-5 w-5" /></div><div><p className="text-sm font-bold text-blue-950">Your report goes to the review queue</p><p className="mt-1 text-xs leading-5 text-blue-900/70">Add accurate location details. You can check its status from your report history.</p></div></div></div>

          <button type="submit" disabled={loading || locating} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-65">{loading ? <><span className="loading loading-spinner loading-sm" />Submitting report…</> : <><Camera className="h-5 w-5" />Submit report</>}</button>
          <p className="text-center text-xs text-slate-500">Location is required. Photo and description are optional.</p>
        </aside>
      </motion.form>}
      {success && <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"><CheckCircle2 className="h-7 w-7" /></div><h2 className="mt-4 text-xl font-bold text-slate-900">Thanks for helping make roads safer.</h2><p className="mx-auto mt-2 max-w-md text-sm text-slate-500">Your report has been submitted. Check your report history for the generated PDF and status.</p><button type="button" onClick={openMyReports} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700">Go to My Reports <ArrowRight className="h-4 w-4" /></button></div>}
    </div>
  );
};

export default Report;
