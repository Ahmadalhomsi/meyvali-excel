import React, { useState, useEffect } from 'react';
import {
    Typography,
    TextField,
    Button,
    Box,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Grid,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import axios from 'axios';
import toast from 'react-hot-toast';

const ColumnManagement = () => {
    const [selectedPage, setSelectedPage] = useState('');
    const [columns, setColumns] = useState<Record<string, string>>({});
    const [newColumnName, setNewColumnName] = useState('');
    const [newColumnLetter, setNewColumnLetter] = useState('');
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editingColumn, setEditingColumn] = useState({ oldName: '', newName: '', newLetter: '' });

    useEffect(() => {
        if (selectedPage) {
            fetchColumns();
        }
    }, [selectedPage]);

    const fetchColumns = async () => {
        try {
            const response = await axios.get(`/api/columns?page=${selectedPage}`);
            setColumns(response.data.columns);
        } catch (error) {
            console.error('Error fetching columns:', error);
            toast.error('Sütunlar yüklenirken bir hata oluştu.');
        }
    };

    const handlePageChange = (event: any) => {
        setSelectedPage(event.target.value);
    };

    const handleAddColumn = async () => {
        if (!newColumnName || !newColumnLetter) {
            toast.error('Lütfen sütun adı ve harfini girin.');
            return;
        }

        try {
            await axios.post('/api/columns', {
                page: selectedPage,
                columnName: newColumnName,
                columnLetter: newColumnLetter,
            });
            toast.success('Sütun başarıyla eklendi.');
            fetchColumns();
            setNewColumnName('');
            setNewColumnLetter('');
        } catch (error) {
            console.error('Error adding column:', error);
            toast.error('Sütun eklenirken bir hata oluştu.');
        }
    };

    const handleEditColumn = (columnName: any, columnLetter: any) => {
        setEditingColumn({ oldName: columnName, newName: columnName, newLetter: columnLetter });
        setEditDialogOpen(true);
    };

    const handleEditSubmit = async () => {
        try {
            await axios.put('/api/columns', {
                page: selectedPage,
                oldColumnName: editingColumn.oldName,
                newColumnName: editingColumn.newName,
                newColumnLetter: editingColumn.newLetter,
            });
            toast.success('Sütun başarıyla güncellendi.');
            fetchColumns();
            setEditDialogOpen(false);
        } catch (error) {
            console.error('Error updating column:', error);
            toast.error('Sütun güncellenirken bir hata oluştu.');
        }
    };

    const handleDeleteColumn = async (columnName: any) => {
        try {
            await axios.delete('/api/columns', {
                data: { page: selectedPage, columnName },
            });
            toast.success('Sütun başarıyla silindi.');
            fetchColumns();
        } catch (error) {
            console.error('Error deleting column:', error);
            toast.error('Sütun silinirken bir hata oluştu.');
        }
    };


    return (
        <Box sx={{ border: 1, borderColor: 'grey.300', p: 2, borderRadius: 1, mt: 2 }}>
            <Typography variant="h6" gutterBottom>
                Sütun Yönetimi
            </Typography>
            <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="demo-simple-select-label">Sayfa</InputLabel>
                <Select
                    value={selectedPage} onChange={handlePageChange} label="Sayfa">

                    <MenuItem value="Payments">Ödemeler</MenuItem>
                    <MenuItem value="Products">Ürünler</MenuItem>
                    <MenuItem value="EndOfDay">Gün Sonu</MenuItem>

                </Select>
            </FormControl>
            {selectedPage && (
                <>
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={12} sm={5}>
                            <TextField
                                fullWidth
                                label="Yeni Sütun Adı"
                                value={newColumnName}
                                onChange={(e) => setNewColumnName(e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={12} sm={5}>
                            <TextField
                                fullWidth
                                label="Yeni Sütun Harfi"
                                value={newColumnLetter}
                                onChange={(e) => setNewColumnLetter(e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={12} sm={2}>
                            <Button
                                fullWidth
                                variant="contained"
                                onClick={handleAddColumn}
                                sx={{ height: '100%' }}
                            >
                                Ekle
                            </Button>
                        </Grid>
                    </Grid>
                    <Typography variant="subtitle1" gutterBottom>
                        Mevcut Sütunlar:
                    </Typography>
                    {Object.entries(columns).map(([name, letter]) => (
                        <Box key={name} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography>
                                {name}: {letter}
                            </Typography>
                            <Box>
                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => handleEditColumn(name, letter as string)}
                                    sx={{ mr: 1 }}
                                >
                                    Düzenle
                                </Button>
                                <Button
                                    variant="outlined"
                                    color="error"
                                    size="small"
                                    onClick={() => handleDeleteColumn(name)}
                                >
                                    Sil
                                </Button>
                            </Box>
                        </Box>
                    ))}
                </>
            )}
            <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
                <DialogTitle>Sütun Düzenle</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        label="Yeni Sütun Adı"
                        value={editingColumn.newName}
                        onChange={(e) => setEditingColumn({ ...editingColumn, newName: e.target.value })}
                        sx={{ mt: 2 }}
                    />
                    <TextField
                        fullWidth
                        label="Yeni Sütun Harfi"
                        value={editingColumn.newLetter}
                        onChange={(e) => setEditingColumn({ ...editingColumn, newLetter: e.target.value })}
                        sx={{ mt: 2 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditDialogOpen(false)}>İptal</Button>
                    <Button onClick={handleEditSubmit} variant="contained">
                        Kaydet
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ColumnManagement;