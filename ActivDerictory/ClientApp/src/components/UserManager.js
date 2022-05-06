
import React, { Component } from 'react'
import {
    Alert,
    Button, Collapse, List, ListItem,
    ListItemButton, ListItemIcon, ListItemText, Typography
} from '@mui/material';
import axios from 'axios';
import { withRouter } from 'react-router-dom';
import { ExpandLess, ExpandMore, KeyboardReturnTwoTone, LockOpen, Password } from '@mui/icons-material';
import Form from './Form';

import './../css/userview.css';

export class UserManager extends Component {
    static displayName = UserManager.name;
    constructor(props) {
        super(props);
        this.state = {
            name: this.props.match.params.id,
            user: {
                name: "User",
                displayname: "-----",
                isLocked: false,
                date: null
            },
            response: null,
            load: false,
            open: false,
            openIndex: null,
            list: [
                { name: "Lås upp konto", symbol: <LockOpen /> },
                { name: "Återställ lösenord", symbol: <Password /> }
            ],
            noAccess: false
        }

        this.unlockContent = this.unlockContent.bind(this);
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
            if (user !== undefined)
                this.setState({ user: user })
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

    unlockContent() {
        const { user, name } = this.state;
        if (user.isLocked)
            return (
                <>
                    <Alert severity='error' className='alert'>Användarkontot är låst</Alert>
                    <Form api="unlock"
                        unlockForm
                        name={name}
                        list={[]}
                        title="Lås upp konto"
                        buttonText="Lås upp"
                        refreshUserData={() => this.setState({ user: { ...this.state.user, isLocked: false } })}
                    />
                </>
            )
        else
            return <Alert className='alert' severity="info">Användarkontot är inte låst</Alert>
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
                : <div className='intorior-div'>
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
                                <ListItemButton onClick={() => this.handleClick(i)} className={(open && openIndex === i) ? "dropdown-list-active" : ""}>
                                    <ListItemIcon>
                                        {l.symbol}
                                    </ListItemIcon>
                                    <ListItemText primary={l.name} />
                                    {(open && openIndex === i) ? <ExpandLess /> : <ExpandMore />}
                                </ListItemButton>
                                <Collapse in={open && openIndex === i} timeout="auto" unmountOnExit>
                                    {i === 0 ? this.unlockContent() :
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