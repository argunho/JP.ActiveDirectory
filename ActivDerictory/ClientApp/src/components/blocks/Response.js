import React, { useState } from 'react'
import { Alert, AlertTitle, Button } from '@mui/material'
import axios from 'axios';


export default function Response({ error, response, reset }) {

    const occurredError = sessionStorage.getItem("occurredError");
    const [supportLink, setSupportLink] = useState(false);

    const sendMsgToSupport = async () => {
        await axios.post("user/support", occurredError)
            .then(res => {
                setSupportLink(false);
                reset();
        })
    }

    if (error) {
        if (occurredError === error?.response) {
            setSupportLink(true);
            sessionStorage.removeItem("occurredError")
        } else
            sessionStorage.setItem("occurredError", error?.response);

        console.error("Error => " + error.response);

        return (
            <Alert severity='error' variant='filled' onClose={() => reset()}>
                <AlertTitle>Fel</AlertTitle>
                Något har gått fel. 
                {supportLink ? 
                    <Button variant="text" color="primary" onClick={() => sendMsgToSupport()}>
                        Skicka meddelande systemadministratör om felet kvarstår
                    </Button> : null}
            </Alert>
        )
    } else
        return <Alert className='alert' severity={response?.alert} onClose={() => reset()}>{response?.msg}</Alert>;
}
