"use client";

import { Bell, Trash2 } from "lucide-react";
import { formatDistanceToNowStrict } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Notification } from "@/lib/types";
import { ScrollArea } from "./ui/scroll-area";
import { cn } from "@/lib/utils";

interface NotificationCenterProps {
  notifications: Notification[];
  onNotificationRead: (id: string) => void;
  onClearNotifications: () => void;
}

export function NotificationCenter({ notifications, onNotificationRead, onClearNotifications }: NotificationCenterProps) {
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground">
              {unreadCount}
            </span>
          )}
          <span className="sr-only">Abrir notificaciones</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <Card className="border-0">
            <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-lg">Notificaciones</CardTitle>
                {notifications.length > 0 && (
                     <Button variant="ghost" size="sm" onClick={onClearNotifications}>Limpiar Leídas</Button>
                )}
            </CardHeader>
            <CardContent className="p-0">
                <ScrollArea className="h-72">
                    {notifications.length === 0 ? (
                         <p className="text-center text-sm text-muted-foreground py-10">No tienes notificaciones</p>
                    ) : (
                        <div className="divide-y">
                            {notifications.map(notification => (
                                <div key={notification.id} className={cn("p-4 hover:bg-muted/50", notification.read && "opacity-60")}>
                                    <p className="font-semibold">{notification.productName} ({notification.quantity})</p>
                                    <p className="text-sm">
                                        {notification.daysUntilExpiry < 0 
                                            ? `Caducó hace ${formatDistanceToNowStrict(notification.expiryDate, { locale: es })}`
                                            : `Caduca ${formatDistanceToNowStrict(notification.expiryDate, { addSuffix: true, locale: es })}`}
                                    </p>
                                    {!notification.read && (
                                         <Button variant="link" size="sm" className="p-0 h-auto" onClick={() => onNotificationRead(notification.id)}>Marcar como leído</Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </CardContent>
            {notifications.length > 0 && (
                <CardFooter className="py-2 justify-center border-t">
                    {/* Could add "view all" here */}
                </CardFooter>
            )}
        </Card>
      </PopoverContent>
    </Popover>
  );
}
