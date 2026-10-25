import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { getBadgeSummary } from "../services/badgeService";
import { BadgeSummary } from "../types";

export function useBadgeSummary() {
  const { token } = useAuth();
  const { socket } = useSocket();
  const queryClient = useQueryClient();

  const query = useQuery<BadgeSummary>({
    queryKey: ["badgeSummary"],
    queryFn: getBadgeSummary,
    enabled: !!token,
    refetchOnWindowFocus: true,
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (!socket) return;

    const handleInvalidate = () => {
      queryClient.invalidateQueries({ queryKey: ["badgeSummary"] });
    };

    socket.on("new-message", handleInvalidate);
    socket.on("messages-read", handleInvalidate);
    socket.on("new-notification", handleInvalidate);

    return () => {
      socket.off("new-message", handleInvalidate);
      socket.off("messages-read", handleInvalidate);
      socket.off("new-notification", handleInvalidate);
    };
  }, [socket, queryClient]);

  return query;
}
