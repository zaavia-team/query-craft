import { Search, Loader } from 'lucide-react';

interface Props {
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
}

export default function ExecuteButton({ loading, disabled, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-6 py-3 bg-blue-600 text-white border-none rounded-md cursor-pointer text-base font-bold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
    >
      {loading ? (
        <>
          <Loader className="w-4 h-4 animate-spin" />
          Loading...
        </>
      ) : (
        <>
          <Search className="w-4 h-4" />
          Execute Query
        </>
      )}
    </button>
  );
}