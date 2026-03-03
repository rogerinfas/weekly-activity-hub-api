import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createTaskDto: CreateTaskDto) {
    return this.tasksService.create(createTaskDto);
  }

  @Get()
  findAll() {
    return this.tasksService.findAll();
  }

   @Get('metrics')
   @HttpCode(HttpStatus.OK)
   metrics(
     @Query('startDate') startDate?: string,
     @Query('endDate') endDate?: string,
   ) {
     return this.tasksService.getMetrics({ startDate, endDate });
   }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  @Post(':id/timer/start')
  @HttpCode(HttpStatus.OK)
  startTimer(@Param('id') id: string) {
    return this.tasksService.startTimer(id);
  }

  @Post(':id/timer/stop')
  @HttpCode(HttpStatus.OK)
  stopTimer(@Param('id') id: string) {
    return this.tasksService.stopTimer(id);
  }

  @Patch('reorder/batch')
  @HttpCode(HttpStatus.OK)
  reorderBatch(
    @Body()
    body: {
      updates: { id: string; status: string; order: number }[];
    },
  ) {
    return this.tasksService.reorderMany(body.updates);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto) {
    return this.tasksService.update(id, updateTaskDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.tasksService.remove(id);
  }
}
