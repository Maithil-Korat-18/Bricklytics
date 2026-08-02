import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { UploadCloud, Image as ImageIcon, FileText, X, Star } from 'lucide-react';

export default function ImageUploader() {
  const { control, setValue, getValues, formState: { errors } } = useFormContext();

  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-card-soft space-y-6">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-lg font-bold text-slate-900">7. Property Media & Documents</h2>
        <p className="text-xs text-slate-400 mt-0.5">High-resolution photos, floor plan, and brochure PDF</p>
      </div>

      <Controller
        name="images"
        control={control}
        render={({ field: { value = [], onChange } }) => (
          <Controller
            name="coverIndex"
            control={control}
            render={({ field: { value: coverIdx = 0, onChange: setCoverIdx } }) => {
              const handleDrop = (e) => {
                e.preventDefault();
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  const files = Array.from(e.dataTransfer.files);
                  const filesArray = files.map(file => URL.createObjectURL(file));
                  setValue('rawImageFiles', [...(getValues('rawImageFiles') || []), ...files]);
                  onChange([...value, ...filesArray].slice(0, 10));
                }
              };

              const handleFileChange = (e) => {
                if (e.target.files && e.target.files.length > 0) {
                  const files = Array.from(e.target.files);
                  const filesArray = files.map(file => URL.createObjectURL(file));
                  setValue('rawImageFiles', [...(getValues('rawImageFiles') || []), ...files]);
                  onChange([...value, ...filesArray].slice(0, 10));
                }
              };

              const handleRemove = (idxToRemove) => {
                const updated = value.filter((_, idx) => idx !== idxToRemove);
                const rawFiles = getValues('rawImageFiles') || [];
                if (idxToRemove < rawFiles.length) setValue('rawImageFiles', rawFiles.filter((_, idx) => idx !== idxToRemove));
                onChange(updated);
                if (coverIdx === idxToRemove) setCoverIdx(0);
              };

              return (
                <div className="space-y-4">
                  {/* Drag & Drop Area */}
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed p-8 rounded-2xl text-center transition-all cursor-pointer group ${
                      errors.images 
                        ? 'border-red-500 bg-red-50/20' 
                        : 'border-slate-200 hover:border-blue-500 bg-slate-50/50 hover:bg-blue-50/20'
                    }`}
                  >
                    <input
                      type="file"
                      id="image-upload-input"
                      multiple
                      accept="image/png, image/jpeg, image/webp"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <label htmlFor="image-upload-input" className="cursor-pointer">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-semibold text-slate-800">
                        Click to upload <span className="text-slate-400 font-normal">or drag & drop images</span>
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        JPG, PNG, WEBP up to 5MB (Max 10 images)
                      </p>
                    </label>
                  </div>

                  {errors.images && (
                    <p className="text-xs text-red-500 font-medium animate-fadeIn">
                      {errors.images.message}
                    </p>
                  )}

                  {/* Thumbnail Grid */}
                  {value.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Uploaded Photos ({value.length}/10)
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {value.map((imgUrl, index) => (
                          <div key={index} className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-video bg-slate-100">
                            <img src={imgUrl} alt={`Upload ${index}`} className="w-full h-full object-cover" />
                            
                            {coverIdx === index ? (
                              <span className="absolute top-2 left-2 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                                <Star className="w-3 h-3 fill-current" /> Cover
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setCoverIdx(index)}
                                className="absolute top-2 left-2 bg-black/60 hover:bg-blue-600 text-white text-[10px] font-medium px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                Set Cover
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleRemove(index)}
                              className="absolute top-2 right-2 p-1 rounded-full bg-black/60 hover:bg-red-600 text-white transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            }}
          />
        )}
      />

      {/* Auxiliary Documents */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">Floor Plan Image</div>
              <div className="text-[11px] text-slate-400">Optional layout schematic</div>
            </div>
          </div>
          <button type="button" className="px-3 py-1.5 text-xs font-semibold text-blue-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            Upload
          </button>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800">Brochure PDF</div>
              <div className="text-[11px] text-slate-400">PDF up to 20MB</div>
            </div>
          </div>
          <button type="button" className="px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            Upload
          </button>
        </div>
      </div>
    </div>
  );
}
