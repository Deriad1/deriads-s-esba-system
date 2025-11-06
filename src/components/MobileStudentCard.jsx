import React from 'react';

/**
 * Mobile-friendly student card component
 * Replaces table rows on small screens
 */
const MobileStudentCard = ({ student, index, onEdit, onDelete, isSubmitting }) => {
  const studentId = student.id_number || student.idNumber || student.LearnerID || 'N/A';
  const firstName = student.first_name || student.firstName || '';
  const lastName = student.last_name || student.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim() || 'Unknown';
  const className = student.class_name || student.className || 'N/A';
  const gender = (student.gender || student.Gender || 'N/A').toLowerCase();
  const contact = student.phone_number || student.phoneNumber || student.phone || 'N/A';
  const email = student.email || 'No email';

  const initials = `${firstName[0] || '?'}${lastName[0] || '?'}`.toUpperCase();

  const genderColor = gender === 'male'
    ? 'bg-blue-500/30 border-blue-400/50 text-white backdrop-blur-sm'
    : gender === 'female'
    ? 'bg-pink-500/30 border-pink-400/50 text-white backdrop-blur-sm'
    : 'bg-gray-500/30 border-gray-400/50 text-white backdrop-blur-sm';

  return (
    <div className="glass-strong rounded-lg p-4 mb-3 border-l-4 border-blue-500/80 active:bg-white/30 transition-all shadow-lg">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="flex-shrink-0 h-12 w-12 rounded-full bg-gradient-to-br from-blue-500/40 to-purple-500/40 border-2 border-white/40 backdrop-blur-md flex items-center justify-center text-white font-bold shadow-lg">
            {initials}
          </div>

          {/* Name and Number */}
          <div>
            <h3 className="text-base font-bold text-white drop-shadow-md">{fullName}</h3>
            <p className="text-xs text-white/90 font-medium">ID: {studentId}</p>
          </div>
        </div>

        {/* Index number badge */}
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/40 border-2 border-white/50 text-white text-sm font-bold shadow-md backdrop-blur-sm">
          #{index + 1}
        </span>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-white/30">
        {/* Class */}
        <div>
          <p className="text-xs text-white/90 mb-1 font-semibold">Class</p>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-blue-500/30 border-2 border-blue-400/50 text-white backdrop-blur-sm shadow-md">
            {className}
          </span>
        </div>

        {/* Gender */}
        <div>
          <p className="text-xs text-white/90 mb-1 font-semibold">Gender</p>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold border-2 shadow-md ${genderColor}`}>
            {gender === 'male' ? '👦 Male' : gender === 'female' ? '👧 Female' : gender}
          </span>
        </div>

        {/* Contact - Full Width */}
        {contact !== 'N/A' && (
          <div className="col-span-2">
            <p className="text-xs text-white/80 mb-1 font-semibold">Contact</p>
            <a
              href={`tel:${contact}`}
              className="text-sm text-white hover:text-white/80 font-medium flex items-center gap-2"
            >
              📞 {contact}
            </a>
          </div>
        )}

        {/* Email - Full Width */}
        {email !== 'No email' && (
          <div className="col-span-2">
            <p className="text-xs text-white/80 mb-1 font-semibold">Email</p>
            <a
              href={`mailto:${email}`}
              className="text-sm text-white hover:text-white/80 font-medium flex items-center gap-2 truncate"
            >
              ✉️ {email}
            </a>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {(onEdit || onDelete) && (
        <div className="flex gap-2 mt-4 pt-4 border-t border-white/20">
          {onEdit && (
            <button
              onClick={() => onEdit(student)}
              disabled={isSubmitting}
              className="flex-1 bg-blue-500/90 hover:bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-bold border-2 border-white/50 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              style={{ minHeight: '44px' }}
            >
              ✏️ Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(student)}
              disabled={isSubmitting}
              className="flex-1 bg-red-500/90 hover:bg-red-600 text-white px-4 py-2.5 rounded-lg text-sm font-bold border-2 border-white/50 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              style={{ minHeight: '44px' }}
            >
              🗑️ Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default MobileStudentCard;
