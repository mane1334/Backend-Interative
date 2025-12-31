export interface Theme {
    name: string;
    colors: {
        background: string;
        surface: string;
        primary: string;
        secondary: string;
        text: string;
        textSecondary: string;
        border: string;
        success: string;
        error: string;
        warning: string;
        overlay: string;
    };
    dark: boolean;
}

export const themes: Record<string, Theme> = {
    dark: {
        name: 'Dark',
        colors: {
            background: '#020617', // Slate 950
            surface: '#1e293b',    // Slate 800
            primary: '#2563eb',    // Blue 600
            secondary: '#334155',  // Slate 700
            text: '#f8fafc',       // Slate 50
            textSecondary: '#cbd5e1', // Slate 300 (Lighter for better contrast)
            border: '#1e293b',
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            overlay: 'rgba(2, 6, 23, 0.98)',
        },
        dark: true,
    },
    light: {
        name: 'Light',
        colors: {
            background: '#f8fafc', // Slate 50
            surface: '#ffffff',    // White
            primary: '#2563eb',    // Blue 600
            secondary: '#e2e8f0',  // Slate 200
            text: '#0f172a',       // Slate 900
            textSecondary: '#64748b', // Slate 500
            border: '#e2e8f0',
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            overlay: 'rgba(255, 255, 255, 0.95)',
        },
        dark: false,
    },
    ocean: {
        name: 'Ocean',
        colors: {
            background: '#0c4a6e', // Sky 900
            surface: '#075985',    // Sky 800
            primary: '#38bdf8',    // Sky 400
            secondary: '#0369a1',  // Sky 700
            text: '#f0f9ff',       // Sky 50
            textSecondary: '#bae6fd', // Sky 200
            border: '#075985',
            success: '#4ade80',
            error: '#f87171',
            warning: '#fbbf24',
            overlay: 'rgba(12, 74, 110, 0.95)',
        },
        dark: true,
    },
    sunset: {
        name: 'Sunset',
        colors: {
            background: '#451a03', // Amber 950
            surface: '#78350f',    // Amber 900
            primary: '#f59e0b',    // Amber 500
            secondary: '#92400e',  // Amber 800
            text: '#fffbeb',       // Amber 50
            textSecondary: '#fde68a', // Amber 200
            border: '#78350f',
            success: '#4ade80',
            error: '#f87171',
            warning: '#fbbf24',
            overlay: 'rgba(69, 26, 3, 0.95)',
        },
        dark: true,
    },
};
