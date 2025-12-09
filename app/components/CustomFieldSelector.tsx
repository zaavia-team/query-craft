import { useState, useRef } from 'react';
import { FieldSelectorProps, Option } from 'react-querybuilder';

export default function CustomFieldSelector({
    options,
    value,
    handleOnChange,
}: FieldSelectorProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const flattenedOptions: Option[] = options.flatMap((o) =>
        'options' in o ? (o.options as Option[]) : [o as Option]);

    const filteredOptions = flattenedOptions.filter((option) =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedLabel = flattenedOptions.find((opt) => opt.name === value)?.label || 'Select field';

    const toggleDropdown = () => {
        setIsOpen((prev) => !prev);
    };

    const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
        const nextFocus = e.relatedTarget as Node | null;
        if (!containerRef.current?.contains(nextFocus)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };

    const handleSearchChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        setSearchTerm(e.target.value);
    };

    const handleOptionSelect = (val: string) => {
        handleOnChange(val);
        setIsOpen(false);
        setSearchTerm('');
    };

    const stopPropagation = (e: React.MouseEvent) => {
        e.stopPropagation();
    };

    return (
        <div
            ref={containerRef}
            tabIndex={0}
            onBlur={handleBlur}
            className="relative w-full bg-white border border-gray-300 p-2 rounded"
        >
            <div
                onClick={toggleDropdown}
                className="flex items-center justify-between cursor-pointer select-none gap-2"
            >
                <span className="truncate flex-1 text-sm">{selectedLabel}</span>

                <svg
                    className={`w-4 h-4 flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                    />
                </svg>
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div
                    className="absolute left-0 right-0 mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-64 overflow-y-auto z-50"
                    style={{ minWidth: '100%' }}
                    onMouseDown={stopPropagation}
                >
                    {/* Search Input */}
                    <div className="p-2 border-b border-gray-200 sticky top-0 bg-white">
                        <input
                            autoFocus
                            value={searchTerm}
                            onChange={handleSearchChange}
                            placeholder="Search columns..."
                            className="w-full px-2 py-1.5 bg-white border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    {/* Options List */}
                        {filteredOptions.length > 0 ? (
                            filteredOptions?.map((option) => (
                                <div
                                    key={option.name}
                                    onClick={() => handleOptionSelect(option.name)}
                                    className={`px-3 py-2 cursor-pointer text-sm break-words ${
                                    value === option.name 
                                        ? 'bg-blue-50 text-blue-700' 
                                        : 'hover:bg-gray-50'
                                        }`}
                                >
                                    {option.label}
                                </div>
                            ))
                        ) : (
                            <div className="px-3 py-2 text-gray-500 text-sm">No columns found</div>)}</div>
            )}
        </div>
    );
}