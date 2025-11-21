import { AlertCircle } from 'lucide-react';

interface Props {
  message: string | null;
}

export default function ErrorAlert({ message }: Props) {
  if (!message) return null;

  return (
    <div className="p-4 mb-5 bg-red-50 border border-red-200 rounded-md text-red-800 flex items-start gap-3">
      <AlertCircle className="w-5 h-5 mt-0.5" />
      <div>
        <strong>Error:</strong> {message}
      </div>
    </div>
  );
}
