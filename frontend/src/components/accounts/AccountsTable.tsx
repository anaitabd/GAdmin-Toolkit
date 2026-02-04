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
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  ArrowUpward,
  ArrowDownward,
} from '@mui/icons-material';
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
          <Box>
            <Typography variant="body2" fontWeight={500}>
              {info.getValue()}
            </Typography>
            {info.row.original.display_name && (
              <Typography variant="caption" color="text.secondary">
                {info.row.original.display_name}
              </Typography>
            )}
          </Box>
        ),
      }),
      columnHelper.accessor('auth_type', {
        header: 'Provider',
        cell: (info) => (
          <Typography variant="body2" textTransform="uppercase">
            {info.getValue()}
          </Typography>
        ),
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => <StatusBadge status={info.getValue()} />,
      }),
      columnHelper.accessor('daily_sent', {
        header: 'Usage',
        cell: (info) => (
          <Box>
            <Typography variant="body2">
              {formatNumber(info.getValue())} / {formatNumber(info.row.original.daily_limit)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {Math.round((info.getValue() / info.row.original.daily_limit) * 100)}% used
            </Typography>
          </Box>
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
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Tooltip title="View Details">
                <IconButton size="small" onClick={() => onViewDetails(account)}>
                  <ViewIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              {canPause && (
                <Tooltip title="Pause">
                  <IconButton size="small" onClick={() => onPauseResume(account)}>
                    <PauseIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              {canResume && (
                <Tooltip title="Resume">
                  <IconButton size="small" color="primary" onClick={() => onPauseResume(account)}>
                    <PlayIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip title="Edit Limits">
                <IconButton size="small" onClick={() => onEditLimits(account)}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete">
                <IconButton size="small" color="error" onClick={() => onDelete(account)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          );
        },
      }),
    ],
    [onViewDetails, onPauseResume, onEditLimits, onDelete]
  );

  // Filter accounts based on status and email search
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
    <Box>
      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          placeholder="Search by email..."
          value={emailSearch}
          onChange={(e) => setEmailSearch(e.target.value)}
          sx={{ flex: 1 }}
          size="small"
        />
        <FormControl sx={{ minWidth: 200 }} size="small">
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="all">All Status</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="paused">Paused</MenuItem>
            <MenuItem value="warming_up">Warming Up</MenuItem>
            <MenuItem value="suspended">Suspended</MenuItem>
            <MenuItem value="paused_limit_reached">Limit Reached</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableCell
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    sx={{
                      cursor: header.column.getCanSort() ? 'pointer' : 'default',
                      userSelect: 'none',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() && (
                        <Box component="span">
                          {header.column.getIsSorted() === 'asc' ? (
                            <ArrowUpward fontSize="small" />
                          ) : (
                            <ArrowDownward fontSize="small" />
                          )}
                        </Box>
                      )}
                    </Box>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableHead>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center">
                  <Typography variant="body2" color="text.secondary" py={4}>
                    No accounts found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} hover>
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
      </TableContainer>
    </Box>
  );
}
