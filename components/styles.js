export const FieldStyle = {
    '& .MuiOutlinedInput-root': {
        '& fieldset': {
            borderColor: '#ffd800', // Outline color in the default state
        },
        '&:hover fieldset': {
            borderColor: '#ffb400', // Outline color on hover
        },
        '&.Mui-focused fieldset': {
            borderColor: '#ffd800', // Outline color when focused
        },

    },
    '& .MuiInputLabel-root.Mui-focused': {
        color: '#ff9900', // Label color when focused
    },
};