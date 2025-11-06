import React from 'react';

/**
 * Mobile-friendly teacher card component
 * Replaces table rows on small screens
 */
const MobileTeacherCard = ({ teacher, isSelected, onSelect, onEdit, onResetPassword, onDelete }) => {
  const firstName = teacher.first_name || '';
  const lastName = teacher.last_name || '';
  const fullName = `${firstName} ${lastName}`.trim() || 'Unknown';
  const email = teacher.email || 'No email';
  const gender = teacher.gender || 'Not specified';
  const subjects = teacher.subjects?.length > 0 ? teacher.subjects.join(', ') : 'None';
  const classes = teacher.classes?.length > 0 ? teacher.classes.join(', ') : 'None';

  const initials = `${firstName[0] || '?'}${lastName[0] || '?'}`.toUpperCase();

  // Get primary role display
  const role = teacher.all_roles?.[0] || teacher.teacher_primary_role || 'subject_teacher';
  const roleMap = {
    'admin': 'Admin',
    'head_teacher': 'Head Teacher',
    'subject_teacher': 'Subject Teacher',
    'class_teacher': 'Class Teacher',
    'form_master': teacher.gender === 'female' ? 'Form Mistress' : 'Form Master',
    'teacher': 'Subject Teacher'
  };
  const displayRole = roleMap[role] || role;

  // Color coding for roles
  const roleColor = role === 'admin'
    ? 'bg-purple-100 text-purple-800 border-purple-200'
    : role === 'head_teacher'
    ? 'bg-indigo-100 text-indigo-800 border-indigo-200'
    : role === 'form_master'
    ? 'bg-blue-100 text-blue-800 border-blue-200'
    : role === 'class_teacher'
    ? 'bg-green-100 text-green-800 border-green-200'
    : 'bg-gray-100 text-gray-800 border-gray-200';

  const genderColor = gender?.toLowerCase() === 'male'
    ? 'bg-blue-100 text-blue-800 border-blue-200'
    : gender?.toLowerCase() === 'female'
    ? 'bg-pink-100 text-pink-800 border-pink-200'
    : 'bg-gray-100 text-gray-800 border-gray-200';

  return (
    <div className={`glass rounded-lg p-4 mb-3 border-l-4 ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-300'} active:bg-white/20 transition-all`}>
      {/* Header with Checkbox */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 flex-1">
          {/* Checkbox */}
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onSelect}
            className="h-6 w-6 rounded border-gray-300 cursor-pointer"
            style={{ minWidth: '24px', minHeight: '24px' }}
          />

          {/* Avatar */}
          <div className="flex-shrink-0 h-12 w-12 rounded-full bg-gray-600 flex items-center justify-center text-white font-bold shadow-md">
            {initials}
          </div>

          {/* Name and Email */}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-gray-900 truncate">{fullName}</h3>
            <p className="text-xs text-gray-600 truncate">{email}</p>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-gray-200">
        {/* Role */}
        <div className="col-span-2">
          <p className="text-xs text-gray-600 mb-1">Role</p>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${roleColor}`}>
            {displayRole}
          </span>
        </div>

        {/* Gender */}
        <div>
          <p className="text-xs text-gray-600 mb-1">Gender</p>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${genderColor}`}>
            {gender === 'male' ? '👨 Male' : gender === 'female' ? '👩 Female' : gender}
          </span>
        </div>

        {/* Classes - Full Width if has classes */}
        {classes !== 'None' && (
          <div className="col-span-2">
            <p className="text-xs text-gray-600 mb-1">Classes</p>
            <p className="text-sm text-gray-900 font-medium">{classes}</p>
          </div>
        )}

        {/* Subjects - Full Width if has subjects */}
        {subjects !== 'None' && (
          <div className="col-span-2">
            <p className="text-xs text-gray-600 mb-1">Subjects</p>
            <p className="text-sm text-gray-900 font-medium">{subjects}</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-gray-200">
        <button
          onClick={onEdit}
          className="flex-1 glass-button px-4 py-3 rounded-md text-sm font-semibold text-indigo-600 hover:text-indigo-900"
          style={{ minHeight: '44px', minWidth: '100px' }}
        >
          ✏️ Edit
        </button>
        <button
          onClick={onResetPassword}
          className="flex-1 glass-button px-4 py-3 rounded-md text-sm font-semibold text-orange-600 hover:text-orange-900"
          style={{ minHeight: '44px', minWidth: '100px' }}
          title="Reset Password"
        >
          🔑 Reset
        </button>
        <button
          onClick={onDelete}
          className="flex-1 glass-button-danger px-4 py-3 rounded-md text-sm font-semibold text-white"
          style={{ minHeight: '44px', minWidth: '100px' }}
        >
          🗑️ Delete
        </button>
      </div>
    </div>
  );
};

export default MobileTeacherCard;
