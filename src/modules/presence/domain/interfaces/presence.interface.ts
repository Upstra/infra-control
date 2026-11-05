export type PresenceStatus = 'active' | 'idle';

export interface PresenceRecord {
  route: string | null;
  title: string | null;
  lastActivityAt: string | null;
  connectedAt: string | null;
}

export interface PresenceActivity {
  route?: string | null;
  title?: string | null;
  active?: boolean;
}

export interface PresenceViewer {
  userId: string;
  isActive?: boolean;
}

export interface PresenceView {
  userId: string;
  online: boolean;
  status: PresenceStatus | null;
  route: string | null;
  title: string | null;
  lastActivityAt: string | null;
}
