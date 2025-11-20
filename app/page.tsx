"use client"
import { useState, useEffect } from 'react';
import { QueryBuilder, RuleGroupType, formatQuery, Field } from 'react-querybuilder';
import 'react-querybuilder/dist/query-builder.css';
import Pagination from './components/Pagination';
import { CheckCircle2, XCircle, RotateCw, Loader, BarChart3, Search, Send, AlertCircle, Plus, X } from 'lucide-react';


const initialQuery: RuleGroupType = {
  combinator: 'and',
  rules: [],
};

interface JoinConfig {
  type: 'INNER' | 'LEFT' | 'RIGHT';
  targetTable: string;
  sourceColumn: string;
  targetColumn: string;
}

export default function Page() {
  const [query, setQuery] = useState<RuleGroupType>(initialQuery);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [fields, setFields] = useState<Field[]>([]);
  const [loadingTables, setLoadingTables] = useState(false);
  const [loadingColumns, setLoadingColumns] = useState(false);
  
  const [joins, setJoins] = useState<JoinConfig[]>([]);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [newJoin, setNewJoin] = useState<JoinConfig>({
    type: 'RIGHT',
    targetTable: '',
    sourceColumn: '',
    targetColumn: ''
  });
  const [availableColumns, setAvailableColumns] = useState<{[key: string]: string[]}>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    checkConnection();
  }, []);

  useEffect(() => {
    if (connectionStatus === 'connected') {
      loadTables();
    }
  }, [connectionStatus]);

  useEffect(() => {
    if (selectedTable && selectedTable.trim() !== '') {
      loadTableColumns(selectedTable);
    } else {
      setFields([]);
    }
  }, [selectedTable]);

  useEffect(() => {
    if (selectedTable && joins.length > 0) {
      loadAllFieldsWithJoins();
    }
  }, [joins]);

  // CONNECTION CHECK: Backend 
  async function checkConnection() {
    try {
      const response = await fetch('/api/tables');
      
      if (response.ok) {
        setConnectionStatus('connected');
        console.log('Backend API connection successful!');
      } else {
        throw new Error('Backend not responding');
      }
    } catch (err) {
      setConnectionStatus('error');
      console.error('Connection failed:', err);
    }
  }

  // LOAD TABLES: Backend API tables fetch
  async function loadTables() {
    setLoadingTables(true);
    setError(null);
    
    try {
      const response = await fetch('/api/tables');
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to load tables');
      }
      
      setTables(result.tables || []);
    } catch (err: any) {
      console.error('Error:', err);
      setError('Failed to load tables. Please check backend connection.');
    } finally {
      setLoadingTables(false);
    }
  }

  // LOAD COLUMNS: Backend API columns fetch
  async function loadTableColumns(tableName: string) {
    setLoadingColumns(true);
    setError(null);
    
    try {
      const response = await fetch('/api/columns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableName })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to load columns');
      }
      
      const columnNames = result.columns.map((col: any) => col.name);
      setAvailableColumns(prev => ({ ...prev, [tableName]: columnNames }));
      
      const newFields: Field[] = result.columns.map((col: any) => ({
        name: `${tableName}.${col.name}`,
        label: `${tableName}.${col.name}`,
        inputType: mapPostgresType(col.type),
      }));
      
      setFields(newFields);
    } catch (err: any) {
      console.error('Error:', err);
      setError('Could not load columns. Make sure RPC function exists.');
    } finally {
      setLoadingColumns(false);
    }
  }

  async function loadAllFieldsWithJoins() {
    setLoadingColumns(true);
    
    try {
      const mainFields = await loadFieldsForTable(selectedTable);
      const joinedFields = await Promise.all(
        joins.map(join => loadFieldsForTable(join.targetTable))
      );
      
      const allFields = [...mainFields, ...joinedFields.flat()];
      setFields(allFields);
    } catch (err: any) {
      console.error('Error loading joined fields:', err);
    } finally {
      setLoadingColumns(false);
    }
  }

  async function loadFieldsForTable(tableName: string): Promise<Field[]> {
    const response = await fetch('/api/columns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tableName })
    });
    
    const result = await response.json();
    if (!response.ok || !result.columns) return [];
    
    const columnNames = result.columns.map((col: any) => col.name);
    setAvailableColumns(prev => ({ ...prev, [tableName]: columnNames }));
    
    return result.columns.map((col: any) => ({
      name: `${tableName}.${col.name}`,
      label: `${tableName}.${col.name}`,
      inputType: mapPostgresType(col.type),
    }));
  }
  
  function mapPostgresType(pgType: string): string {
    const map: { [key: string]: string } = {
      'integer': 'number', 'bigint': 'number', 'int8': 'number', 'int4': 'number',
      'numeric': 'number', 'real': 'number', 'double precision': 'number',
      'boolean': 'checkbox', 'date': 'date', 'timestamp': 'datetime-local',
      'timestamptz': 'datetime-local', 'time': 'time',
    };
    return map[pgType.toLowerCase()] || 'text';
  }

  async function openJoinModal() {
    setShowJoinModal(true);
    if (!availableColumns[selectedTable]) {
      await loadTableColumns(selectedTable);
    }
  }

  async function onTargetTableChange(tableName: string) {
    setNewJoin({...newJoin, targetTable: tableName, sourceColumn: '', targetColumn: ''});
    if (tableName && !availableColumns[tableName]) {
      await loadTableColumns(tableName);
    }
  }

  function addJoin() {
    if (newJoin.targetTable && newJoin.sourceColumn && newJoin.targetColumn) {
      setJoins([...joins, newJoin]);
      setNewJoin({
        type: 'INNER',
        targetTable: '',
        sourceColumn: '',
        targetColumn: ''
      });
      setShowJoinModal(false);
    }
  }

  function removeJoin(index: number) {
    const updatedJoins = joins.filter((_, i) => i !== index);
    setJoins(updatedJoins);
  }

  function processQueryRules(ruleGroup: RuleGroupType): any {
    const processedRules = ruleGroup.rules.map((rule: any) => {
      if ('rules' in rule && Array.isArray(rule.rules)) {
        return {
          combinator: rule.combinator || 'and',
          rules: processQueryRules(rule).rules,
          isGroup: true
        };
      } else {
        if (rule.field && rule.operator && rule.value !== undefined && rule.value !== '') {
          return {
            field: rule.field,
            operator: rule.operator,
            value: rule.value,
            isGroup: false
          };
        }
      }
      return null;
    }).filter(Boolean);

    return { combinator: ruleGroup.combinator, rules: processedRules };
  }

  // EXECUTE QUERY: Backend API query execute
  async function executeQuery() {
    if (!selectedTable) {
      setError('Please select a table first!');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const processedQuery = processQueryRules(query);
     
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: selectedTable,
          query: processedQuery,
          joins: joins
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Query failed');
      }

      setData(result.data || []);
      setCurrentPage(1);
      console.log('Query executed successfully. Results:', result.count);
    } catch (err: any) {
      setError(err.message);
      console.error('Query error:', err);
    } finally {
      setLoading(false);
    }
  }

  const getTableColumns = () => {
    if (data.length === 0) return [];
    return Object.keys(data[0]);
  };

  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = data.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => setCurrentPage(page);
  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items);
    setCurrentPage(1);
  };

  return (
    <div className="p-5 max-w-[1400px] mx-auto">
      <h1 className="mb-5 text-2xl font-bold text-white">
        {process.env.NEXT_PUBLIC_ORGANIZATION
          ? `${process.env.NEXT_PUBLIC_ORGANIZATION} Explore EUmatrix political data`
          : "Explore EUmatrix political data"}
      </h1>
      
      {/* Connection Status */}
      <div className={`p-4 mb-5 rounded-lg border flex items-center gap-3 ${
        connectionStatus === 'connected' 
          ? 'bg-green-50 border-green-200 text-green-800' 
          : connectionStatus === 'error' 
          ? 'bg-red-50 border-red-200 text-red-800' 
          : 'bg-yellow-50 border-yellow-200 text-yellow-800'
      }`}>
        {connectionStatus === 'checking' && <Loader className="w-5 h-5 animate-spin" />}
        {connectionStatus === 'connected' && <CheckCircle2 className="w-5 h-5" />}
        {connectionStatus === 'error' && <XCircle className="w-5 h-5" />}
        <div>
          <strong>Backend Status: </strong>
          {connectionStatus === 'checking' && 'Checking connection...'}
          {connectionStatus === 'connected' && 'Connected via Next.js API'}
          {connectionStatus === 'error' && 'Connection failed! Check backend.'}
        </div>
      </div>

      {/* Table Selector */}
      {connectionStatus === 'connected' && (
        <div className="border border-gray-300 rounded-lg p-5 mb-5 bg-white">
          <h2 className="mb-4 text-md font-semibold text-gray-800">Select the database that you would like to access (e.g. MEPs, Commissioners, ministers, etc.)</h2>
          <div className="flex gap-2 flex-wrap">
            <select
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value)}
              disabled={loadingTables}
              className="flex-1 min-w-[200px] p-2.5 text-base rounded-md border border-gray-300 bg-white text-gray-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select a table --</option>
              {tables.map(table => (
                <option key={table} value={table}>{table}</option>
              ))}
            </select>
            <button
              onClick={loadTables}
              disabled={loadingTables}
              className="px-5 py-2.5 bg-gray-600 text-white border-none rounded-md cursor-pointer text-sm font-medium hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <RotateCw className={`w-4 h-4 ${loadingTables ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
          {selectedTable && (
            <p className="mt-2.5 text-gray-600 text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Selected: <strong>{selectedTable}</strong> {fields.length > 0 && `(${fields.length} columns)`}
            </p>
          )}
        </div>
      )}

      {/* Query Builder */}
      {selectedTable && fields.length > 0 && (
        <div className="border border-gray-300 rounded-lg p-5 mb-5 bg-white">
          <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
            <h2 className="m-0 text-md font-semibold text-gray-800">Select the columns and filters you would like to visualise in the database</h2>
            <div className="flex gap-2 flex-wrap">
              {joins.length > 0 && (
                <span className="px-3 py-2 bg-blue-50 text-blue-700 rounded-md text-sm font-bold">
                  {joins.length} JOIN{joins.length > 1 ? 'S' : ''}
                </span>
              )}
              <button
                onClick={openJoinModal}
                className="px-4 py-2 bg-green-600 text-white border-none rounded-md cursor-pointer text-sm font-bold hover:bg-green-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                JOIN
              </button>
            </div>
          </div>

          {joins.length > 0 && (
            <div className="mb-4 flex flex-col gap-2">
              {joins.map((join, index) => (
                <div key={index} className="p-3 bg-blue-50 rounded-md border border-blue-200 flex justify-between items-center flex-wrap gap-2">
                  <span className="text-gray-800 text-sm font-mono">
                    <strong className="text-blue-700">{join.type}</strong> {join.targetTable} 
                    <span className="text-gray-600"> ON </span>
                    {selectedTable}.{join.sourceColumn} = {join.targetTable}.{join.targetColumn}
                  </span>
                  <button
                    onClick={() => removeJoin(index)}
                    className="px-2.5 py-1 bg-red-600 text-white border-none rounded cursor-pointer text-xs hover:bg-red-700 flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {loadingColumns ? (
            <p className="text-gray-600 flex items-center gap-2">
              <Loader className="w-4 h-4 animate-spin" />
              Loading columns...
            </p>
          ) : (
            <QueryBuilder fields={fields} query={query} onQueryChange={setQuery} />
          )}
        </div>
      )}

      {/* Execute Button */}
      {selectedTable && (
        <div className="mb-5">
          <button
            onClick={executeQuery}
            disabled={loading || connectionStatus !== 'connected' || !selectedTable}
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
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 mb-5 bg-red-50 border border-red-200 rounded-md text-red-800 flex items-start gap-3">
          <AlertCircle className="w-5 h-5  mt-0.5" />
          <div>
            <strong>Error:</strong> {error}
          </div>
        </div>
      )}

      {/* Results Table */}
      {data.length > 0 && (
        <div className="border border-gray-300 rounded-lg mb-5 bg-white overflow-hidden">
          <div className="p-5 border-b border-gray-300 bg-gray-50">
            <h2 className="m-0 text-xl font-semibold text-gray-800">
              Results ({data.length} total records)
            </h2>
          </div>

          <div className="overflow-x-auto max-w-full">
            <table className="w-full border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-gray-50">
                  {getTableColumns().map((column, index) => (
                    <th key={index} className="px-4 py-3 text-left border-b-2 border-gray-300 text-gray-700 font-semibold text-sm whitespace-nowrap sticky top-0 bg-gray-50 z-10">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentData.map((row, rowIndex) => (
                  <tr 
                    key={rowIndex} 
                    className={`transition-colors ${rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-200`}
                  >
                    {getTableColumns().map((column, colIndex) => (
                      <td key={colIndex} className="px-4 py-3 border-b border-gray-300 text-gray-800 text-sm max-w-[300px] overflow-hidden text-ellipsis whitespace-nowrap">
                        {typeof row[column] === 'object' 
                          ? JSON.stringify(row[column]) 
                          : String(row[column] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={handleItemsPerPageChange}
            totalItems={data.length}
          />
        </div>
      )}

      {/* JOIN Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-5">
          <div className="bg-white p-8 rounded-lg w-[500px] max-w-full max-h-[90vh] overflow-y-auto">
            <h3 className="mt-0 mb-4 text-xl font-semibold text-gray-800">Configure JOIN</h3>
            
            <div className="mb-4">
              <label className="block mb-1.5 text-gray-600 text-sm font-bold">Join Type:</label>
              <select
                value={newJoin.type}
                onChange={(e) => setNewJoin({...newJoin, type: e.target.value as any})}
                className="w-full p-2.5 text-base rounded-md border border-gray-300 bg-white text-gray-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="INNER">INNER JOIN</option>
                <option value="LEFT">LEFT JOIN</option>
                <option value="RIGHT">RIGHT JOIN</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block mb-1.5 text-gray-600 text-sm font-bold">Target Table:</label>
              <select
                value={newJoin.targetTable}
                onChange={(e) => onTargetTableChange(e.target.value)}
                className="w-full p-2.5 text-base rounded-md border border-gray-300 bg-white text-gray-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Select table --</option>
                {tables.filter(t => t !== selectedTable).map(table => (
                  <option key={table} value={table}>{table}</option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block mb-1.5 text-gray-600 text-sm font-bold">
                Source Column ({selectedTable}):
              </label>
              <select
                value={newJoin.sourceColumn}
                onChange={(e) => setNewJoin({...newJoin, sourceColumn: e.target.value})}
                disabled={!availableColumns[selectedTable]}
                className="w-full p-2.5 text-base rounded-md border border-gray-300 bg-white text-gray-800 cursor-pointer disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Select column --</option>
                {(availableColumns[selectedTable] || []).map(col => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>

            <div className="mb-5">
              <label className="block mb-1.5 text-gray-600 text-sm font-bold">
                Target Column ({newJoin.targetTable || 'select table'}):
              </label>
              <select
                value={newJoin.targetColumn}
                onChange={(e) => setNewJoin({...newJoin, targetColumn: e.target.value})}
                disabled={!newJoin.targetTable || !availableColumns[newJoin.targetTable]}
                className="w-full p-2.5 text-base rounded-md border border-gray-300 bg-white text-gray-800 cursor-pointer disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Select column --</option>
                {(availableColumns[newJoin.targetTable] || []).map(col => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowJoinModal(false);
                  setNewJoin({ type: 'INNER', targetTable: '', sourceColumn: '', targetColumn: '' });
                }}
                className="px-5 py-2.5 bg-gray-600 text-white border-none rounded-md cursor-pointer text-sm hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={addJoin}
                disabled={!newJoin.targetTable || !newJoin.sourceColumn || !newJoin.targetColumn}
                className="px-5 py-2.5 bg-blue-600 text-white border-none rounded-md cursor-pointer text-sm hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Add JOIN
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
