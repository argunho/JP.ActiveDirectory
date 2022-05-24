import React from 'react'
import { Alert, AlertTitle } from '@mui/material'


export default function Response({ error, response, reset }) {

    if (error) {
        console.error("Error => " + error.response);

        return (
            <Alert severity='error' variant='filled' onClose={() => reset()}>
                <AlertTitle>Fel</AlertTitle>
                Något gick fel. Kontakta din systemadministratör om felet kvarstår. Ett felmeddelande visas i webbläsarkonsolen.
            </Alert>
        )
    } else
        return <Alert className='alert' severity={response?.alert} onClose={() => reset()}>{response?.msg}</Alert>;
}
