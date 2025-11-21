import { QueryBuilder, RuleGroupType, Field } from 'react-querybuilder';
import { Plus, Loader } from 'lucide-react';
import JoinList from './JoinList';
import { JoinConfig } from '../types';
import 'react-querybuilder/dist/query-builder.css';

interface Props {
  fields: Field[];
  query: RuleGroupType;
  joins: JoinConfig[];
  selectedTable: string;
  loading: boolean;
  onQueryChange: (query: RuleGroupType) => void;
  onOpenJoinModal: () => void;
  onRemoveJoin: (index: number) => void;
}

export default function QueryBuilderSection({
  fields,
  query,
  joins,
  selectedTable,
  loading,
  onQueryChange,
  onOpenJoinModal,
  onRemoveJoin
}: Props) {
  return (
    <div className="border border-gray-300 rounded-lg p-5 mb-5 bg-white">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h2 className="m-0 text-md font-semibold text-gray-800">
          Select the columns and filters you would like to visualise in the database
        </h2>
        <div className="flex gap-2 flex-wrap">
          {joins.length > 0 && (
            <span className="px-3 py-2 bg-blue-50 text-blue-700 rounded-md text-sm font-bold">
              {joins.length} JOIN{joins.length > 1 ? 'S' : ''}
            </span>
          )}
          <button
            onClick={onOpenJoinModal}
            className="px-4 py-2 bg-green-600 text-white border-none rounded-md cursor-pointer text-sm font-bold hover:bg-green-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            JOIN
          </button>
        </div>
      </div>

      <JoinList 
        joins={joins} 
        selectedTable={selectedTable} 
        onRemove={onRemoveJoin} 
      />

      {loading ? (
        <p className="text-gray-600 flex items-center gap-2">
          <Loader className="w-4 h-4 animate-spin" />
          Loading columns...
        </p>
      ) : (
        <QueryBuilder 
          fields={fields} 
          query={query} 
          onQueryChange={onQueryChange} 
        />
      )}
    </div>
  );
}