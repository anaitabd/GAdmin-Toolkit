'use client';
import { useState } from 'react';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import AccountsTable from '@/components/accounts/AccountsTable';
import AddAccountDialog from '@/components/accounts/AddAccountDialog';
import AccountDetailsDialog from '@/components/accounts/AccountDetailsDialog';
import EditLimitsDialog from '@/components/accounts/EditLimitsDialog';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { useAccounts } from '@/lib/hooks/useAccounts';
import { SenderAccount } from '@/types/models';
import type { AccountFormData } from '@/lib/schemas/accountSchema';

export default function AccountsPage() {
  const { accounts, isLoading, createAccount, updateAccount, deleteAccount } = useAccounts();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [editLimitsDialogOpen, setEditLimitsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<SenderAccount | null>(null);

  const handleViewDetails = (account: SenderAccount) => {
    setSelectedAccount(account);
    setDetailsDialogOpen(true);
  };

  const handlePauseResume = (account: SenderAccount) => {
    const newStatus =
      account.status === 'active' || account.status === 'warming_up' ? 'paused' : 'active';
    updateAccount({ id: account.id, updates: { status: newStatus } });
  };

  const handleEditLimits = (account: SenderAccount) => {
    setSelectedAccount(account);
    setEditLimitsDialogOpen(true);
  };

  const handleDelete = (account: SenderAccount) => {
    setSelectedAccount(account);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedAccount) {
      deleteAccount(selectedAccount.id);
      setDeleteDialogOpen(false);
      setSelectedAccount(null);
    }
  };

  const handleAddAccount = (data: AccountFormData) => {
    createAccount(data);
  };

  const handleUpdateLimits = (
    id: number,
    limits: { daily_limit: number; batch_size: number; send_delay_ms: number }
  ) => {
    updateAccount({ id, updates: limits });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={600} gutterBottom>
            Sender Accounts
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your email sender accounts and their limits
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setAddDialogOpen(true)}
        >
          Add Account
        </Button>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <AccountsTable
          accounts={accounts}
          onViewDetails={handleViewDetails}
          onPauseResume={handlePauseResume}
          onEditLimits={handleEditLimits}
          onDelete={handleDelete}
        />
      )}

      <AddAccountDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onSubmit={handleAddAccount}
      />

      <AccountDetailsDialog
        open={detailsDialogOpen}
        account={selectedAccount}
        onClose={() => {
          setDetailsDialogOpen(false);
          setSelectedAccount(null);
        }}
      />

      <EditLimitsDialog
        open={editLimitsDialogOpen}
        account={selectedAccount}
        onClose={() => {
          setEditLimitsDialogOpen(false);
          setSelectedAccount(null);
        }}
        onSubmit={handleUpdateLimits}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Account"
        message={`Are you sure you want to delete ${selectedAccount?.email}? This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setSelectedAccount(null);
        }}
        confirmText="Delete"
        confirmColor="error"
      />
    </Box>
  );
}
