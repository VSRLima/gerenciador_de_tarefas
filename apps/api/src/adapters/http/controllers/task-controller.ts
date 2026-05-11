import { Request, Response } from 'express';
import { ValidationError } from '../../../core/errors/validation-error';
import { successResponse } from '../../../shared/http/api-response';
import { HttpStatus } from '../../../shared/http/http-status';
import { CreateTaskInput } from '../../../application/dto/task-dto';
import { TaskService } from '../../../application/services/task-service';
import {
  createTasksSchema,
  updateTaskSchema,
} from '../validators/request-schemas';

export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  public create = async (req: Request, res: Response): Promise<void> => {
    const parsedBody = createTasksSchema.parse(req.body);
    const tasks = Array.isArray((parsedBody as { tasks?: unknown }).tasks)
      ? (parsedBody as { tasks: CreateTaskInput[] }).tasks
      : [parsedBody as CreateTaskInput];

    if (!req.user) {
      throw new ValidationError('Authenticated user is missing');
    }

    const result = await this.taskService.create(req.user, tasks);
    const status =
      result.mode === 'queued' ? HttpStatus.ACCEPTED : HttpStatus.CREATED;
    res
      .status(status)
      .json(successResponse(result, 'Tasks processed successfully'));
  };

  public list = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new ValidationError('Authenticated user is missing');
    }

    const status = req.query.status;
    const result = await this.taskService.list(req.user, {
      search:
        typeof req.query.search === 'string' ? req.query.search : undefined,
      status:
        status === 'all' ||
        status === 'finished' ||
        status === 'pending' ||
        status === 'scheduled'
          ? status
          : undefined,
    });

    res.status(HttpStatus.OK).json(successResponse(result));
  };

  public getById = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new ValidationError('Authenticated user is missing');
    }

    const taskId = String(req.params.id);
    const task = await this.taskService.getById(req.user, taskId);
    res.status(HttpStatus.OK).json(successResponse(task));
  };

  public update = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new ValidationError('Authenticated user is missing');
    }

    const input = updateTaskSchema.parse(req.body);
    const taskId = String(req.params.id);
    const task = await this.taskService.update(req.user, taskId, input);
    res
      .status(HttpStatus.OK)
      .json(successResponse(task, 'Task updated successfully'));
  };

  public delete = async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new ValidationError('Authenticated user is missing');
    }

    const taskId = String(req.params.id);
    await this.taskService.delete(req.user, taskId);
    res
      .status(HttpStatus.OK)
      .json(successResponse({ id: taskId }, 'Task deleted successfully'));
  };
}
