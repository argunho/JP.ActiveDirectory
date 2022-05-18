
import React, { Component } from 'react'
import {
    Alert, Collapse, List, ListItemButton, ListItemIcon, ListItemText
} from '@mui/material';
import axios from 'axios';
import { withRouter } from 'react-router-dom';
import { ExpandLess, ExpandMore, Lock, LockOpen, Password } from '@mui/icons-material';
import Form from './../blocks/Form';
import Info from '../blocks/Info';

import './../../css/userview.css';

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
            open: false,
            openIndex: null,
            list: [],
            noAccess: false
        }
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
                    },
                    list: [
                        { name: "Lås upp konto", symbol: user.isLocked ? <Lock /> : <LockOpen />, disabled: !user.isLocked },
                        { name: "Återställ lösenord", symbol: <Password />, disabled: false }
                    ]
                })
            }
        }, error => {
            if (error.response.status === 401) {
                this.setState({ noAccess: true });

                setTimeout(() => {
                    this.props.history.push("/");
                }, 3000)
            } else
                console.error("Error => " + error.response)
        })
    }

    handleClick = (i) => {
        this.setState({
            openIndex: (i !== this.state.openIndex) ? i : null,
            open: (i !== this.state.openIndex)
        })
    }

    render() {
        const { user, noAccess, open, openIndex, list, name } = this.state;

        return (
            noAccess ? <Alert severity='error'>Åtkomst nekad! Dina atkomstbehörigheter ska kontrolleras på nytt.</Alert>
                :
                <div className='interior-div'>
                    <Info name={user?.name} displayName={user?.displayName} subTitle={user?.subTitle}/>

                    <List sx={{ width: '100%' }} component="nav">
                        {list.map((l, i) => (
                            <div key={i}>
                                <ListItemButton
                                    disabled={l.disabled}
                                    onClick={() => this.handleClick(i)} className={(open && openIndex === i) ? "dropdown-list-active" : ""}>
                                    <ListItemIcon>
                                        {l.symbol}
                                    </ListItemIcon>
                                    <ListItemText primary={l.disabled ? "Användarkontot är inte låst" : l.name} />
                                    {(open && openIndex === i) ? <ExpandLess /> : <ExpandMore />}
                                </ListItemButton>
                                <Collapse in={open && openIndex === i} timeout="auto" unmountOnExit>
                                    {i === 0 ?
                                        <Form api="unlock"
                                            name={name}
                                            title="Lås upp konto"
                                            buttonText="Lås upp"
                                            refreshUserData={() => this.setState({ user: { ...this.state.user, isLocked: false } })} />
                                        : <Form title={"Återställa lösenord"} api="resetPassword" name={name} buttonText="Återställ" />}
                                </Collapse>
                            </div>
                        ))}
                    </List>
                </div>
        )
    }
}

export default withRouter(UserManager);