import React, { useState } from 'react';
import { BsX, BsCamera } from 'react-icons/bs';

const CreateGroupModal = ({ isOpen, onClose, onCreateGroup, contacts }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [groupPicture, setGroupPicture] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  if (!isOpen) return null;

  const handleToggleUser = (userId) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setGroupPicture(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || selectedUserIds.length === 0) return;

    onCreateGroup({
      name,
      description,
      memberIds: selectedUserIds,
      groupPicture,
    });

    setName('');
    setDescription('');
    setSelectedUserIds([]);
    setGroupPicture(null);
    setPreviewUrl(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#111b21] border border-[#222d34] w-full max-w-md rounded-2xl shadow-2xl p-6 text-gray-100 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <BsX size={24} />
        </button>

        <h3 className="text-xl font-bold mb-4 text-teal-400">Create New Group</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar Upload */}
          <div className="flex justify-center">
            <label className="relative w-20 h-20 rounded-full bg-gray-800 border-2 border-dashed border-gray-600 flex items-center justify-center cursor-pointer overflow-hidden hover:border-teal-400">
              {previewUrl ? (
                <img src={previewUrl} alt="Group Preview" className="w-full h-full object-cover" />
              ) : (
                <BsCamera size={24} className="text-gray-400" />
              )}
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">Group Subject</label>
            <input
              type="text"
              required
              placeholder="e.g. Project Alpha"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#202c33] border border-[#222d34] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500 text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">Description (optional)</label>
            <textarea
              placeholder="Group topic or rules..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full bg-[#202c33] border border-[#222d34] rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-teal-500 text-white"
            />
          </div>

          {/* Member Selection */}
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">Select Participants</label>
            <div className="max-h-40 overflow-y-auto space-y-1 bg-[#202c33] p-2 rounded-xl border border-[#222d34]">
              {contacts && contacts.length > 0 ? (
                contacts.map((contact) => {
                  const isSelected = selectedUserIds.includes(contact.id);
                  return (
                    <div
                      key={contact.id}
                      onClick={() => handleToggleUser(contact.id)}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer ${
                        isSelected ? 'bg-teal-900/40 text-teal-300' : 'hover:bg-gray-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gray-700 font-bold flex items-center justify-center text-xs uppercase">
                          {contact.username?.charAt(0)}
                        </div>
                        <span className="text-sm font-medium">{contact.fullName || contact.username}</span>
                      </div>
                      <input type="checkbox" checked={isSelected} readOnly className="accent-teal-500" />
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-gray-500 text-center py-3">No contacts available to add</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || selectedUserIds.length === 0}
              className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition-colors"
            >
              Create Group
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;
