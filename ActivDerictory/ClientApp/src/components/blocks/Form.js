import React, { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import {
    Alert, Button, Checkbox, CircularProgress,
    FormControl, FormControlLabel, FormLabel, Radio, TextField
} from '@mui/material';
import { Apple, ClearOutlined, LocalFlorist, LocationCity, Palette, Public, Spa, Subtitles, TimeToLeave } from '@mui/icons-material';
import { useHistory } from 'react-router-dom';
import ModalHelpTexts from './ModalHelpTexts';

// Json files
import words from './../../json/words.json';
import cities from 'cities.json';
import colors from 'color-name-list';

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
    const [confirmed, setConfirmed] = useState(false);
    const [errors, setErrors] = useState([]);
    const [open, setOpen] = useState(false);
    const [strongPassword, setStrongPassword] = useState(true);

    const helpTexts = [
        {
            label: "Lösenord ska innehålla (gäller inte admin lösenord)", tip: "<pre>* Minst en engelsk bokstav med stor bokstav</pre>" +
                "<pre>* Minst en liten engelsk bokstav</pre>" +
                "<pre>* Minst en siffra</pre>" +
                "<pre>* Minst ett specialtecken</pre>" +
                "<pre>* Minst 8 & Max 20 karaktär i längd</pre>"
        },
        { label: "Admin Lösenord", tip: "<pre>* Admins lösenord krävs om användaren är auktoriserad med Windows-data för att bekräfta auktorisering för att låsa upp användarkonto eller återställa lösenord</pre>" }
    ]

    const passwordKeys = [
        { label: "Alla städer", value: "cities", icon: <Public /> },
        { label: "Svenska städer", value: "cities", sort: "SE", icon: <LocationCity /> },
        { label: "Färg", value: "colors", icon: <Palette /> },
        { label: "Blommor", value: "words", sort: "flowers", icon: <LocalFlorist /> },
        { label: "Frukter", value: "words", sort: "fruits", icon: <Apple /> },
        { label: "Grönsaker", value: "words", sort: "vegetables", icon: <Spa /> },
        { label: "Bilar", value: "words", sort: "cars", icon: <TimeToLeave /> },
        { label: "Elevens namn", value: "users", icon: <Subtitles /> }
    ]

    const history = useHistory();
    const refSubmit = useRef(null);

    // Regex to validate password
    const regex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*_]{8,20}$/;
    const eng = /^[a-zA-Z0-9]$/;

    useEffect(() => {
        const token = sessionStorage.getItem("token");
        // Return to the start page if a user is unauthorized
        if (token === null || token === undefined)
            history.push("/");

        console.log(cities[0])
        console.log(colors[1])
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        const credentials = sessionStorage.getItem("credentials");
        // Building a suitable form to fill out
        if (formList.length === 0) {
            // Required admin password if the user is authorized with windows credentials
            if (credentials !== "ok")
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

    // Return random characters to generate password
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

        if (e.target.value.length >= 8 && errors?.indexOf(e.target.name) > -1)
            resetError(e.target.name);

        resetForm(false);
    }

    // Confirm new password and confirmPassword
    const checkConfirm = e => {
        setNoConfirm((e.name === "password") ? form.confirmPassword !== e.value
            : form.password !== e.value)
    }

    // Validate form's field
    const validateField = (name) => {
        if (form[name].length < 8 && errors?.indexOf(name) === -1)
            if (errors.length > 0) setErrors(errors => [...errors, name]);
            else setErrors([name]);
        else if (errors?.indexOf(name) > -1)
            resetError(name);
    }

    // Reset validation error from specific form field 
    const resetError = (name) => {
        let arr = errors;
        arr.splice(arr.indexOf(name), 1);
        setErrors(arr);
    }

    // Submit form
    const submitForm = e => {
        e.preventDefault();

        // Validate form
        let arrErrors = [];
        formList.forEach(x => { if (form[x.name].length < 8) arrErrors.push(x.name) })
        if (arrErrors.length > 0) {
            setErrors(arrErrors);
            return;
        }

        // Check password fields confirm
        if (!regex.test(form.password)) {
            setRegexError(true);
            return;
        } else if (!confirmed) {
            setConfirmSubmit(true);
            return;
        } else
            resetForm(false);

        setLoad(true);

        // Request
        axios.post("user/" + api, form, _config).then(res => {
            setResponse(res.data);
            setLoad(false);
            if (res.data?.success) {
                if (form.adminPassword.length > 0)
                    sessionStorage.setItem("credentials", "ok");

                resetForm(true, true);

                if (res.data?.unlocked)
                    setTimeout(() => { props.refreshUserData(); }, 2000)
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
    const resetForm = (reset, save = false) => {
        setRegexError(false);
        setConfirmed(false);
        setShowPassword(false);
        setConfirmSubmit(false);
        if (!save) setResponse(null);
        if (reset) {
            setNoConfirm(false);
            setForm(defaultForm);
            setErrors([]);
        }
    }

    return (
        <div className='collapse-wrapper'>

            {/* Confirm actions block */}
            {confirmSubmit ? <div className='confirm-wrapper'>
                <div className='confirm-block'>
                    Är du säker att du vill göra det?
                    <div className='buttons-wrapper'>
                        <Button type="submit" variant='contained' color="error" onMouseDown={() => setConfirmed(true)}>Ja</Button>
                        <Button variant='contained' color="primary" onClick={() => resetForm(false)}>Nej</Button>
                    </div>
                </div>
            </div> : null}

            {/* Modal  window with help texts */}
            <ModalHelpTexts arr={helpTexts} position={true} />

            {/* Title */}
            <p className='form-title'>{title}</p>

            {/* Form actions */}
            <div className='form-actions'>

                {/* Generate password button */}
                {/* {api === "unlock" ? null : <Button variant="text"
                    color="primary"
                    type="button"
                    size="small"
                    className="generate-password"
                    onClick={() => setOpen(!open)}
                    disabled={load}>Generate password</Button>} */}

                {/* Loop of radio input choices to choose is password same or not for all students */}
                {[{ label: "Samma lösenord", value: false }, { label: "Olika lösenord", value: true }].map((p, index) => (
                    <FormControlLabel
                        key={index}
                        control={<Radio size='small' />}
                        checked={p.value === open}
                        label={p.label}
                        name="samePassword"
                        onChange={() => setOpen(p.value)} />
                ))}

                {/* Different alternatives for password generation */}
                <div className={`dropdown-div${(open ? " dropdown-open" : "")}`}>
                    <div className='dropdown-interior-div'>
                        {/* Loop of radio input choices to choose password type strong or not */}
                        <FormLabel className="label">Önskad lösenordstyp</FormLabel>
                        {[{ label: "Komplicerad", value: true }, { label: "Enkel", value: false }].map((p, index) => (
                            <FormControlLabel
                                key={index}
                                control={<Radio
                                    size='small'
                                    checked={p.value === strongPassword}
                                    color={strongPassword ? "error" : "success"} />}
                                label={p.label}
                                name="strongPassword"
                                onChange={() => setStrongPassword(p.value)} />
                        ))}

                        <div className={`dropdown-div${(!strongPassword ? " dropdown-open" : "")}`}>
                            <div className='dropdown-interior-div'>
                                <FormLabel className="label">Önskad ords kategory</FormLabel>
                                {passwordKeys.map((l, index) => (
                                    <Button variant="text" key={index}>
                                        <span style={{ marginLeft: "10px" }}>{l.icon}&nbsp;&nbsp;{l.label}</span>
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Generate password button */}
                        {strongPassword ? null : <Button variant="text"
                            color="primary"
                            type="button"
                            size="small"
                            className="generate-password"
                            onClick={() => generatePassword()}
                            disabled={load}>Generate password</Button>}
                    </div>
                </div>
            </div>

            {/* Password form */}
            <form className='user-view-form' onSubmit={submitForm}>


                {/* Response message */}
                {response ? <Alert className='alert' severity={response?.alert}>{response?.msg}</Alert> : null}

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
                                inputProps={{
                                    maxLength: 20,
                                    minLength: 8,
                                    autoComplete: formList[n.name],
                                    form: { autoComplete: 'off', }
                                }}
                                className={(n.regex && regexError) ? "error" : ""}
                                error={(n.name === "confirmPassword" && noConfirm) || (n.regex && regexError) || errors?.indexOf(n.name) > -1}
                                placeholder={n.placeholder}
                                disabled={load || (n.name === "confirmPassword" && !form.password) || confirmSubmit}
                                onChange={valueChangeHandler}
                                onBlur={() => validateField(n.name)}
                            />
                        </FormControl>)) : null}
                </div>

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
