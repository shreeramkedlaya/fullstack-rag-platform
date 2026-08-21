import React, { useState, useMemo, useEffect } from 'react'
import { LayoutGrid, List, Search, ArrowUpDown, ChevronDown, ChevronUp, MoreVertical, Pencil, Trash, ChevronLeft, ChevronRight } from 'lucide-react'
import { Card } from './card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './dropdown-menu'
import { Button } from './button'

export interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  sortKey?: keyof T; // Used for sorting when accessor is a function
  className?: string;
  sortable?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
  emptyMessage?: React.ReactNode;
  
  // View Toggle Props
  allowToggle?: boolean;
  extraToolbarActions?: React.ReactNode;
  renderCard?: (row: T) => React.ReactNode;
  defaultView?: 'table' | 'grid';
  
  // Search Props
  enableSearch?: boolean;
  searchPlaceholder?: string;

  // Selection Props
  enableSelection?: boolean;
  onSelectionChange?: (selectedRows: T[]) => void;

  // Pagination Props
  defaultPageSize?: number;
  pageSizeOptions?: number[];

  // Built-in Row Actions
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  extraRowActions?: (row: T) => React.ReactNode;
}

export function DataTable<T extends Record<string, any>>({ 
  data, 
  columns, 
  onRowClick, 
  emptyMessage = "No data available.",
  allowToggle = false,
  extraToolbarActions,
  renderCard,
  defaultView = 'table',
  enableSearch = false,
  searchPlaceholder = "Search...",
  enableSelection = false,
  onSelectionChange,
  defaultPageSize = 10,
  pageSizeOptions = [5, 10, 25, 50, 100],
  onEdit,
  onDelete,
  extraRowActions
}: DataTableProps<T>) {
  const [viewMode, setViewMode] = useState<'table' | 'grid'>(defaultView);
  const [userToggled, setUserToggled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: keyof T, direction: 'asc' | 'desc' } | null>(null);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  // Selection State
  const [selectedRows, setSelectedRows] = useState<Set<T>>(new Set());

  // Reset page to 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Responsive View Mode Logic
  useEffect(() => {
    if (!renderCard || userToggled) return;
    
    const checkWidth = () => {
      if (window.innerWidth < 768) {
        setViewMode('grid');
      } else {
        setViewMode(defaultView);
      }
    };
    
    checkWidth(); // Initial check
    
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, [renderCard, defaultView, userToggled]);

  const handleToggle = (mode: 'table' | 'grid') => {
    setViewMode(mode);
    setUserToggled(true);
  };

  const hasActions = !!(onEdit || onDelete || extraRowActions);

  // Search Filtering logic
  const filteredData = useMemo(() => {
    if (!enableSearch || !searchQuery.trim()) return data;
    
    const lowerQuery = searchQuery.toLowerCase();
    return data.filter(row => {
      // Check if any string/number value in the row matches the query
      return Object.values(row).some(value => {
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(lowerQuery);
      });
    });
  }, [data, searchQuery, enableSearch]);

  // Sorting logic
  const sortedData = useMemo(() => {
    let sortableItems = [...filteredData];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [filteredData, sortConfig]);

  // Pagination logic
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize]);

  // Selection Logic
  const isAllSelected = paginatedData.length > 0 && paginatedData.every(row => selectedRows.has(row));
  const isSomeSelected = paginatedData.some(row => selectedRows.has(row)) && !isAllSelected;

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSelected = new Set(selectedRows);
    if (e.target.checked) {
      paginatedData.forEach(row => newSelected.add(row));
    } else {
      paginatedData.forEach(row => newSelected.delete(row));
    }
    setSelectedRows(newSelected);
  };

  const handleSelectRow = (row: T, checked: boolean) => {
    const newSelected = new Set(selectedRows);
    if (checked) newSelected.add(row);
    else newSelected.delete(row);
    setSelectedRows(newSelected);
  };

  // Sync selection to parent component
  const onSelectionChangeRef = React.useRef(onSelectionChange);
  
  useEffect(() => {
    onSelectionChangeRef.current = onSelectionChange;
  }, [onSelectionChange]);

  useEffect(() => {
    if (onSelectionChangeRef.current) {
      onSelectionChangeRef.current(Array.from(selectedRows));
    }
  }, [selectedRows]);


  const handleSort = (column: Column<T>) => {
    if (!column.sortable) return;
    
    const key = column.sortKey || (typeof column.accessor === 'string' ? column.accessor as keyof T : null);
    if (!key) return;
    
    setSortConfig(current => {
      if (current && current.key === key) {
        if (current.direction === 'asc') return { key, direction: 'desc' };
        return null; // toggle off
      }
      return { key, direction: 'asc' };
    });
  };

  const hasToolbar = allowToggle || !!extraToolbarActions || enableSearch;

  const renderToolbar = () => {
    if (!hasToolbar) return null;
    
    return (
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 w-full">
        {/* Left Side: Search */}
        <div className="w-full sm:w-72">
          {enableSearch && (
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="w-4 h-4 text-slate-400" />
              </div>
              <input 
                type="text"
                className="w-full p-2 pl-9 text-sm bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none transition-all"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Right Side: Actions & Toggles */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {extraToolbarActions && <div>{extraToolbarActions}</div>}
          
          {allowToggle && renderCard && (
            <div className="inline-flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200" role="group">
              <button
                type="button"
                onClick={() => handleToggle('table')}
                className={`flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-1 ${
                  viewMode === 'table' 
                    ? 'bg-white text-black shadow-sm' 
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleToggle('grid')}
                className={`flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-1 ${
                  viewMode === 'grid' 
                    ? 'bg-white text-black shadow-sm' 
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderPagination = () => {
    if (sortedData.length === 0) return null;

    return (
      <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-white">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => { 
              setPageSize(Number(e.target.value)); 
              setCurrentPage(1); 
            }}
            className="text-sm border border-slate-200 rounded p-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
          >
            {pageSizeOptions.map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-500">
            {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length}
          </span>
          <div className="flex items-center gap-1">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
              disabled={currentPage === 1} 
              className="px-2 h-8"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
              disabled={currentPage === totalPages} 
              className="px-2 h-8"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // If grid mode is active and we have a card renderer, show the grid.
  if (viewMode === 'grid' && renderCard) {
    return (
      <div className="space-y-4">
        {hasToolbar && (
          <Card className="p-4 shadow-sm border-slate-200 bg-white">
            {renderToolbar()}
          </Card>
        )}
        
        {paginatedData.length === 0 ? (
          <div className="text-center text-slate-500 py-10 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">{emptyMessage}</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {paginatedData.map((item, index) => (
              <React.Fragment key={index}>
                {renderCard(item)}
              </React.Fragment>
            ))}
          </div>
        )}

        {renderPagination()}
      </div>
    );
  }

  // Otherwise, show the Table View
  return (
    <Card className="shadow-sm border-slate-200 overflow-hidden">
      {hasToolbar && (
        <div className="p-4 border-b border-slate-100 bg-white">
          {renderToolbar()}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
              <tr>
                {enableSelection && (
                  <th className="px-6 py-4 font-medium w-[50px]">
                    <input 
                      type="checkbox" 
                      checked={isAllSelected}
                      ref={el => { if (el) el.indeterminate = isSomeSelected }}
                      onChange={handleSelectAll}
                      className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer w-4 h-4"
                    />
                  </th>
                )}
                {hasActions && (
                  <th className="px-6 py-4 font-medium w-[80px]">
                    Actions
                  </th>
                )}
                {columns.map((col, idx) => (
                  <th 
                    key={idx} 
                    className={`px-6 py-4 font-medium ${col.className || ''} ${col.sortable ? 'cursor-pointer hover:bg-slate-100 transition-colors select-none' : ''}`}
                    onClick={() => handleSort(col)}
                  >
                    <div className={`flex items-center ${col.className?.includes('text-right') || col.className?.includes('justify-end') ? 'justify-end' : ''}`}>
                      {col.header}
                      {col.sortable && (
                        <span className="ml-1 flex-shrink-0">
                          {sortConfig?.key === (col.sortKey || col.accessor) ? (
                            sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-30" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + (hasActions ? 1 : 0) + (enableSelection ? 1 : 0)} className="px-6 py-12 text-center text-slate-500">
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, rowIndex) => (
                  <tr 
                    key={rowIndex} 
                    className={`hover:bg-slate-50 transition-colors ${onRowClick ? 'cursor-pointer' : ''} ${selectedRows.has(row) ? 'bg-slate-50' : ''}`}
                    onClick={() => onRowClick && onRowClick(row)}
                  >
                    {enableSelection && (
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          checked={selectedRows.has(row)}
                          onChange={(e) => handleSelectRow(row, e.target.checked)}
                          className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer w-4 h-4"
                        />
                      </td>
                    )}
                    {hasActions && (
                      <td className="px-6 py-4">
                        <div className="flex justify-start" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                className="h-8 w-8 p-0 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-all focus:ring-2 focus:ring-indigo-100 outline-none"
                              >
                                <span className="sr-only">Open menu</span>
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-36 bg-white shadow-xl rounded-xl border border-slate-200 p-1 z-50">
                              {onEdit && (
                                <DropdownMenuItem 
                                  onClick={(e) => { e.stopPropagation(); onEdit(row); }} 
                                  className="cursor-pointer font-medium text-slate-700 hover:bg-slate-100 focus:bg-slate-100 rounded-md transition-colors outline-none"
                                >
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                              )}
                              {onDelete && (
                                <DropdownMenuItem 
                                  onClick={(e) => { e.stopPropagation(); onDelete(row); }} 
                                  className="cursor-pointer font-medium text-red-600 hover:bg-red-50 focus:bg-red-50 hover:text-red-700 focus:text-red-700 rounded-md transition-colors outline-none"
                                >
                                  <Trash className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              )}
                              {extraRowActions && extraRowActions(row)}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    )}
                    {columns.map((col, colIndex) => (
                      <td key={colIndex} className={`px-6 py-4 ${col.className || ''}`}>
                        {typeof col.accessor === 'function' 
                          ? col.accessor(row) 
                          : (row[col.accessor] as React.ReactNode)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {renderPagination()}
      </Card>
  );
}
