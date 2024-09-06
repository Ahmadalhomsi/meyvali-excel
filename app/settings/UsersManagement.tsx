import React, { useState, useEffect } from 'react';
import { Box, Typography, Select, MenuItem, Button, CircularProgress, Avatar, TextField } from '@mui/material';
import axios from 'axios';
import toast from 'react-hot-toast';

const UserManagement = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [selectedUser, setSelectedUser] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [error, setError] = useState<String | null>(null);
    const [newUserEmail, setNewUserEmail] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setIsFetching(true);
        setError(null);
        try {
            const response = await axios.get('/api/clerk-users');
            if (Array.isArray(response.data)) {
                setUsers(response.data);
            } else {
                throw new Error('Invalid data format received from server');
            }
        } catch (error) {
            console.log('Error fetching users:', error);
            setError('Kullanıcılar yüklenirken bir hata oluştu.');
            toast.error('Kullanıcılar yüklenirken bir hata oluştu.');
        } finally {
            setIsFetching(false);
        }
    };

    const handleUserChange = (event: any) => {
        setSelectedUser(event.target.value);
    };

    const handleRoleChange = async (role: any) => {
        if (!selectedUser) {
            toast.error('Lütfen bir kullanıcı seçin.');
            return;
        }

        setIsLoading(true);
        try {
            await axios.post('/api/clerk-users', {
                userId: selectedUser,
                role: role
            });
            toast.success('Kullanıcı rolü başarıyla güncellendi.');
            fetchUsers(); // Refresh the user list
        } catch (error) {
            console.log('Error updating user role:', error);
            toast.error('Kullanıcı rolü güncellenirken bir hata oluştu.');
        } finally {
            setIsLoading(false);
        }
    };

    async function handleSendInvite() {
        const response = await fetch('/api/generate-invite-link', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: newUserEmail }),
        });


        const data = await response.json();
        if (data.invitation) {
            console.log('Invitation sent:', data.invitation);
            toast.success('Davetiye başarıyla gönderildi.');
        } else {
            console.log('Error:', data.error.errors);
            toast.error('Davetiye gönderilirken bir hata oluştu.');

            if (data.error.errors[0].message === "duplicate invitation") {
                toast.error('Bu e-posta adresine zaten bir davetiye gönderilmiş.');
            }
            else if (data.error.errors[0].message === "is invalid") {
                toast.error('Geçersiz e-posta adresi.');
            }
        }
    }

    return (
        <Box sx={{ border: 1, borderColor: 'grey.300', p: 2, borderRadius: 1, mt: 2 }}>
            <Typography variant="h6" gutterBottom>
                KULLANICI YÖNETİMİ
            </Typography>
            {isFetching ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                    <CircularProgress />
                </Box>
            ) : error ? (
                <Typography color="error">{error}</Typography>
            ) : (
                <>
                    <Select
                        value={selectedUser}
                        onChange={handleUserChange}
                        displayEmpty
                        fullWidth
                        sx={{ mb: 2 }}
                    >
                        <MenuItem value="" disabled>
                            Kullanıcı seçin
                        </MenuItem>
                        {users.map((user: any) => (
                            <MenuItem key={user.id} value={user.id} sx={{ display: 'flex', alignItems: 'center' }}>
                                <Avatar src={user.imageUrl} alt={`${user.firstName} ${user.lastName}`} sx={{ mr: 1, width: 24, height: 24 }} />
                                {user.firstName} {user.lastName} ({user.email}) - {user.role}
                            </MenuItem>
                        ))}
                    </Select>
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={() => handleRoleChange('admin')}
                            disabled={isLoading || !selectedUser}
                        >
                            ADMİN YAP
                        </Button>
                        <Button
                            variant="contained"
                            color="secondary"
                            onClick={() => handleRoleChange('supervisor')}
                            disabled={isLoading || !selectedUser}
                        >
                            SUPERVISOR YAP
                        </Button>
                        <Button
                            variant="contained"
                            onClick={() => handleRoleChange('normal')}
                            disabled={isLoading || !selectedUser}
                        >
                            NORMAL KULLANICI YAP
                        </Button>
                    </Box>
                    <Box sx={{ mt: 4 }}>
                        <Typography variant="h6" gutterBottom>
                            YENİ KULLANICI DAVET ET
                        </Typography>
                        <TextField
                            fullWidth
                            label="E-posta Adresi"
                            variant="outlined"
                            value={newUserEmail}
                            onChange={(e) => setNewUserEmail(e.target.value)}
                            sx={{ mb: 2 }}
                        />
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleSendInvite}
                            disabled={isLoading || !newUserEmail}
                        >
                            DAVET GÖNDER
                        </Button>
                    </Box>
                    {isLoading && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                            <CircularProgress size={24} />
                        </Box>
                    )}
                </>
            )}
        </Box>
    );
};

export default UserManagement;