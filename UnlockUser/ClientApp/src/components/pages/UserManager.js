
import React, { Component } from 'react'
import { Button, CircularProgress } from '@mui/material';
import axios from 'axios';
import { withRouter } from 'react-router-dom';
import { Lock, LockOpen } from '@mui/icons-material';
import Form from './../blocks/Form';
import Info from '../blocks/Info';

import './../../css/userview.css';
import Response from '../blocks/Response';

export class UserManager extends Component {
    static displayName = UserManager.name;
    constructor(props) {
        super(props);

        this.state = {
            name: this.props.match.params?.id || null,
            user: {
                name: "User",
                displayName: "-----",
                isLocked: false,
                date: null
            },
            response: null,
            load: false,
            noAccess: false
        }

        this.unlockUser = this.unlockUser.bind(this);
    }

    componentDidMount() {
        const token = sessionStorage.getItem("token");
        if (token == null || token === undefined)
            this.props.history.push("/");

        this.getUser();
    }

    async getUser() {
        const _config = {
            headers: { 'Authorization': `Bearer ${sessionStorage.getItem("token")}` }
        };

        await axios.get("user/" + this.props.match.params.id, _config).then(res => {
            const { user } = res.data;
            if (user !== undefined) {
                this.setState({
                    user: {
                        name: user?.name,
                        displayName: user.displayName,
                        isLocked: user.isLocked,
                        date: user.date,
                        subTitle: user?.office + " " + user?.department
                    }
                })
            }
        }, error => {
            if (error?.response?.status === 401) {
                this.setState({ noAccess: true });

                setTimeout(() => {
                    this.props.history.push("/");
                }, 3000)
            } else
                console.error("Error => " + error.response)
        })
    }

    // Unlock user
    unlockUser = async () => {
        const _config = {
            headers: { 'Authorization': `Bearer ${sessionStorage.getItem("token")}` }
        };

        this.setState({ load: true, response: null })

        // Request
        await axios.post("user/unlock/" + this.state.user.name, _config).then(res => {
            this.setState({ load: false, response: res.data })
            this.getUser();
        }, error => {
            // Handle of error
            this.setState({ load: false })
            if (error?.response.status === 401)
                this.setState({ noAccess: true });
            else
                console.error("Error => " + error.response);
        })
    }

    render() {
        const { user, noAccess, name, load, response } = this.state;

        return (
            noAccess ? <Response response={null} noAccess={true} />
                : <div className='interior-div'>
                    {/* Info about user */}
                    <Info name={user?.name} displayName={user?.displayName} subTitle={user?.subTitle} />
                    {/* Response */}
                    {response ? <Response response={response} reset={() => this.setState({response: null})} /> : null}
                    {/* Unlock user */}
                    <div className={'unlock-block' + (user.isLocked ? " locked-account" : "")}>
                        {user.isLocked ? <Lock /> : <LockOpen />}
                        <span>{user.isLocked ? "Lås upp konto" : "Aktiv konto"}</span>

                        {/* Unlock user - button */}
                        <Button variant="contained"
                            color="error"
                            disabled={!user.isLocked || load}
                            onClick={() => this.unlockUser()}
                            className="unlock-btn button-btn">
                            {load ? <CircularProgress style={{ width: "15px", height: "15px", marginTop: "3px" }} /> : "Lås upp"}
                        </Button>
                    </div>
                    {/* Change password */}
                    <Form title="Återställa lösenord" api="resetPassword" name={name} disabled={load} />
                </div>
        )
    }
}

export default withRouter(UserManager);