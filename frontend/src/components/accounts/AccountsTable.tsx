'use client';
import { useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
  type ColumnFiltersState,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  PlayCircle,
  Pause,
  Edit,
  Trash2,
  Eye,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import StatusBadge from '@/components/common/StatusBadge';
import { SenderAccount } from '@/types/models';
import { formatNumber } from '@/lib/utils/formatters';

interface AccountsTableProps {
  accounts: SenderAccount[];
  onViewDetails: (account: SenderAccount) => void;
  onPauseResume: (account: SenderAccount) => void;
  onEditLimits: (account: SenderAccount) => void;
  onDelete: (account: SenderAccount) => void;
}

const columnHelper = createColumnHelper<SenderAccount>();

export default function AccountsTable({
  accounts,
  onViewDetails,
  onPauseResume,
  onEditLimits,
  onDelete,
}: AccountsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [emailSearch, setEmailSearch] = useState<string>('');

  const columns = useMemo(
    () => [
      columnHelper.accessor('email', {
        header: 'Email',
        cell: (info) => (
          <div>
            <div className="font-medium">{info.getValue()}</div>
            {info.row.original.display_name && (
              <div className="text-sm text-muted-foreground">
                {info.row.original.display_name}
              </div>
            )}
          </div>
        ),
      }),
      columnHelper.accessor('auth_type', {
        header: 'Provider',
        cell: (info) => (
          <span className="uppercase text-sm">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => <StatusBadge status={info.getValue()} />,
      }),
      columnHelper.accessor('daily_sent', {
        header: 'Usage',
        cell: (info) => (
          <div>
            <div className="text-sm">
              {formatNumber(info.getValue())} / {formatNumber(info.row.original.daily_limit)}
            </div>
            <div className="text-xs text-muted-foreground">
              {Math.round((info.getValue() / info.row.original.daily_limit) * 100)}% used
            </div>
          </div>
        ),
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: (info) => {
          const account = info.row.original;
          const canPause = account.status === 'active' || account.status === 'warming_up';
          const canResume = account.status === 'paused' || account.status === 'paused_limit_reached';

          return (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onViewDetails(account)}
                title="View Details"
              >
                <Eye className="h-4 w-4" />
              </Button>
              {canPause && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onPauseResume(account)}
                  title="Pause"
                >
                  <Pause className="h-4 w-4" />
                </Button>
              )}
              {canResume && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onPauseResume(account)}
                  title="Resume"
                  className="text-blue-600 hover:text-blue-700"
                >
                  <PlayCircle className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEditLimits(account)}
                title="Edit Limits"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(account)}
                title="Delete"
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        },
      }),
    ],
    [onViewDetails, onPauseResume, onEditLimits, onDelete]
  );

  const filteredAccounts = useMemo(() => {
    return accounts.filter((account) => {
      const matchesStatus = statusFilter === 'all' || account.status === statusFilter;
      const matchesEmail = account.email.toLowerCase().includes(emailSearch.toLowerCase());
      return matchesStatus && matchesEmail;
    });
  }, [accounts, statusFilter, emailSearch]);

  const table = useReactTable({
    data: filteredAccounts,
    columns,
    state: {
      sorting,
      columnFilters,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Input
          placeholder="Search by email..."
          value={emailSearch}
          onChange={(e) => setEmailSearch(e.target.value)}
          className="flex-1"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="warming_up">Warming Up</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="paused_limit_reached">Limit Reached</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className={header.column.getCanSort() ? 'cursor-pointer select-none' : ''}
                  >
                    <div className="flex items-center gap-2">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() && (
                        <span>
                          {header.column.getIsSorted() === 'asc' ? (
                            <ArrowUp className="h-4 w-4" />
                          ) : (
                            <ArrowDown className="h-4 w-4" />
                          )}
                        </span>
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                  No accounts found
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-muted/50">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
