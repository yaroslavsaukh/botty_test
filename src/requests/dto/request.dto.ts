//In the future we can move statuses to separate enum and reuse it multiple times
export interface RequestObject {
  id: string;
  text: string;
  status: 'NEW' | 'IN_PROGRESS' | 'DONE';
  createdAt: Date;
  updatedAt: Date;
}
