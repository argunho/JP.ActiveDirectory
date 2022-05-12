import React, { Component } from 'react';
import axios from 'axios';
import { Alert, Button, CircularProgress, FormControl, TextField } from '@mui/material';
import { DesktopWindows } from '@mui/icons-material'
import { withRouter } from 'react-router-dom'

import './../../css/login.css';

export class Login extends Component {
    static displayName = Login.name;

    constructor(props) {
        super(props);

        this.state = {
            form: { username: "", password: "" },
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

    submitForm = (e) => {
        e.preventDefault();
        const { form } = this.state;

        this.setState({ load: true })

        axios.post("auth", form).then(res => {
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
                {response != null ? <Alert severity={response.alert}>{response.msg}</Alert> : null}
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
                                minLength: 6
                            }}
                            disabled={load}
                            onChange={this.valueChangeHandler} />
                    </FormControl>
                ))}

                <Button variant="outlined"
                    className='submit-btn'
                    color="primary"
                    type="submit"
                    title="Logga in"
                    disabled={load || (form.username.trim() === "" || form.password.trim() === "")} >
                    {load ? <CircularProgress style={{ width: "12px", height: "12px", marginTop: "3px" }} /> : "Skicka"}</Button>
                <Button variant='text'
                    color="primary"
                    type="button"
                    title="Logga in med Windows-autentiseringsuppgifter"
                    onClick={this.loginWithWindowsCredentials}
                    disabled={load}>
                    <DesktopWindows />
                </Button>
            </form>
        )
    }
}

export default withRouter(Login);