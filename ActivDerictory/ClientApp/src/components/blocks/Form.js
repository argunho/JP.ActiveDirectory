import React, { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import {
    Button, Checkbox, CircularProgress,
    FormControl, FormControlLabel, FormLabel, InputLabel, MenuItem, Radio, Select, TextField, Tooltip
} from '@mui/material';
import { ClearOutlined } from '@mui/icons-material';
import { useHistory } from 'react-router-dom';
import ModalHelpTexts from './ModalHelpTexts';
import { capitalize } from '@mui/material'

// Json files
import words from './../../json/words.json';
import cities from 'cities.json';
import colors from 'color-name-list';
import Response from './Response';
import PDFConverter from './PDFConverter';

// Don't remove this comment line below, this uses for useEffect
/* eslint-disable react-hooks/exhaustive-deps */


export default function Form(props) {
    const { title, api, buttonText, name, multiple, users = [] } = props;
    const defaultForm = {
        name: name, list: [],
        password: "", confirmPassword: ""
    };
    const [response, setResponse] = useState(null);
    const [load, setLoad] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [form, setForm] = useState(defaultForm);
    const [noConfirm, setNoConfirm] = useState(false);
    const [regexError, setRegexError] = useState(false);
    const [confirmSubmit, setConfirmSubmit] = useState(false);
    const [confirmed, setConfirmed] = useState(false);
    const [errors, setErrors] = useState([]);
    const [variousPassword, setVariousPassword] = useState(false);
    const [strongPassword, setStrongPassword] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState("");
    const [isOpenTip, setIsOpenTip] = useState(false);
    const [wordsList, setWordsList] = useState([]);
    const [randomNumber, setRandomNumber] = useState(1000);
    const [ready, setReady] = useState([]);
    const [previewList, setPreviewList] = useState([]);
    const [preview, setPreview] = useState(false);
    const [credentialError, setCredentialError] = useState(false);
    const [confirmSavePdf, setConfirmSavePdf] = useState(false);
    const [savePdf, setSavePdf] = useState(false);
    const [savedPdf, setSavedPdf] = useState(null);
    const [randomPasswordWord, setRandomPasswordWord] = useState(null);

    const history = useHistory()
    const disableGenerate = !strongPassword && !ready;

    // Student school and class
    const location = (users.length > 0) ? users[0]?.office + " " + users[0]?.department : "";

    // Jwt token to connect server
    const _token = sessionStorage.getItem("token");
    const _config = {
        headers: { 'Authorization': `Bearer ${_token}` }
    };

    // Form inputs
    const formList = [
        { name: "password", label: "Lösenord", placeholder: "", regex: true },
        { name: "confirmPassword", label: "Bekräfta lösenord", placeholder: "", regex: true }
    ]

    // Help texts (password)
    const helpTexts = [
        {
            label: "Lösenord ska innehålla",
            tip: "<pre>* Minst en engelsk versal (stor bokstav)</pre>" +
                "<pre>* Minst en liten engelsk gemen (liten bokstav)</pre>" +
                "<pre>* Minst en siffra</pre>" +
                "<pre>* Minst ett specialtecken</pre>" +
                "<pre>* Minst 8 & Max 20 karaktär i längd</pre>"
        }
    ]

    // List of alternative to select words list category to generate password
    const passwordKeys = [
        { label: "Länder", value: "countries" },
        { label: "Alla städer/tätort", value: "cities" },
        { label: "Svenska städer/tätort", value: "svCities" },
        { label: "Färg", value: "colors" },
        { label: "Blommor", value: "flowers" },
        { label: "Frukter", value: "fruits" },
        { label: "Grönsaker", value: "vegetables" },
        { label: "Djur", value: "animals" },
        { label: "Kattens namn (smeknamn)", value: "cats" },
        { label: "Bilar", value: "cars" }
    ];

    // To manipulate elements like js getElementById
    const refSubmit = useRef(null);
    const refModal = useRef(null);

    // Regex to validate password
    const regex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*_]{8,20}$/;
    const eng = (/^[A-Za-z]+$/);

    // Check current user authentication
    useEffect(() => {
        const token = sessionStorage.getItem("token");
        // Return to the start page if a user is unauthorized
        if (token === null || token === undefined)
            history.push("/");
    }, [])

    useEffect(() => {
        if (isOpenTip)
            setTimeout(() => { setIsOpenTip(!isOpenTip) })
    }, [isOpenTip])

    useEffect(() => { resetForm(!variousPassword); }, [variousPassword])

    useEffect(() => { setPreviewList([]); }, [randomNumber])

    useEffect(() => {
        if (savedPdf != null && savePdf)
            sendEmailWidthFile();
    }, [savedPdf])

    useEffect(() => {
        if (wordsList.length > 0) {
            const list = wordsList.filter(x => (x.name !== undefined) ? x?.name.length > 5 : x.length > 5);
            const random = list[Math.floor(Math.random() * list.length)];
            let str = (random?.name || random);

            if (!eng.test(replaceLetters(str)))
                str = "Password";

            setRandomPasswordWord(capitalize(str));
        }
    }, [wordsList])


    // Set password type
    const setPassType = (value) => {
        if (value) {
            setWordsList([]);
            setReady(false);
            setRandomNumber(1000);
            setSelectedCategory("");
        }
        setStrongPassword(value);
    }

    // Password words category
    const handleSelectListChange = (e) => {
        setPreviewList([]);
        const keyword = passwordKeys.find(x => x.label === e.target.value).value;
        let wList = words[keyword] || [];
        if (wList.length === 0) {
            if (keyword === "cities") wList = cities;
            else if (keyword === "colors") wList = colors;
            else wList = cities.filter(x => x.country === "SE");

            wList = wList.filter(x => x.name.indexOf(" ") === -1 && x.name.length < 10);
        } else if (wList.length > 0)
            wList = wList.filter(x => x.indexOf(" ") === -1 && x.length < 10);

        setWordsList(wList);
        setReady(true);
        setForm(defaultForm);
        setSelectedCategory(e.target.value);
    }

    // Handle change of form value
    const valueChangeHandler = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        responseReset();
        if (form.confirmPassword) checkConfirm(e.target);

        if (e.target.value.length >= 8 && errors?.indexOf(e.target.name) > -1)
            resetError(e.target.name);

        resetForm(false);
    }

    // Generate new password
    const generatePassword = (regenerate = false) => {
        setPreview(regenerate);
        setPreviewList([]);
        if (strongPassword && !variousPassword) {
            resetForm(false);
            const generatedPassword = returnGeneratedPassword();
            setForm({ ...form, password: generatedPassword, confirmPassword: generatedPassword });
            setShowPassword(true);
        } else {
            let usersArray = [];
            let chars = "@!_&?#%";
            let min = (randomNumber / 10);
            for (let i = 0; i < users.length; i++) {
                let password = ""
                let broken = false;
                if (!strongPassword) {
                    if (wordsList.length > 0) {
                        const random = wordsList[Math.floor(Math.random() * wordsList.length)];
                        password += (random?.name || random);
                    } else
                        password += users[i]?.displayName.slice(0, users[i].displayName.indexOf(" "));

                    if (!eng.test(password))
                        password = replaceLetters(password);

                    if (eng.test(password)) {
                        password += (Math.random() * (randomNumber - min) + min).toFixed(0);
                        password += chars[Math.floor(Math.random() * chars.length)];
                    } else
                        broken = true;
                }

                password = strongPassword ? returnGeneratedPassword() : capitalize(password);
                const noExists = usersArray.find(x => x.password === password) === undefined;

                if (regex.test(password) && !broken && noExists) {
                    usersArray.push({
                        name: users[i].name,
                        displayName: users[i].displayName,
                        office: users[i].office,
                        department: users[i].department,
                        password: password
                    })

                    setPreviewList(previewList => [...previewList, {
                        displayName: users[i].displayName,
                        passwordHtml: `<p style='margin-bottom:20px;text-indent:15px'> 
                                Lösenord: <span style='color:#c00;font-weight:600;letter-spacing:0.5px'>${password}</span></p>`,
                        password: password
                    }]);
                } else
                    i -= 1;
            }

            setForm({ ...form, list: usersArray })
        }
    }

    // Generate strong password
    const returnGeneratedPassword = () => {
        let _password = "";
        for (var i = 0; i < 12; i++) {
            var chars = randomChars(i);
            var sortedChars = chars[Math.floor(Math.random() * chars.length)];
            if (i > 10 && !regex.test(_password + sortedChars)) {
                i = 0;
                _password = "";
            } else
                _password += sortedChars;
        }

        return _password;
    }

    // Replace no-english letters
    const replaceLetters = (word) => {
        return word.toLowerCase().replaceAll("á", "a").replaceAll("ä", "a").replaceAll("å", "a")
            .replaceAll("æ", "a").replaceAll("ö", "o").replaceAll("ø", "o");
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

    // Confirm new password and confirmPassword
    const checkConfirm = e => {
        setNoConfirm((e.name === "password") ? form.confirmPassword !== e.value
            : form.password !== e.value)
    }

    // Validate form's field
    const validateField = (name) => {
        if (form[name].length < 6 && errors?.indexOf(name) === -1)
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

    // Confirm action
    const confirmHandle = () => {
        setConfirmed(true);
        setTimeout(() => {
            refSubmit.current.click();
        }, 500)
    }

    // No access
    const noAccess = () => {
        setResponse({
            msg: "Åtkomst nekad! Dina atkomstbehörigheter ska kontrolleras på nytt.",
            alert: "error"
        })
        setTimeout(() => { history.push("/"); }, 5000);
    }

    // Response alert
    const alert = (visible) => {
        if (!visible) return null;

        return <Response response={response} reset={() => responseReset()} />
    }

    // Response reset
    const responseReset = () => {
        setResponse(null);
        setCredentialError(false);
    }

    // Apply and sva pdf
    const saveApply = () => {
        setConfirmSavePdf(true);
        refSubmit.current.click();
    }

    // Reset form
    const resetForm = (reset, save = false) => {
        setRegexError(false);
        setConfirmed(false);
        setShowPassword(false);
        setConfirmSubmit(false);
        setPassType(true);
        setPreview(false);
        if (!savePdf)
            setPreviewList([]);
        if (!save) responseReset();
        if (reset) {
            setNoConfirm(false);
            setForm(defaultForm);
            setErrors([]);
            setVariousPassword(false);
            setConfirmSavePdf(false);
            setSavePdf(false);
        }
    }

    // Submit form
    const submitForm = async (e) => {
        e.preventDefault();

        // Validate form
        if (!variousPassword) {
            let arrErrors = [];
            formList.forEach(x => { if (form[x.name].length < 6) arrErrors.push(x.name) })
            if (arrErrors.length > 0) {
                setErrors(arrErrors);
                return;
            }

            // Check password fields confirm
            if (!regex.test(form.password)) {
                setRegexError(true);
                return;
            }
        } else if (!preview) {
            refModal.current.click();
            setPreview(true);
            return;
        }

        if (!confirmed) {
            setConfirmSubmit(true);
            setPreview(true);
            return;
        } else
            setConfirmSubmit(false);

        if (variousPassword)
            setPreview(!preview);

        setLoad(true);

        // Request
        await axios.post("user/" + api, form, _config).then(res => {
            setResponse(res.data);
            setLoad(false);
            if (res.data?.success) {
                setSavePdf(confirmSavePdf);
                setTimeout(() => {
                    resetForm(true, true);

                    if (res.data?.unlocked)
                        props.refreshUserData();
                }, 5000)
            }
        }, error => {
            // Handle of error
            resetForm(false);
            setLoad(false);
            if (error?.response.status === 401) noAccess();
            else
                console.error("Error => " + error.response);
        })
    }

    // Send email to current user with saved pdf document
    const sendEmailWidthFile = async () => {

        const inf = location.split(" ");
        const data = new FormData();
        data.append('attachedFile', savedPdf);

        await axios.post(`user/mail/${inf[1]} ${inf[0]}`, data, _config).then(res => {
            if (res.data?.errorMessage)
                console.error("Error response => " + res.data.errorMessage);
        }, error => {
            // Handle of error
            if (error?.response.status === 401) noAccess();
            else console.error("Error => " + error.response)
        })
    }

    return (
        <div className='collapse-wrapper'>

            {/* The curtain over the block disables all action if the form data is submitted and waiting for a response */}
            {load ? <div className='curtain-block'></div> : null}


            {/* Confirm actions block */}
            {confirmSubmit ? <div className='confirm-wrapper'>
                <div className='confirm-block'>
                    Är du säker att du vill göra det?
                    <div className='buttons-wrapper'>
                        <Button type="submit" variant='contained' color="error" onClick={() => confirmHandle()}>Ja</Button>
                        <Button variant='contained' color="primary" onClick={() => resetForm(false)}>Nej</Button>
                    </div>
                </div>
            </div> : null}

            {/* Modal  window with help texts */}
            <ModalHelpTexts arr={helpTexts} isTitle="Lösenordskrav" />

            {/* Title */}
            <p className='form-title'>{title}</p>

            {/* Response message */}
            {alert(!credentialError && response)}

            {/* Form actions */}
            <div className='form-actions'>

                {multiple ? <>
                    {/* Loop of radio input choices to choose is password same or not for all students */}
                    {[{ label: "Samma lösenord", value: false }, { label: "Olika lösenord", value: true }].map((p, index) => (
                        <FormControlLabel
                            key={index}
                            control={<Radio size='small' />}
                            checked={p.value === variousPassword}
                            label={p.label}
                            name="samePassword"
                            onChange={() => setVariousPassword(p.value)} />
                    ))}

                    {/* Different alternatives for password generation */}
                    <div className={`dropdown-div${(variousPassword ? " dropdown-open" : "")}`}>
                        <div className='dropdown-interior-div'>
                            {/* Loop of radio input choices to choose password type strong or not */}
                            <FormLabel className="label">Lösenordstyp</FormLabel>
                            {[{ label: "Komplicerad", value: true }, { label: "Enkel", value: false }].map((p, index) => (
                                <FormControlLabel
                                    key={index}
                                    control={<Radio
                                        size='small'
                                        checked={p.value === strongPassword}
                                        color={strongPassword ? "error" : "success"} />}
                                    label={p.label}
                                    name="strongPassword"
                                    onChange={() => setPassType(p.value)} />
                            ))}

                            <FormControl className={'select-list' + (!strongPassword ? "" : " disabled")}>
                                <InputLabel className='select-label'>Lösenords kategory</InputLabel>
                                <Select
                                    labelId="demo-simple-select-standard-label"
                                    value={selectedCategory}
                                    onChange={handleSelectListChange}
                                    label="Lösenords kategory"
                                    disabled={strongPassword}
                                >
                                    <MenuItem value=""><span style={{ marginLeft: "10px", color: "#1976D2" }}>Välj en från listan ...</span></MenuItem>
                                    <MenuItem></MenuItem>
                                    {passwordKeys.map((l, index) => (
                                        <MenuItem value={l.label} key={index}>
                                            <span style={{ marginLeft: "10px" }}> - {l.label}</span>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {ready ?
                                <div className="last-options">
                                    <FormLabel className="label-small">Lösenords alternativ (antal siffror i lösenord)</FormLabel>
                                    {[{ label: "012_", value: 1000 },
                                    { label: "01_", value: 100 },
                                    { label: "0_", value: 10 }].map((p, index) => (
                                        <FormControlLabel
                                            key={index}
                                            control={<Radio
                                                size='small'
                                                checked={p.value === randomNumber}
                                                color="info" />}
                                            label={randomPasswordWord + p.label}
                                            name="digits"
                                            onChange={() => setRandomNumber(p.value)} />
                                    ))}</div>
                                : null}
                        </div>
                    </div></> : null}

                {/* Password form */}
                <form className='user-view-form' onSubmit={submitForm}>
                    {/* Passwords inputs */}
                    <div className={`inputs-wrapper dropdown-div${(!variousPassword ? " dropdown-open" : "")}`}>
                        {formList.length > 0 ? formList.map((n, i) => (
                            <FormControl key={i} className="pr-inputs">
                                <TextField
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
                                    disabled={load || (n.name === "confirmPassword" && !form.password) || confirmSubmit || variousPassword}
                                    onChange={valueChangeHandler}
                                    onBlur={() => validateField(n.name)}
                                />
                            </FormControl>)) : null}
                    </div>

                    <div className='buttons-wrapper'>
                        {/* Change the password input type */}
                        {variousPassword ? null : <FormControlLabel className='checkbox'
                            control={<Checkbox
                                size='small'
                                checked={showPassword}
                                onClick={() => setShowPassword(!showPassword)} />}
                            label="Visa lösenord" />}

                        {/* Generate password button */}
                        <Tooltip arrow
                            title={disableGenerate ? "Lösenords kategory är inte vald." : ""}
                            classes={{
                                tooltip: `tooltip tooltip-margin tooltip-${disableGenerate ? 'error' : 'blue'}`,
                                arrow: `arrow-${disableGenerate ? 'error' : 'blue'}`
                            }}>
                            <span>
                                <Button variant="text"
                                    color="primary"
                                    type="button"
                                    size="small"
                                    className="generate-password"
                                    onClick={() => generatePassword()}
                                    disabled={load || disableGenerate}>
                                    Generera {previewList.length > 0 ? "andra " : ""} lösenord
                                </Button>
                            </span>
                        </Tooltip>

                        <div className='buttons-interior-wrapper'>
                            {/* Reset button */}
                            <Button variant="contained"
                                color="error"
                                type="button"
                                disabled={load || ((form.password + form.confirmPassword).length === 0 && !variousPassword)}
                                onClick={() => resetForm(true)}
                            ><ClearOutlined /></Button>

                            {/* Submit/Preview form {variousPassword ? "contained" : "outlined"} */}
                            <Button variant="contained"
                                ref={refSubmit}
                                className='button-btn'
                                color="primary"
                                type='submit'
                                disabled={load || (!variousPassword && (noConfirm || regexError)) || (variousPassword && previewList.length === 0)}>
                                {load ? <CircularProgress style={{ width: "15px", height: "15px", marginTop: "3px" }} /> : (variousPassword ? "Granska" : buttonText)}</Button>
                        </div>
                    </div>

                </form>
            </div>

            {/* Preview the list of generated passwords */}
            {multiple && users.length > 0
                ? <ModalHelpTexts
                    arr={previewList}
                    cls={" none"}
                    isTitle={`${title} <span class='typography-span'>${location}</span>`}
                    isTable={true}
                    isSubmit={true}
                    setPreview={() => setPreview(false)}
                    regeneratePassword={() => generatePassword(true)}
                    inverseFunction={(save) => (save ? saveApply() : refSubmit.current.click())}
                    ref={refModal} /> : null}

            {/* Save document to pdf */}
            {savePdf ? <PDFConverter
                name={title}
                subTitle={location}
                names={["Namn", "Lösenord"]}
                list={previewList}
                savedPdf={(pdf) => setSavedPdf(pdf)}
            /> : null}
        </div>
    )
}
