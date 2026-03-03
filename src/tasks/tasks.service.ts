import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

const COMPLETED_STATUS = 'completado';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createTaskDto: CreateTaskDto) {
    const { completedAt: _clientCompletedAt, ...rest } = createTaskDto;

    const completedAt = rest.status === COMPLETED_STATUS ? new Date() : null;

    return this.prisma.task.create({
      data: { ...rest, completedAt },
    });
  }

  async findAll() {
    return this.prisma.task.findMany({
      orderBy: { order: 'asc' },
    });
  }

  async findOne(id: string) {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) {
      throw new NotFoundException(`Task with id ${id} not found`);
    }
    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto) {
    const existing = await this.findOne(id);
    const { completedAt: _clientCompletedAt, ...rest } = updateTaskDto;

    let completedAt: Date | null = existing.completedAt;
    let activeTimerStartedAt = existing.activeTimerStartedAt;
    let totalTrackedSeconds = existing.totalTrackedSeconds;

    if (rest.status !== undefined) {
      const movingToCompleted =
        rest.status === COMPLETED_STATUS && existing.status !== COMPLETED_STATUS;
      const movingFromCompleted =
        rest.status !== COMPLETED_STATUS && existing.status === COMPLETED_STATUS;

      if (movingToCompleted) {
        completedAt = new Date();
        if (activeTimerStartedAt) {
          const now = new Date();
          const deltaMs = now.getTime() - activeTimerStartedAt.getTime();
          const deltaSeconds = Math.max(0, Math.floor(deltaMs / 1000));
          totalTrackedSeconds += deltaSeconds;
          activeTimerStartedAt = null;
        }
      } else if (movingFromCompleted) {
        completedAt = null;
        if (!activeTimerStartedAt) {
          activeTimerStartedAt = new Date();
        }
      }
    }

    return this.prisma.task.update({
      where: { id },
      data: { ...rest, completedAt, activeTimerStartedAt, totalTrackedSeconds },
    });
  }

  async startTimer(id: string) {
    const existing = await this.findOne(id);

    if (existing.activeTimerStartedAt) {
      return existing;
    }

    return this.prisma.task.update({
      where: { id },
      data: {
        activeTimerStartedAt: new Date(),
      },
    });
  }

  async stopTimer(id: string) {
    const existing = await this.findOne(id);

    if (!existing.activeTimerStartedAt) {
      return existing;
    }

    const now = new Date();
    const startedAt = existing.activeTimerStartedAt;
    const deltaMs = now.getTime() - startedAt.getTime();
    const deltaSeconds = Math.max(0, Math.floor(deltaMs / 1000));

    return this.prisma.task.update({
      where: { id },
      data: {
        activeTimerStartedAt: null,
        totalTrackedSeconds: existing.totalTrackedSeconds + deltaSeconds,
      },
    });
  }

  async reorderMany(
    updates: { id: string; status: string; order: number }[],
  ) {
    if (!updates || updates.length === 0) {
      return [];
    }

    const ids = updates.map(u => u.id);
    const existingTasks = await this.prisma.task.findMany({
      where: { id: { in: ids } },
    });

    const existingById = new Map(existingTasks.map(t => [t.id, t]));

    const operations = updates.map(update => {
      const existing = existingById.get(update.id);
      if (!existing) {
        return null;
      }

      let completedAt = existing.completedAt;
      let activeTimerStartedAt = existing.activeTimerStartedAt;
      let totalTrackedSeconds = existing.totalTrackedSeconds;
      const movingToCompleted =
        update.status === COMPLETED_STATUS &&
        existing.status !== COMPLETED_STATUS;
      const movingFromCompleted =
        update.status !== COMPLETED_STATUS &&
        existing.status === COMPLETED_STATUS;

      if (movingToCompleted) {
        completedAt = new Date();
        if (activeTimerStartedAt) {
          const now = new Date();
          const deltaMs = now.getTime() - activeTimerStartedAt.getTime();
          const deltaSeconds = Math.max(0, Math.floor(deltaMs / 1000));
          totalTrackedSeconds += deltaSeconds;
          activeTimerStartedAt = null;
        }
      } else if (movingFromCompleted) {
        completedAt = null;
        if (!activeTimerStartedAt) {
          activeTimerStartedAt = new Date();
        }
      }

      return this.prisma.task.update({
        where: { id: update.id },
        data: {
          status: update.status,
          order: update.order,
          completedAt,
          activeTimerStartedAt,
          totalTrackedSeconds,
        },
      });
    }).filter((op): op is any => op !== null);

    if (operations.length === 0) {
      return [];
    }

    return this.prisma.$transaction(operations);
  }

  async getMetrics(params: { startDate?: string; endDate?: string }) {
    const { startDate, endDate } = params;

    let where: any = undefined;

    if (startDate || endDate) {
      const start = startDate ? new Date(startDate) : undefined;
      const end = endDate ? new Date(endDate) : undefined;

      if (start) {
        start.setHours(0, 0, 0, 0);
      }
      if (end) {
        end.setHours(23, 59, 59, 999);
      }

      where = {
        OR: [
          {
            date: {
              ...(start && { gte: start }),
              ...(end && { lte: end }),
            },
          },
          {
            AND: [
              { date: null },
              {
                createdAt: {
                  ...(start && { gte: start }),
                  ...(end && { lte: end }),
                },
              },
            ],
          },
        ],
      };
    }

    const tasks = await this.prisma.task.findMany({
      where,
      orderBy: { order: 'asc' },
    });

    const total = tasks.length;
    const completed = tasks.filter(t => t.status === COMPLETED_STATUS).length;
    const inProgress = tasks.filter(t => t.status === 'en-progreso').length;

    const totalTrackedSecondsGlobal = tasks.reduce(
      (acc, t) => acc + (t.totalTrackedSeconds ?? 0),
      0,
    );

    const projectTime = tasks.reduce<Record<string, number>>((acc, t) => {
      acc[t.project] = (acc[t.project] ?? 0) + (t.totalTrackedSeconds ?? 0);
      return acc;
    }, {});

    const projectCounts = tasks.reduce<Record<string, number>>((acc, t) => {
      acc[t.project] = (acc[t.project] ?? 0) + 1;
      return acc;
    }, {});

    const sortedProjects = Object.entries(projectCounts).sort(
      (a, b) => b[1] - a[1],
    );

    const topProjectEntry = sortedProjects[0] ?? null;

    const timeByProject = Object.entries(projectTime)
      .map(([project, totalSeconds]) => ({ project, totalSeconds }))
      .sort((a, b) => b.totalSeconds - a.totalSeconds);

    const topTasksByTime = [...tasks]
      .filter(t => (t.totalTrackedSeconds ?? 0) > 0)
      .sort((a, b) => (b.totalTrackedSeconds ?? 0) - (a.totalTrackedSeconds ?? 0))
      .slice(0, 10)
      .map(t => ({
        id: t.id,
        title: t.title,
        project: t.project,
        totalSeconds: t.totalTrackedSeconds ?? 0,
      }));

    return {
      tasks,
      summary: {
        total,
        completed,
        inProgress,
        topProject: topProjectEntry
          ? { project: topProjectEntry[0], count: topProjectEntry[1] }
          : null,
        totalTrackedSecondsGlobal,
        timeByProject,
        topTasksByTime,
      },
    };
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.task.delete({
      where: { id },
    });
  }
}
