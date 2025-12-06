import { useState, FormEvent, useEffect } from 'react';
import { UserPlus, Loader, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';

type UserRole = 'Admin' | 'User' | "";

interface CreateUserFormProps {
  creatorRole: UserRole;
  creatorUserName: string;
  onSuccess?: () => void;
}

interface FormData {
  first_name: string;
  last_name: string;
  user_name: string;
  contact: string;
  roles_and_rights: UserRole;
  user_password: string;
  confirm_password: string;
}

export default function CreateUserForm({ 
  creatorRole, 
  creatorUserName,
  onSuccess 
}: CreateUserFormProps) {
  const [formData, setFormData] = useState<FormData>({
    first_name: '',
    last_name: '',
    user_name: '',
    contact: '',
    roles_and_rights: '',
    user_password: '',
    confirm_password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isFormValid, setIsFormValid] = useState(false);
  
  // NEW: Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // VALIDATION: Check if all mandatory fields are filled
  useEffect(() => {
    const { first_name, last_name, user_name, user_password, confirm_password, roles_and_rights } = formData;
    
    const isValid = 
      first_name.trim().length > 0 &&
      last_name.trim().length > 0 &&
      user_name.trim().length >= 3 &&
      user_password.length >= 6 &&
      confirm_password.length >= 6 &&
      user_password === confirm_password &&
      (roles_and_rights === 'Admin' || roles_and_rights === 'User');
    
    setIsFormValid(isValid);
  }, [formData]);

  // NEW: Handle contact input with max 11 digits
  function handleContactChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    // Only allow numbers and max 11 digits
    if (value === '' || (/^\d+$/.test(value) && value.length <= 11)) {
      setFormData({ ...formData, contact: value });
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Frontend validation
    if (formData.user_password !== formData.confirm_password) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.user_name.length < 3) {
      setError('Username must be at least 3 characters');
      setLoading(false);
      return;
    }

    if (formData.user_password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim(),
          user_name: formData.user_name.trim(),
          contact: formData.contact.trim() || null, 
          roles_and_rights: formData.roles_and_rights,
          user_password: formData.user_password,
          creator_role: creatorRole,
          created_by: creatorUserName 
        })
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(result.message);
        // Reset form
        setFormData({
          first_name: '',
          last_name: '',
          user_name: '',
          contact: '',
          roles_and_rights: '',
          user_password: '',
          confirm_password: ''
        });
        onSuccess?.();
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* First Name - MANDATORY */}
      <div>
        <label className="block mb-2 text-sm font-semibold text-gray-700">
          First Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.first_name}
          onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700"
          placeholder="Enter first name"
        />
      </div>

      {/* Last Name - MANDATORY */}
      <div>
        <label className="block mb-2 text-sm font-semibold text-gray-700">
          Last Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.last_name}
          onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700"
          placeholder="Enter last name"
        />
      </div>

      {/* Username - MANDATORY */}
      <div>
        <label className="block mb-2 text-sm font-semibold text-gray-700">
          User Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.user_name}
          onChange={(e) => setFormData({ ...formData, user_name: e.target.value })}
          required
          minLength={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700"
          placeholder="Enter username (min 3 characters)"
        />
         <p className="mt-1 text-xs text-gray-500">
          UserName must be at least 3 characters
        </p> 
      </div>

      {/* Contact : OPTIONAL Max 11 digits */}
      <div>
        <label className="block mb-2 text-sm font-semibold text-gray-700">
          Contact <span className="text-gray-400 text-xs">(Optional)</span>
        </label>
        <input
          type="text"
          inputMode="numeric"
          value={formData.contact}
          onChange={handleContactChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700"
          placeholder="Enter contact number (max 11 digits)"
        />
        <p className="mt-1 text-xs text-gray-500">
          {formData.contact.length}/11 digits
        </p>
      </div>

      {/* Role - MANDATORY */}
      <div>
        <label className="block mb-2 text-sm font-semibold text-gray-700">
          Role / Rights <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.roles_and_rights}
          onChange={(e) => setFormData({ ...formData, roles_and_rights: e.target.value as UserRole })}
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700"
        >   
          <option disabled value="">Select Role</option>
          <option value="User">User</option>
          <option value="Admin">Admin</option>
        </select>
      </div>

      {/* Password - MANDATORY - NEW: Eye icon toggle */}
      <div>
        <label className="block mb-2 text-sm font-semibold text-gray-700">
          Password <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={formData.user_password}
            onChange={(e) => setFormData({ ...formData, user_password: e.target.value })}
            required
            minLength={6}
            className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700"
            placeholder="Enter password (min 6 characters)"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Password must be at least 6 characters
        </p> 
      </div>

      {/* Confirm Password - MANDATORY - NEW: Eye icon toggle */}
      <div>
        <label className="block mb-2 text-sm font-semibold text-gray-700">
          Confirm Password <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            type={showConfirmPassword ? "text" : "password"}
            value={formData.confirm_password}
            onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
            required
            minLength={6}
            className={`w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-gray-700 ${
              formData.confirm_password && formData.user_password !== formData.confirm_password
                ? 'border-red-300 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            }`}
            placeholder="Confirm password"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            {showConfirmPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        </div>
        {formData.confirm_password && formData.user_password !== formData.confirm_password && (
          <p className="mt-1 text-xs text-red-600">Passwords do not match</p>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          {success}
        </div>
      )}

      {/* Submit Button - DISABLED until form is valid */}
      <button
        type="submit"
        disabled={loading || !isFormValid}
        className={`w-full px-6 py-3 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors ${
          loading || !isFormValid
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {loading ? (
          <>
            <Loader className="w-5 h-5 animate-spin" />
            Creating User...
          </>
        ) : (
          <>
            <UserPlus className="w-5 h-5" />
            Create User
          </>
        )}
      </button>
    </form>
  );
}