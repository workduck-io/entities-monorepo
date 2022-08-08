import type { EntityItem } from 'dynamodb-toolbox';
import { TaskEntity } from './entities';

export interface Task {
  name: string;
  id: string;
}

export type TaskEntityType = EntityItem<typeof TaskEntity>;
