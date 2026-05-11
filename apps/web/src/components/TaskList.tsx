import { Task } from '../types/task';

interface TaskListProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => Promise<void>;
  onToggleFinished: (task: Task) => Promise<void>;
  showOwner?: boolean;
}

export const TaskList = ({
  tasks,
  onEdit,
  onDelete,
  onToggleFinished,
  showOwner = false,
}: TaskListProps): JSX.Element => (
  <div className="task-list">
    {tasks.map((task) => (
      <article className="task-row" key={task.id}>
        <div>
          <div className="task-row-top">
            <h3>{task.title}</h3>
            <span className={task.isFinished ? 'pill success' : 'pill neutral'}>
              {task.isFinished ? 'Finished' : 'Open'}
            </span>
          </div>
          <p className="muted">{task.description || 'No description'}</p>
          <div className="task-meta">
            <span>{task.date}</span>
            <span>{task.hour}</span>
            {showOwner ? (
              <span>Owner: {task.ownerName ?? task.ownerId}</span>
            ) : null}
          </div>
        </div>

        <div className="task-actions">
          <button
            className="ghost-button"
            onClick={() => onToggleFinished(task)}
            type="button"
          >
            {task.isFinished ? 'Reopen' : 'Finish'}
          </button>
          <button
            className="ghost-button"
            onClick={() => onEdit(task)}
            type="button"
          >
            Edit
          </button>
          <button
            className="danger-button"
            onClick={() => void onDelete(task.id)}
            type="button"
          >
            Delete
          </button>
        </div>
      </article>
    ))}
  </div>
);
