import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [connected, setConnected] = useState(false);
  const stompClientRef = useRef(null);
  const subscriptionsRef = useRef({});

  useEffect(() => {
    if (!token || !user) {
      if (stompClientRef.current) {
        stompClientRef.current.disconnect();
        stompClientRef.current = null;
        setConnected(false);
      }
      return;
    }

    const socket = new SockJS('http://localhost:8080/ws');
    const client = Stomp.over(socket);
    client.debug = null; // Disable noisy debug logs in console

    client.connect(
      { Authorization: `Bearer ${token}` },
      () => {
        setConnected(true);
        stompClientRef.current = client;

        // Automatically send user.online event
        client.send(
          '/app/user.online',
          {},
          JSON.stringify({ userId: user.id, username: user.username })
        );
      },
      (error) => {
        console.error('STOMP WebSocket error:', error);
        setConnected(false);
      }
    );

    return () => {
      if (client && client.connected) {
        client.send(
          '/app/user.offline',
          {},
          JSON.stringify({ userId: user.id, username: user.username })
        );
        client.disconnect();
      }
      stompClientRef.current = null;
      setConnected(false);
    };
  }, [token, user]);

  const subscribe = (destination, callback) => {
    if (!stompClientRef.current || !stompClientRef.current.connected) return null;

    const sub = stompClientRef.current.subscribe(destination, (message) => {
      try {
        const body = JSON.parse(message.body);
        callback(body);
      } catch (e) {
        callback(message.body);
      }
    });

    return sub;
  };

  const publish = (destination, payload) => {
    if (stompClientRef.current && stompClientRef.current.connected) {
      stompClientRef.current.send(destination, {}, JSON.stringify(payload));
    }
  };

  return (
    <SocketContext.Provider value={{ connected, subscribe, publish, stompClient: stompClientRef.current }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
