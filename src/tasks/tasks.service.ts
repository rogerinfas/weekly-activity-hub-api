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

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.task.delete({
      where: { id },
    });
  }
}
