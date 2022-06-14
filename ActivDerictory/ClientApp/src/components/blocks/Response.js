import React, { useState } from 'react'
import { Alert, AlertTitle, Button } from '@mui/material'
import axios from 'axios';


export default function Response({ error, response, reset }) {

    const occurredError = sessionStorage.getItem("occurredError");
    const [supportLink, setSupportLink] = useState(true);

    const sendMsgToSupport = async () => {
        await axios.post("user/contact", occurredError)
            .then(res => {
                setSupportLink(false);
                reset();
            })
    }
    
    if (occurredError === response?.errorMsg) {
        setSupportLink(true);
        sessionStorage.removeItem("occurredError")
    } else
        sessionStorage.setItem("occurredError", error?.response);

    if (supportLink) {
        console.error("Error => " + response?.errorMsg);
        return (
            <Alert severity='error' onClose={() => reset()}>
                <AlertTitle>Något har gått fel.</AlertTitle>
                <Button variant="contained" color='error' style={{ display: "block", marginTop: "20px" }} onClick={() => sendMsgToSupport()}>
                    Meddela systemadministratör
                </Button>
            </Alert>
        )
    } else
        return <Alert className='alert' severity={response?.alert} onClose={() => reset()}>{response?.msg}</Alert>;
}
