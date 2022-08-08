export interface BatchRequest<T> {
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  data: T;
}
[];
