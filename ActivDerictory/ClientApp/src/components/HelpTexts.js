import React, { useState } from 'react'
import { Alert, AlertTitle, Checkbox, FormControlLabel,  Stack } from '@mui/material'
import { HelpOutline, Close } from '@mui/icons-material';

export default function HelpTexts({ arr }) {
    const [visible, setVisible] = useState(false);

    return (

        <div className="checkbox-radio-wrapper">
            <FormControlLabel
                className='help-texts'
                control={<Checkbox size='small'
                    color="error"
                    checked={visible}
                    icon={<HelpOutline />}
                    checkedIcon={<Close />}
                    onClick={() => setVisible(!visible)}
                    inputProps={{ 'aria-label': 'controlled', color: "error" }} />}
                label={visible ? "Dölj" : "Klicka här för att visa tips"} />

            <Stack sx={{ width: '100%' }} spacing={2} className={`list-alerts dropdown-div ${visible ? ' dropdown-open' : ''}`}>
                {arr.map((h, index) => (
                    <Alert severity='info' key={index} className="list-alert">
                        <AlertTitle><strong>{h.label}</strong></AlertTitle>
                        <p>{h.tip}</p>
                    </Alert>
                ))}
            </Stack>
        </div>
    )
}
