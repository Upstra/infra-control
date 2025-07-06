export interface HistoryListFilters {
  action?: string | string[];
  entity?: string;
  userId?: string;
  from?: Date;
  to?: Date;
  sort?: string;
  order?: 'asc' | 'desc';
}
