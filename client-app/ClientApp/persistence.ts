
import RNFS from 'react-native-fs';

const FILE_PATH = `${RNFS.DocumentDirectoryPath}/app_state.json`;

export interface AppState {
    currentOrder: any | null;
    serverIp: string;
    tableNumber: string;
    currentTheme: string;
    currentLanguage: string;
}

export const saveState = async (state: Partial<AppState>) => {
    try {
        let existing: AppState = await loadState();
        const newState = { ...existing, ...state };
        await RNFS.writeFile(FILE_PATH, JSON.stringify(newState), 'utf8');
    } catch (e) {
        console.error("Failed to save state", e);
    }
}

export const loadState = async (): Promise<AppState> => {
    try {
        if (await RNFS.exists(FILE_PATH)) {
            const content = await RNFS.readFile(FILE_PATH, 'utf8');
            return JSON.parse(content);
        }
    } catch (e) {
        console.error("Failed to load state", e);
    }
    return {
        currentOrder: null,
        serverIp: '10.0.2.2',
        tableNumber: '1',
        currentTheme: 'dark',
        currentLanguage: 'pt'
    };
}
