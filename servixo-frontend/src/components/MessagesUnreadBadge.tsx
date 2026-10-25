import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getUnreadCount } from "../services/messageService";
import { useSocket } from "../context/SocketContext";

interface MessagesUnreadBadgeProps {
  className?: string;
  size?: "sm" | "md";
}

export function MessagesUnreadBadge({ className = "", size = "md" }: MessagesUnreadBadgeProps) {
  const queryClient = useQueryClient();
  const { socket } = useSocket();

  const { data: count = 0 } = useQuery({
    queryKey: ["messagesUnreadCount"],
    queryFn: getUnreadCount,
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = () => {
      queryClient.invalidateQueries({ queryKey: ["messagesUnreadCount"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    };

    const handleMessagesRead = () => {
      queryClient.invalidateQueries({ queryKey: ["messagesUnreadCount"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    };

    socket.on("new-message", handleNewMessage);
    socket.on("messages-read", handleMessagesRead);

    return () => {
      socket.off("new-message", handleNewMessage);
      socket.off("messages-read", handleMessagesRead);
    };
  }, [socket, queryClient]);

  if (!count || count <= 0) return null;

  const sizeClasses =
    size === "sm" ? "min-w-[16px] h-[16px] text-[9px] px-1" : "min-w-[18px] h-[18px] text-[10px] px-1.5";

  return (
    <span
      className={`inline-flex items-center justify-center bg-rose-600 text-white font-black rounded-full shadow-xs animate-in zoom-in-75 duration-200 ${sizeClasses} ${className}`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
