import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({ isOpen, onClose }) => {
  const [name, setName] = useState('Alex Mercer');
  const [email, setEmail] = useState('alexmercer@acme.io');
  const [bio, setBio] = useState('Senior Security Engineer focused on application security and cryptography.');

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-md animate-apple-fade p-4" onClick={onClose}>
      <div 
        className="relative bg-[#16171d] border border-[#232530] rounded-3xl shadow-2xl w-full max-w-[440px] overflow-hidden animate-apple-scale"
        onClick={(e) => e.stopPropagation()}
      >
        
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-medium text-white tracking-tight">Edit Profile</h2>
            <button 
              onClick={onClose} 
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors z-10 cursor-pointer shrink-0 -mr-2"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
          
          {/* Avatar Section */}
          <div className="flex items-center gap-5 mb-8">
            <div className="relative group cursor-pointer">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-600 to-[#c0f200] flex items-center justify-center text-black font-bold text-xl shadow-inner">
                AM
              </div>
              <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <PhotoIcon className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <button className="text-sm font-medium text-[#c0f200] hover:text-[#a6d100] transition-colors bg-[#c0f200]/10 px-3 py-1.5 rounded-lg border border-[#c0f200]/20">
                Change Photo
              </button>
              <p className="text-[11px] text-zinc-500 mt-1">JPG, GIF or PNG. 1MB max.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5 block">Full Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#121319] border border-[#2d3340] rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-[#c0f200]/50 focus:ring-1 focus:ring-[#c0f200]/50 transition-all shadow-inner"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5 block">Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#121319] border border-[#2d3340] rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-[#c0f200]/50 focus:ring-1 focus:ring-[#c0f200]/50 transition-all shadow-inner"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5 block">Bio</label>
              <textarea 
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="w-full bg-[#121319] border border-[#2d3340] rounded-xl px-4 py-2.5 text-sm text-zinc-200 focus:outline-none focus:border-[#c0f200]/50 focus:ring-1 focus:ring-[#c0f200]/50 transition-all shadow-inner resize-none"
              />
            </div>
          </div>
        </div>

        <div className="bg-[#121319] border-t border-[#232530] p-4 flex items-center justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-zinc-300 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={onClose}
            className="px-5 py-2.5 bg-[#c0f200] hover:bg-[#a6d100] text-black font-semibold rounded-xl text-sm transition-colors shadow-md animate-apple-scale"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
