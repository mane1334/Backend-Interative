import React, { createContext, useContext, useState, useCallback, ReactNode, useMemo } from 'react';

interface ServerConfig {
    serverIp: string;
    tableNumber: string;
    baseUrl: string;
    apiUrl: string;
    wsUrl: string;
}

interface ServerConfigContextType extends ServerConfig {
    setServerIp: (ip: string) => void;
    setTableNumber: (table: string) => void;
    resolveImageUrl: (path: string | undefined) => string;
}

const defaultConfig: ServerConfig = {
    serverIp: '10.0.2.2',
    tableNumber: '1',
    baseUrl: 'http://10.0.2.2:3000',
    apiUrl: 'http://10.0.2.2:3000/api',
    wsUrl: 'ws://10.0.2.2:3000',
};

const ServerConfigContext = createContext<ServerConfigContextType | undefined>(undefined);

interface ServerConfigProviderProps {
    children: ReactNode;
    initialIp?: string;
    initialTable?: string;
}

export const ServerConfigProvider: React.FC<ServerConfigProviderProps> = ({
    children,
    initialIp = '10.0.2.2',
    initialTable = '1',
}) => {
    const [serverIp, setServerIpState] = useState(initialIp);
    const [tableNumber, setTableNumber] = useState(initialTable);

    const setServerIp = useCallback((ip: string) => {
        setServerIpState(ip);
    }, []);

    const config = useMemo<ServerConfig>(() => ({
        serverIp,
        tableNumber,
        baseUrl: `http://${serverIp}:3000`,
        apiUrl: `http://${serverIp}:3000/api`,
        wsUrl: `ws://${serverIp}:3000`,
    }), [serverIp, tableNumber]);

    const resolveImageUrl = useCallback((path: string | undefined): string => {
        if (!path) return 'https://via.placeholder.com/300';
        if (path.startsWith('http')) return path;
        if (path.startsWith('/')) return `${config.baseUrl}${path}`;
        return `${config.baseUrl}/${path}`;
    }, [config.baseUrl]);

    const value = useMemo<ServerConfigContextType>(() => ({
        ...config,
        setServerIp,
        setTableNumber,
        resolveImageUrl,
    }), [config, setServerIp, setTableNumber, resolveImageUrl]);

    return (
        <ServerConfigContext.Provider value={value}>
            {children}
        </ServerConfigContext.Provider>
    );
};

export const useServerConfig = (): ServerConfigContextType => {
    const context = useContext(ServerConfigContext);
    if (!context) {
        throw new Error('useServerConfig must be used within a ServerConfigProvider');
    }
    return context;
};

export default ServerConfigContext;
