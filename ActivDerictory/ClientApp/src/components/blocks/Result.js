

import React, { useEffect, useRef, useState } from 'react'
import { Alert, Avatar, Button, Checkbox, List, ListItem, ListItemAvatar, ListItemText, Tooltip, Typography } from '@mui/material'
import { DeleteSweep, Deselect, Password, SelectAll } from '@mui/icons-material';
import Loading from './Loading';
import loadImg from './../../images/search.gif'
import user from './../../images/student.png'
import { useHistory } from 'react-router-dom';
/* eslint-disable react-hooks/exhaustive-deps */  // <= Do not remove this line


export default function Result({ users, clsStudents, isVisibleTips, inProgress, isResponseMessage, isAlertBg, isResult, resetResult}) {

    const refResult = useRef(null);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [isOpenTip, setIsOpenTip] = useState(false);

    const history = useHistory();

    const ul = users.length;
    const sl = selectedUsers.length;
    const selected = (ul === sl)

    useEffect(() => {
        console.log(isOpenTip)
        refResult.current.scrollIntoView();
    }, [inProgress, isResult])

    // To select all from class students list
    const selectList = (selected) => {
        const arr = [];
        if (!selected)
            users.forEach(u => { arr.push(u.name) });

        setSelectedUsers(arr);
    }

    // Navigate to page
    const goTo = (name) => {
        // Save found result i sessionStorage
        sessionStorage.setItem("users", JSON.stringify(users));
        // Navigation
        history.push("/manage-user/" + name);
    }


    // To select one by one user from the class students' list
    const handleSelectedList = (name) => {
        const arr = this.state.selectedUsers;
        if (arr?.length > 0 && arr.indexOf(name) > -1)
            arr.splice(arr.indexOf(name), 1);
        else
            arr.push(name);

        // Update selected users
        this.setState({
            selectedUsers: arr,
            isOpenTip: arr.length > 0
        });

        setTimeout(() => { setIsOpenTip(false); }, 2000)
    }

    return (
        /* Box to view the result of search */
        <div className='interior-div' ref={refResult}>
            {/* Result info box */}
            <ListItem className='search-result-reset'>
                {/* Result info */}
                <ListItemText
                    primary="Result"
                    secondary={ul > 0 ? ("Hittades: " + ul + " användare")
                        : "Ditt sökresultat kommer att visas här nedan"} />

                {clsStudents && ul > 0 ?
                    /* Hidden form to reset selected users password */
                    <Tooltip arrow acti title={`Klicka här att ställa in nytt lösenord för valda ${sl} elev${sl === 1 ? "" : "er"}`}
                        classes={{ tooltip: "tooltip tooltip-blue", arrow: "arrow-blue" }}
                        open={isOpenTip}
                        leaveTouchDelay={1000}
                    >
                        <Button
                            disabled={sl === 0}
                            onClick={() => history.push("/manage-users")}>
                            <Password />
                        </Button>
                    </Tooltip>
                    : null}

                {/* Button to reset search result */}
                <Tooltip arrow disableHoverListener={!isVisibleTips} title="Ta bort sök resultat." classes={{ tooltip: "tooltip tooltip-error", arrow: "arrow-error" }}>
                    <span>
                        <Button variant="text"
                            color="error"
                            onClick={() => resetResult()}
                            disabled={!isResult && ul === 0} ><DeleteSweep /></Button>
                    </span>
                </Tooltip>
            </ListItem>

            {/* Visible image under search progress */}
            {inProgress ? <Loading msg="Var vänlig och vänta, sökning pågår ..." img={loadImg} /> : null}

            {/* Select or deselect all users in class members list */}
            {clsStudents && ul > 0 ?
                /* Hidden form to reset selected users password */
                <List sx={{ width: '100%' }} component="nav">
                    {/* Select or deselect all list */}
                    <ListItem className='search-result-select'>
                        <ListItemAvatar>
                            <Avatar className='user-avatar'>
                                {!selected ? <SelectAll /> : <Deselect color="primary" />}
                            </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                            primary={`${selected ? "Avmarkera" : "Markera"} alla`}
                            secondary={<React.Fragment>
                                <Typography
                                    sx={{ display: 'inline' }}
                                    component="span"
                                    variant="body2"
                                    color={sl > 0 ? "primary" : "inherit"}>
                                    {sl} elev + {sl === 1 ? "" : "er"} har valts
                                </Typography>
                            </React.Fragment>}
                        />
                        <Checkbox
                            checked={selected}
                            onClick={() => selectList(selected)} />
                    </ListItem>
                </List> : null}

            {/* Loop of search result list if result is not null */}
            {users?.length > 0 ?
                <List sx={{ width: '100%' }}>
                    {users.map((s, index) => (
                        /* List object */
                        <ListItem key={index} className="list-link">

                            {/* Avatar */}
                            <ListItemAvatar>
                                <Avatar className='user-avatar'>
                                    <img className="user-avatar" src={user} alt="user" />
                                </Avatar>
                            </ListItemAvatar>

                            {/* User data */}
                            <ListItemText primary={s.name} onClick={() => goTo(s.name)}
                                secondary={<React.Fragment>
                                    <Typography
                                        sx={{ display: 'inline' }}
                                        component="span"
                                        variant="body2"
                                        color="primary"> {s.displayName} </Typography>
                                    <span className='typography-span'>{s.office + " " + s.department}</span>
                                </React.Fragment>} />

                            {/* Checkbox visible only if is success result after users search by class name */}
                            {clsStudents ? <Checkbox
                                size='small'
                                color="default"
                                checked={selectedUsers.indexOf(s.name) > -1}
                                onClick={() => handleSelectedList(s.name)} />
                                : null}
                        </ListItem>))}
                </List> : null}

            {/* Message if result is null */}
            {(isResult && ul === 0) ? <Alert severity={isAlertBg}>{isResponseMessage}</Alert> : null}
        </div>
    )
}
