import { useCallback, useEffect, useState } from 'react';
import { ApiClientError } from '../api/client';
import { createUser, deleteUser, listUsers, updateUser } from '../api/user-api';
import { UserManagement } from '../components/UserManagement';
import { AlertBanner } from '../components/AlertBanner';
import { AlertViewport } from '../components/AlertViewport';
import { useAuth } from '../hooks/useAuth';
import { useAutoDismissMessage } from '../hooks/useAutoDismissMessage';
import { User } from '../types/user';

export const UsersPage = (): JSX.Element => {
  const { authState } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [pageError, setPageError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  useAutoDismissMessage(pageError, setPageError);
  useAutoDismissMessage(actionError, setActionError);
  useAutoDismissMessage(actionFeedback, setActionFeedback);

  const loadUsers = useCallback(async () => {
    if (!authState) {
      return;
    }

    try {
      const nextUsers = await listUsers(authState.token);
      setUsers(nextUsers);
      setPageError(null);
    } catch (caughtError) {
      setPageError(
        caughtError instanceof ApiClientError
          ? caughtError.message
          : 'Could not load users',
      );
    }
  }, [authState]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  if (!authState) {
    return <></>;
  }

  return (
    <div className="dashboard-grid">
      {pageError || actionError || actionFeedback ? (
        <AlertViewport>
          {pageError ? (
            <AlertBanner message={pageError} variant="error" />
          ) : null}
          {actionError ? (
            <AlertBanner message={actionError} variant="error" />
          ) : null}
          {actionFeedback ? (
            <AlertBanner message={actionFeedback} variant="success" />
          ) : null}
        </AlertViewport>
      ) : null}

      <section className="hero-strip">
        <div>
          <div className="eyebrow">Admin</div>
          <h1>Users</h1>
        </div>
      </section>

      <UserManagement
        error={actionError}
        feedback={actionFeedback}
        users={users}
        onCreate={async (payload) => {
          try {
            setActionError(null);
            setActionFeedback(null);
            await createUser(authState.token, payload);
            setActionFeedback('User created');
            await loadUsers();
            return true;
          } catch (caughtError) {
            setActionError(
              caughtError instanceof ApiClientError
                ? caughtError.message
                : 'Could not create user',
            );
            return false;
          }
        }}
        onUpdate={async (userId, payload) => {
          try {
            setActionError(null);
            setActionFeedback(null);
            await updateUser(authState.token, userId, payload);
            setActionFeedback('User updated');
            await loadUsers();
            return true;
          } catch (caughtError) {
            setActionError(
              caughtError instanceof ApiClientError
                ? caughtError.message
                : 'Could not update user',
            );
            return false;
          }
        }}
        onDelete={async (userId) => {
          try {
            setActionError(null);
            setActionFeedback(null);
            await deleteUser(authState.token, userId);
            setActionFeedback('User deleted');
            await loadUsers();
            return true;
          } catch (caughtError) {
            setActionError(
              caughtError instanceof ApiClientError
                ? caughtError.message
                : 'Could not delete user',
            );
            return false;
          }
        }}
      />
    </div>
  );
};
