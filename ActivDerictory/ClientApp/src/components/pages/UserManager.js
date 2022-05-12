
import React, { Component } from 'react'
import {
    Alert,
    Button, Collapse, List, ListItem,
    ListItemButton, ListItemIcon, ListItemText, Typography
} from '@mui/material';
import axios from 'axios';
import { withRouter } from 'react-router-dom';
import { ExpandLess, ExpandMore, KeyboardReturnTwoTone, Lock, LockOpen, Password } from '@mui/icons-material';
import Form from './../blocks/Form';

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
        else if (this.state.name)
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
                    user: user,
                    list: [
                        { name: "Lås upp konto", symbol: user.isLocked ? <Lock /> : <LockOpen />, disabled: !user.isLocked },
                        { name: "Återställ lösenord", symbol: <Password />, disabled: false }
                    ]
                })
            }
        }, error => {
            if (error.response.status === 401) {
                this.setState({ noAccess: true })
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
        const { user, open, openIndex, list, name, noAccess } = this.state;

        return (
            noAccess ? <Alert severity='error'>Åtkomst nekad! Dina atkomstbehörigheter ska kontrolleras på nytt.</Alert>
                : <div className='interior-div'>
                    <List sx={{ width: '100%' }}>
                        <ListItem className='search-result-reset'>
                            {/* Users data */}
                            <ListItemText
                                primary={user.name}
                                secondary={
                                    <React.Fragment>
                                        <Typography
                                            sx={{ display: 'inline' }}
                                            component="span"
                                            variant="body2"
                                            color="primary"
                                        >
                                            {user.displayName}
                                        </Typography>
                                        <span className='typography-span'>{user?.office + " " + user?.department}</span>
                                    </React.Fragment>} />

                            {/* Go back */}
                            <Button variant="text"
                                onClick={() => this.props.history.goBack()}
                                title="Go back">
                                <KeyboardReturnTwoTone /></Button>
                        </ListItem>
                    </List>

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
                                            list={[]}
                                            title="Lås upp konto"
                                            buttonText="Lås upp"
                                            refreshUserData={() => this.setState({ user: { ...this.state.user, isLocked: false } })} />
                                        :
                                        <Form title={"Återställa lösenord"} api="resetPassword" name={name} list={[]} hidden={false} buttonText="Återställ" />}
                                </Collapse>
                            </div>
                        ))}
                    </List>
                </div>
        )
    }
}

export default withRouter(UserManager);