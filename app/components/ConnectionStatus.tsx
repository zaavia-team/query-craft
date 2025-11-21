import { CheckCircle2, XCircle, Loader } from 'lucide-react';
import { ConnectionStatus as Status } from '../types';

interface Props {
  status: Status;
}

export default function ConnectionStatus({ status }: Props) {
  const configs = {
    checking: {
      bg: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      icon: <Loader className="w-5 h-5 animate-spin" />,
      text: 'Checking connection...'
    },
    connected: {
      bg: 'bg-green-50 border-green-200 text-green-800',
      icon: <CheckCircle2 className="w-5 h-5" />,
      text: 'Connected via Next.js API'
    },
    error: {
      bg: 'bg-red-50 border-red-200 text-red-800',
      icon: <XCircle className="w-5 h-5" />,
      text: 'Connection failed! Check backend.'
    }
  };

  const config = configs[status];

  return (
    <div className={`p-4 mb-5 rounded-lg border flex items-center gap-3 ${config.bg}`}>
      {config.icon}
      <div>
        <strong>Backend Status: </strong>
        {config.text}
      </div>
    </div>
  );
}