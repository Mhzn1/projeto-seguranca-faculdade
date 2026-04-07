import { useQuery } from '@tanstack/react-query';
import { UserService } from '../services/user.service';

export function useAuditLogs(action?: string) {
  return useQuery({
    queryKey: ['audit-logs', action],
    queryFn: () => UserService.getAuditLogs(action),
  });
}
