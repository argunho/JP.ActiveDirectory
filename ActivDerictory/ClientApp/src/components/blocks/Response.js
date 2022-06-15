import React, { useState } from 'react'
import { Alert, AlertTitle, Button } from '@mui/material'
import axios from 'axios';

export default function Response({ response, reset }) {

    const [supportLink, setSupportLink] = useState(false);
    const [timeLeft, setTimeLeft] = useState(null);
    const occurredError = sessionStorage.getItem("occurredError") || null;

    const sendMsgToSupport = async () => {
        reset();
        setSupportLink(false);
        await axios.post("user/contact", occurredError)
            .then(res => {
                setSupportLink(false);
            })
    }

    const getTimeLeftToUnblock = () => {
        if (!response?.timeLeft) return;

        const num = (timeLeft ? timeLeft : response?.timeLeft).split(":") ;
        let sec = parseInt(num[2]);
        let min = parseInt(num[1]);

        setInterval(() => {
            if (sec + min === 0 || response === null) {
                clearInterval();
                reset();
            } else {
                if (sec === 0) {
                    if (min > 0)  min -= 1;
                    else min = 59;
                    sec = 59;
                } else
                    sec -= 1;
            }

            setTimeLeft(`00:${(min < 10) ? "0" + min : min}:${(sec < 10) ? "0" + sec : sec}`)
        }, 1000)
    }

    if (response?.errorMessage) {
        if (occurredError && occurredError === response?.errorMessage) {
            setSupportLink(true);
            sessionStorage.removeItem("occurredError")
        } else
            sessionStorage.setItem("occurredError", response?.errorMessage);
    } else if (response?.timeLeft)
        getTimeLeftToUnblock();

    if (supportLink) {
        return (
            <Alert className="alert" severity='error' onClose={() => reset()}>
                <AlertTitle>Något har gått fel. {response?.msg ? response?.msg : ""}</AlertTitle>
                <Button variant="contained"
                    color='error'
                    style={{ display: "block", marginTop: "20px" }}
                    onClick={() => sendMsgToSupport()}>
                    Meddela systemadministratör
                </Button>
            </Alert>
        )
    } else
        return <Alert className='alert' severity={response?.alert} onClose={() => reset()}>
            <span dangerouslySetInnerHTML={{ __html: response?.msg + (timeLeft ? timeLeft : "")}}></span>
        </Alert>;
}
