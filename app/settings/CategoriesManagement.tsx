import React, { useState, useEffect } from 'react';
import {
    Typography,
    TextField,
    Button,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Box,
} from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import axios from 'axios';
import toast from 'react-hot-toast';

const CategoriesManagement = () => {
    const [categories, setCategories] = useState([]);
    const [newCategory, setNewCategory] = useState('');

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await axios.get('/api/categories');
            setCategories(response.data.categories);
        } catch (error) {
            console.error('Error fetching categories:', error);
            toast.error('Kategoriler yüklenirken bir hata oluştu.');
        }
    };

    const handleAddCategory = async () => {
        if (!newCategory.trim()) return;
        try {
            await axios.post('/api/categories', { category: newCategory });
            setNewCategory('');
            fetchCategories();
            toast.success('Kategori başarıyla eklendi.');
        } catch (error) {
            console.error('Error adding category:', error);
            toast.error('Kategori eklenirken bir hata oluştu.');
        }
    };

    const handleDeleteCategory = async (category : any) => {
        try {
            await axios.delete('/api/categories', { data: { category } });
            fetchCategories();
            toast.success('Kategori başarıyla silindi.');
        } catch (error) {
            console.error('Error deleting category:', error);
            toast.error('Kategori silinirken bir hata oluştu.');
        }
    };

    return (
        <Box sx={{ border: 1, borderColor: 'grey.300', p: 2, borderRadius: 1, mt: 2 }}>
            <Typography variant="h6" gutterBottom>
                Kategori Yönetimi
            </Typography>
            <Box sx={{ display: 'flex', mb: 2 }}>
                <TextField
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Yeni kategori"
                    fullWidth
                    variant="outlined"
                    size="small"
                />
                <Button
                    onClick={handleAddCategory}
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    sx={{ ml: 1 }}
                >
                    Ekle
                </Button>
            </Box>
            <List>
                {categories.map((category, index) => (
                    <ListItem key={index} divider>
                        <ListItemText primary={category} />
                        <ListItemSecondaryAction>
                            <IconButton
                                edge="end"
                                aria-label="delete"
                                onClick={() => handleDeleteCategory(category)}
                            >
                                <DeleteIcon />
                            </IconButton>
                        </ListItemSecondaryAction>
                    </ListItem>
                ))}
            </List>
        </Box>
    );
};

export default CategoriesManagement;