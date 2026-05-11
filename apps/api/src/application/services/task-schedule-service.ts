import { ValidationError } from '../../core/errors/validation-error';

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const hourPattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

export class TaskScheduleService {
  public validate(date: string, hour: string): void {
    if (!datePattern.test(date)) {
      throw new ValidationError('Date must use the YYYY-MM-DD format');
    }

    if (!hourPattern.test(hour)) {
      throw new ValidationError('Hour must use the HH:mm format');
    }

    const scheduledFor = this.toDate(date, hour);
    if (Number.isNaN(scheduledFor.getTime())) {
      throw new ValidationError('Invalid task schedule');
    }

    if (scheduledFor.getTime() < Date.now()) {
      throw new ValidationError('Task schedule cannot be in the past');
    }
  }

  public toDate(date: string, hour: string): Date {
    return new Date(`${date}T${hour}:00`);
  }
}
