export interface HistoryFeedQuery {
  entities: string[];
  actions: string[];
  from?: Date;
  to?: Date;
  before?: { at: Date; id: string };
  limit: number;
}
