import { useEffect, useState } from 'react';
import { Wifi, WifiOff, Clock, HelpCircle, RefreshCw } from 'lucide-react';
import { useServerHealth, getServerTestUrls } from '@/hooks/useServerHealth';
import { VIDEO_SERVERS } from '@/hooks/useServerPreference';
import { Button } from '@/components/ui/button';

interface ServerHealthBadgeProps {
  serverId: string;
  compact?: boolean;
}

export const ServerHealthBadge = ({ serverId, compact = false }: ServerHealthBadgeProps) => {
  const { getServerHealth, getStatusBadgeClass } = useServerHealth();
  const health = getServerHealth(serverId);

  const getIcon = () => {
    switch (health?.status) {
      case 'online':
        return <Wifi className="h-3 w-3" />;
      case 'slow':
        return <Clock className="h-3 w-3" />;
      case 'offline':
        return <WifiOff className="h-3 w-3" />;
      default:
        return <HelpCircle className="h-3 w-3" />;
    }
  };

  const getLabel = () => {
    switch (health?.status) {
      case 'online':
        return health.latency ? `${health.latency}ms` : 'Online';
      case 'slow':
        return 'Slow';
      case 'offline':
        return 'Down';
      default:
        return '?';
    }
  };

  const getDotClass = () => {
    switch (health?.status) {
      case 'online':
        return 'bg-emerald-500';
      case 'slow':
        return 'bg-amber-500';
      case 'offline':
        return 'bg-destructive';
      default:
        return 'bg-muted-foreground/50';
    }
  };

  if (compact) {
    return (
      <span 
        className={`inline-flex items-center justify-center w-2 h-2 rounded-full ${getDotClass()}`}
        title={health?.status || 'Unknown'}
      />
    );
  }

  return (
    <span 
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium rounded border ${getStatusBadgeClass(health?.status || 'unknown')}`}
    >
      {getIcon()}
      <span>{getLabel()}</span>
    </span>
  );
};

// Full health check panel
export const ServerHealthPanel = () => {
  const { healthData, isChecking, checkAllServers, lastFullCheck } = useServerHealth();
  const [isVisible, setIsVisible] = useState(false);

  const runHealthCheck = () => {
    const testUrls = getServerTestUrls();
    checkAllServers(testUrls);
    setIsVisible(true);
  };

  // Auto-check on first view
  useEffect(() => {
    if (isVisible && Object.keys(healthData).length === 0) {
      runHealthCheck();
    }
  }, [isVisible]);

  const onlineCount = Object.values(healthData).filter(h => h.status === 'online').length;
  const slowCount = Object.values(healthData).filter(h => h.status === 'slow').length;
  const offlineCount = Object.values(healthData).filter(h => h.status === 'offline').length;

  const getBorderClass = (status?: string) => {
    switch (status) {
      case 'online':
        return 'border-emerald-500/30 bg-emerald-500/5';
      case 'slow':
        return 'border-amber-500/30 bg-amber-500/5';
      case 'offline':
        return 'border-destructive/30 bg-destructive/5';
      default:
        return 'border-border bg-muted/30';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Server Status</span>
          {Object.keys(healthData).length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="text-emerald-500">{onlineCount} online</span>
              {slowCount > 0 && <span className="text-amber-500">{slowCount} slow</span>}
              {offlineCount > 0 && <span className="text-destructive">{offlineCount} down</span>}
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={runHealthCheck}
          disabled={isChecking}
          className="h-7 text-xs gap-1"
        >
          <RefreshCw className={`h-3 w-3 ${isChecking ? 'animate-spin' : ''}`} />
          {isChecking ? 'Checking...' : 'Check All'}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {VIDEO_SERVERS.map(server => {
          const health = healthData[server.id];
          return (
            <div
              key={server.id}
              className={`flex items-center justify-between p-2 rounded-lg border text-sm ${getBorderClass(health?.status)}`}
            >
              <div className="flex items-center gap-1.5">
                <span>{server.flag}</span>
                <span className="font-medium">{server.name}</span>
              </div>
              <ServerHealthBadge serverId={server.id} />
            </div>
          );
        })}
      </div>

      {lastFullCheck > 0 && (
        <p className="text-[10px] text-muted-foreground text-center">
          Last checked: {new Date(lastFullCheck).toLocaleTimeString()}
        </p>
      )}
    </div>
  );
};
