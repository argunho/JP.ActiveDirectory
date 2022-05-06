import React, { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import {
    Alert, Button, Checkbox, CircularProgress,
    FormControl, FormControlLabel, TextField
} from '@mui/material';
import { ClearOutlined } from '@mui/icons-material';
import { useHistory } from 'react-router-dom';

const _token = sessionStorage.getItem("token");
const _config = {
    headers: { 'Authorization': `Bearer ${_token}` }
};

export default function Form(props) {
    const { title, api, buttonText, name, list } = props;
    const defaultForm = {
        name: name, list: list, 
        adminPassword: "", password: "", confirmPassword: ""
    };
    const [response, setResponse] = useState(null);
    const [load, setLoad] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [form, setForm] = useState(defaultForm);
    const [formList, setFormList] = useState([]);
    const [noConfirm, setNoConfirm] = useState(false);
    const [regexError, setRegexError] = useState(false);
    const [confirmSubmit, setConfirmSubmit] = useState(false);
    const [passTerms, setPassTerms] = useState(false);
    const [confirmed, setConfirmed] = useState(false);

    const history = useHistory();
    const refSubmit = useRef(null);

    // Regex to validate password
    const regex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*_]{8,20}$/;

    useEffect(() => {
        const token = sessionStorage.getItem("token");
        // Return to the start page if a user is unauthorized
        if (token === null || token === undefined)
            history.push("/");

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        const credintails = sessionStorage.getItem("credintails");
        // Building a suitable form to fill out
        if (formList.length === 0) {
            // Required admin password if the user is authorized with windows credentials
            if (credintails !== "ok")
                setFormList(formList => [...formList, { name: "adminPassword", label: "Admin lösenord", placeholder: "Bekräfta åtkomstbehörighet.", regex: false }]);

            //  If the form is not used to unlock the user
            if (api !== "unlock") {
                setFormList(formList => [...formList, { name: "password", label: "Lösenord", placeholder: "", regex: true }]);
                setFormList(formList => [...formList, { name: "confirmPassword", label: "Bekräfta lösenord", placeholder: "", regex: true }]);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formList.length === 0])

    // Generate new password
    const generatePassword = () => {
        let generatedPassword = "";
        resetForm(false);
        for (var i = 0; i < 12; i++) {
            var chars = randomChars(i);
            var sortedChars = chars[Math.floor(Math.random() * chars.length)];

            if (i > 10 && !regex.test(generatedPassword + sortedChars)) {
                i = 0;
                generatedPassword = "";
            } else
                generatedPassword += sortedChars;
        }
        setForm({ ...form, password: generatedPassword, confirmPassword: generatedPassword });
        setShowPassword(true);
    }

    // Return random charaters to generate password
    const randomChars = (num) => {
        const symbols = "!@?$&#%*_";
        const strArr = [
            String.fromCharCode(Math.floor(Math.random() * 26) + 97),
            String.fromCharCode(Math.floor(Math.random() * 26) + 65),
            String.fromCharCode(Math.floor(Math.random() * 10) + 48)
        ];
        const lastChar = (num % 5 === 0) ? symbols[Math.floor(Math.random() * symbols.length)] :
            strArr[Math.floor(Math.random() * strArr.length)];
        strArr.push(lastChar)
        return strArr;
    }

    // Handle change of form value
    const valueChangeHandler = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setResponse(null);
        if (e.target.name !== "adminPassword" && form.confirmPassword)
            checkConfirm(e.target);
        resetForm(false);
    }

    // Confirm new password and confirmPassword
    const checkConfirm = e => {
        setNoConfirm((e.name === "password") ? form.confirmPassword !== e.value
            : form.password !== e.value)
    }

// Submit form
    const submitForm = e => {
        e.preventDefault();
        // Check password field
        if (!regex.test(form.password)) {
            setPassTerms(true);
            setRegexError(true);
            return;
        } else if (!confirmed) {
            setConfirmSubmit(true);
            return;
        } else
            resetForm(false);

        setLoad(true);
        axios.post("user/" + api, form, _config).then(res => {
            setResponse(res.data);
            setLoad(false);
            if (res.data?.success) {
                if (form.adminPassword.length > 0)
                    sessionStorage.setItem("credintails", "ok");

                resetForm(true);

                if (res.data?.unlocked)
                    setTimeout(() => { props.refresUserData(); }, 2000)
            }
        }, error => {
            // Handle of error
            if (error.response.status === 401) {
                setResponse({
                    msg: "Åtkomst nekad! Dina atkomstbehörigheter ska kontrolleras på nytt.",
                    alert: "error"
                })
                setLoad(false);
                setTimeout(() => { history.push("/"); }, 3000)
            } else
                console.error("Error => " + error.response)
        })
    }

    // Reset form
    const resetForm = (reset) => {
        setRegexError(false);
        setPassTerms(false);
        setConfirmed(false);
        setConfirmSubmit(false);
        if (reset) {
            setNoConfirm(false);
            setForm(defaultForm)
            setFormList([]);
        }
    }

    return (
        <div className='collapse-wrapper'>
            {/* Password form */}
            <form className='userview-form' onSubmit={submitForm}>
                <div className='form-actions'>
                    <p className='form-title'>{title}</p>

                    {/* Generate pasword button */}
                    {api === "unlock" ? null : <Button variant="text"
                        color="primary"
                        type="button"
                        size="small"
                        className="generate-password"
                        onClick={() => generatePassword()}
                        disabled={load}>Generate password</Button>}

                    {/* Password terms button */}
                    <Button variant="text"
                        color={regexError ? "error" : (passTerms ? "info" : "inherit")}
                        type="button"
                        size="small"
                        className="generate-password"
                        onClick={() => setPassTerms(!passTerms)}
                        disabled={load}>Lösenord vilkor</Button>
                </div>

                {/* Response message */}
                {response ? <Alert className='alert' severity={response?.alert}>{response?.msg}</Alert> : null}

                {/* Password terms */}
                <Alert severity={regexError ? 'error' : 'info'} className={'alert dropdown-div' + (passTerms ? ' dropdown-open' : '')}>
                    Lösenord ska innehålla:
                    <pre>* Minst en engelsk bokstav med stor bokstav</pre>
                    <pre>* Minst en liten engelsk bokstav</pre>
                    <pre>* Minst en siffra</pre>
                    <pre>* Minst ett specialtecken</pre>
                    <pre>* Minst 8 & Max 20 karaktär i längd</pre>
                </Alert>


                {/* Passwords inputs */}
                <div className='inputs-wrapper'>
                    {formList.length > 0 ? formList.map((n, i) => (
                        <FormControl key={i} className="pr-inputs">
                            <TextField
                                id="outlined-basic"
                                label={n.label}
                                name={n.name}
                                type={showPassword ? "text" : "password"}
                                variant="outlined"
                                required
                                value={form[n.name] || ""}
                                className={(n.regex && regexError) ? "error" : ""}
                                error={(n.name === "confirmPassword" && noConfirm) || (n.regex && regexError)}
                                placeholder={n.placeholder}
                                inputProps={{ minLength: 8, maxLength: 20 }}
                                disabled={load || (n.name === "confirmPassword" && !form.password) || confirmSubmit}
                                onChange={valueChangeHandler} />
                        </FormControl>)) : null}
                </div>

                {/* Confirm actions block */}
                {confirmSubmit ?
                    <div className='confirm-block'>
                        Är du säker att du vill göra det?
                        <div className='buttons-wrapper'>
                            <Button type="submit" variant='contained' color="error" onMouseDown={() => setConfirmed(true)}>Ja</Button>
                            <Button variant='contained' color="primary" onClick={() => resetForm(false)}>Nej</Button>
                        </div>
                    </div> : null}

                {/* Change the password input type */}
                <FormControlLabel className='checkbox'
                    control={<Checkbox
                        size='small'
                        checked={showPassword}
                        onClick={() => setShowPassword(!showPassword)} />}
                    label="Visa lösenord" />

                {/* Submit form */}
                <Button variant="outlined"
                    ref={refSubmit}
                    className='submit-btn'
                    color="primary"
                    type='submit'
                    disabled={load || noConfirm || confirmSubmit || regexError}>
                    {load ? <CircularProgress style={{ width: "15px", height: "15px", marginTop: "3px" }} /> : buttonText}</Button>

                {/* Reset button */}
                {(form.adminPassword + form.password + form.confirmPassword).length > 1 ?
                    <Button variant="text"
                        color="error"
                        type="button"
                        disabled={load || confirmSubmit}
                        onClick={() => resetForm(true)}
                    ><ClearOutlined /></Button> : null
                }

            </form >
        </div>
    )
}
