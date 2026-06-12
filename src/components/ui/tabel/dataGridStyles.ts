import type { SxProps, Theme } from '@mui/material';

export const defaultDataGridSx: SxProps<Theme> = {
    border: '1px solid #e5e7eb',
    '& .MuiDataGrid-columnHeaders': {
        backgroundColor: '#f3f4f6',
        color: 'black',
        fontWeight: 'bold',
        borderBottom: '1px solid #9ca3af',
    },
    width: '100%',
    '& .MuiDataGrid-cell:focus': { outline: 'none' },
    '& .MuiDataGrid-columnHeader:focus': { outline: 'none' },
};
