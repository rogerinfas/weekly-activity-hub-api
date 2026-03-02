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

    if (rest.status !== undefined) {
      const movingToCompleted =
        rest.status === COMPLETED_STATUS && existing.status !== COMPLETED_STATUS;
      const movingFromCompleted =
        rest.status !== COMPLETED_STATUS && existing.status === COMPLETED_STATUS;

      if (movingToCompleted) {
        completedAt = new Date();
      } else if (movingFromCompleted) {
        completedAt = null;
      }
    }

    return this.prisma.task.update({
      where: { id },
      data: { ...rest, completedAt },
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
      const movingToCompleted =
        update.status === COMPLETED_STATUS &&
        existing.status !== COMPLETED_STATUS;
      const movingFromCompleted =
        update.status !== COMPLETED_STATUS &&
        existing.status === COMPLETED_STATUS;

      if (movingToCompleted) {
        completedAt = new Date();
      } else if (movingFromCompleted) {
        completedAt = null;
      }

      return this.prisma.task.update({
        where: { id: update.id },
        data: {
          status: update.status,
          order: update.order,
          completedAt,
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

    const projectCounts = tasks.reduce<Record<string, number>>((acc, t) => {
      acc[t.project] = (acc[t.project] ?? 0) + 1;
      return acc;
    }, {});

    const sortedProjects = Object.entries(projectCounts).sort(
      (a, b) => b[1] - a[1],
    );

    const topProjectEntry = sortedProjects[0] ?? null;

    return {
      tasks,
      summary: {
        total,
        completed,
        inProgress,
        topProject: topProjectEntry
          ? { project: topProjectEntry[0], count: topProjectEntry[1] }
          : null,
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
