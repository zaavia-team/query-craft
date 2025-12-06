import { X, UserPlus } from 'lucide-react';
import CreateUserForm from './CreateUserForm';

type UserRole = 'Admin' | 'User';

interface CreateUserModalProps {
  show: boolean;
  creatorRole: UserRole;
  creatorUserName: string; 
  onClose: () => void;
}

export default function CreateUserModal({ 
  show, 
  creatorRole, 
  creatorUserName, 
  onClose 
}: CreateUserModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UserPlus className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Create New User</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body - Scrollable */}
        <div className="p-6">
          <CreateUserForm 
            creatorRole={creatorRole}
            creatorUserName={creatorUserName} 
            onSuccess={() => {
              setTimeout(() => onClose(), 1500);
            }}
          />
        </div>
      </div>
    </div>
  );
}