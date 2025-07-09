export interface IDashboardLayout {
  id: string;
  name: string;
  columns: number;
  rowHeight: number;
  isDefault: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}
