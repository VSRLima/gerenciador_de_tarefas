import { TaskAccessService } from '../../src/application/services/task-access-service';
import { TaskScheduleService } from '../../src/application/services/task-schedule-service';
import { Role } from '../../src/core/enums/role';

describe('TaskScheduleService', () => {
  it('creates a valid Date from date and hour strings', () => {
    const service = new TaskScheduleService();

    const result = service.toDate('2026-05-10', '14:30');

    expect(Number.isNaN(result.getTime())).toBe(false);
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(4);
    expect(result.getDate()).toBe(10);
    expect(result.getHours()).toBe(14);
    expect(result.getMinutes()).toBe(30);
  });

  it('throws when the hour format is invalid', () => {
    const service = new TaskScheduleService();

    expect(() => service.validate('2026-05-10', '24:61')).toThrow(
      'Hour must use the HH:mm format',
    );
  });
});

describe('TaskAccessService', () => {
  it('blocks basic users from accessing tasks they do not own', () => {
    const service = new TaskAccessService();

    expect(() =>
      service.ensureCanAccess(
        { id: 'user-1', username: 'basic', role: Role.BASIC },
        {
          id: 'task-1',
          title: 'Task',
          date: '2026-05-10',
          hour: '14:30',
          scheduledFor: new Date('2026-05-10T14:30:00.000Z'),
          isFinished: false,
          ownerId: 'user-2',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ),
    ).toThrow('This task does not belong to the authenticated user');
  });
});
