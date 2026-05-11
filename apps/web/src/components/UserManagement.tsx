import { FormEvent, useState } from 'react';
import { User } from '../types/user';
import { Role } from '../types/auth';

interface UserManagementProps {
  users: User[];
  error?: string | null;
  feedback?: string | null;
  onCreate: (payload: {
    username: string;
    email: string;
    password: string;
    displayName?: string;
    role: Role;
  }) => Promise<boolean>;
  onUpdate: (
    userId: string,
    payload: Partial<{
      email: string;
      password: string;
      displayName?: string;
      role: Role;
    }>,
  ) => Promise<boolean>;
  onDelete: (userId: string) => Promise<boolean>;
}

export const UserManagement = ({
  users,
  onCreate,
  onUpdate,
  onDelete,
}: UserManagementProps): JSX.Element => {
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    displayName: '',
    role: 'BASIC' as Role,
  });

  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const created = await onCreate(form);

    if (created) {
      setForm({
        username: '',
        email: '',
        password: '',
        displayName: '',
        role: 'BASIC',
      });
    }
  };

  const handleToggleRole = async (user: User) => {
    const nextRole = user.role === 'ADMIN' ? 'BASIC' : 'ADMIN';
    setUpdatingRoleId(user.id);

    try {
      await onUpdate(user.id, { role: nextRole });
    } finally {
      setUpdatingRoleId((current) => (current === user.id ? null : current));
    }
  };

  return (
    <div className="users-grid">
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Create user</h2>
            <p className="muted">Admin-only workspace for account management</p>
          </div>
        </div>

        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            <span>Username</span>
            <input
              required
              value={form.username}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  username: event.target.value,
                }))
              }
            />
          </label>
          <label>
            <span>Email</span>
            <input
              required
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
            />
          </label>
          <label>
            <span>Password</span>
            <input
              required
              type="password"
              value={form.password}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  password: event.target.value,
                }))
              }
            />
          </label>
          <label>
            <span>Display name</span>
            <input
              value={form.displayName}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  displayName: event.target.value,
                }))
              }
            />
          </label>
          <label>
            <span>Role</span>
            <select
              value={form.role}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  role: event.target.value as Role,
                }))
              }
            >
              <option value="BASIC">Basic</option>
              <option value="ADMIN">Admin</option>
            </select>
          </label>

          <div className="form-actions">
            <button className="primary-button" type="submit">
              Create user
            </button>
          </div>
        </form>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Users</h2>
            <p className="muted">
              Edit role, profile and credentials when needed
            </p>
          </div>
        </div>

        <div className="task-list">
          {users.map((user) => (
            <article className="task-row" key={user.id}>
              <div>
                <div className="task-row-top">
                  <h3>{user.displayName ?? user.username}</h3>
                  <span
                    className={
                      user.role === 'ADMIN' ? 'pill warning' : 'pill neutral'
                    }
                  >
                    {user.role}
                  </span>
                </div>
                <p className="muted">{user.email}</p>
              </div>
              <div className="task-actions">
                <button
                  className="ghost-button"
                  disabled={updatingRoleId === user.id}
                  onClick={() => {
                    void handleToggleRole(user);
                  }}
                  type="button"
                >
                  {updatingRoleId === user.id ? 'Updating...' : 'Toggle role'}
                </button>
                <button
                  className="danger-button"
                  onClick={() => void onDelete(user.id)}
                  type="button"
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};
