import React, { Component } from 'react';
import axios from 'axios';
import { Alert, Button, CircularProgress, FormControl, 
        FormControlLabel, Radio, RadioGroup,
        TextField } from '@mui/material';
import { withRouter } from 'react-router-dom'

import './../../css/login.css';
import keys from './../../images/keys.png';
import { Label } from 'reactstrap';

export class Login extends Component {
    static displayName = Login.name;

    constructor(props) {
        super(props);

        this.state = {
            form: { username: "", password: "", group: "" },
            formFields: [
                { label: "Användarnamn", name: "username", type: "text" },
                { label: "Lösenord", name: "password", type: "password" }
            ],
            response: null,
            load: false
        }

        this.loginWithWindowsCredentials = this.loginWithWindowsCredentials.bind(this);
    }

    componentDidMount() {
        const token = sessionStorage.getItem("token");
        if (token !== null && token !== undefined)
            this.props.history.push("/find-user");
    }

    valueChangeHandler = (e) => {
        this.setState({
            form: {
                ...this.state.form, [e.target.name]: e.target.value
            },
            response: null
        })
    }

    submitForm = async (e) => {
        e.preventDefault();
        const { form } = this.state;

        this.setState({ load: true })
        sessionStorage.setItem("group", form.group);

        await axios.post("auth", form).then(res => {
            const { access, token, consoleMsg } = res.data;

            this.setState({
                load: false, response: res.data
            })

            if (consoleMsg) console.error("Error => " + consoleMsg);

            if (access) {
                sessionStorage.setItem("token", token);
                sessionStorage.setItem("credentials", "ok");
                setTimeout(() => {
                    this.props.history.push("/find-user");
                }, 1000)
            }
        })
    }

    loginWithWindowsCredentials() {
        sessionStorage.removeItem("login");
        this.props.history.push("/");
    }

    render() {
        const { load, response, formFields, form } = this.state;
        return (
            <form className='login-form' onSubmit={this.submitForm}>
                <p className='form-title'>Logga in</p>
                {response != null ? <Alert className='alert' severity={response.alert}>{response.msg}</Alert> : null}
                {formFields.map((x, i) => (
                    <FormControl key={i}>
                        <TextField
                            id="outlined-basic"
                            label={x.label}
                            name={x.name}
                            type={x.type}
                            value={form[x.name]}
                            variant="outlined"
                            required
                            inputProps={{
                                maxLength: 20,
                                minLength: 6,
                                autoComplete: form[x.name],
                                form: { autoComplete: 'off', }
                            }}
                            disabled={load}
                            onChange={this.valueChangeHandler} />
                    </FormControl>
                ))}
                {/* Radio buttons to choice one of search alternatives */}
                <FormControl className='checkbox-block-mobile' style={{ display: "inline-block" }}>
                    <RadioGroup row name="row-radio-buttons-group">
                        {/* Loop of radio input choices */}
                        <Label className='login-label'>Hantera</Label>
                        {[{name: "Studenter", value: 'Students' }, 
                          {name: "Politiker", value: 'Politician'}].map((p, index) => (
                            <FormControlLabel
                                key={index}
                                value={p.value}
                                control={<Radio
                                size='small'
                                checked={form.group === p.value}
                                color="success" />}
                                label={p.name}
                                name="group"
                                required
                                className='login-radio'
                                onChange={this.valueChangeHandler} />
                        ))}
                    </RadioGroup>
                </FormControl>

                <Button variant="outlined"
                    className='button-btn'
                    color="inherit"
                    type="submit"
                    title="Logga in"
                    disabled={load || form.username.length < 5 || form.password.length < 5 || form.group.length < 1} >
                    {load ? <CircularProgress style={{ width: "12px", height: "12px", marginTop: "3px" }} /> : "Skicka"}</Button>
                {/* <Button variant='text'
                    color="primary"
                    type="button"
                    title="Logga in med Windows-autentiseringsuppgifter"
                    onClick={this.loginWithWindowsCredentials}
                    disabled={load}>
                    <DesktopWindows />
                </Button> */}

                <img src={keys} alt="Unlock user" className='login-form-img' />
            </form>
        )
    }
}

export default withRouter(Login);